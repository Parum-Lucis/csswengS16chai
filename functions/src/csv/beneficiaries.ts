import { onCall, HttpsError } from "firebase-functions/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

import { Beneficiary as BeneficiaryFrontend } from "@models/beneficiaryType";
import { Guardian } from "@models/guardianType";
import { splitToLines, capitalize, isValidContact, emailRegEx, isValidSex, csvHelpers } from "./helpers";

const firestore = getFirestore();

// override for incoming changes to bene model
type Beneficiary = Omit<BeneficiaryFrontend, "birthdate" | "grade_level"> & {
    birthdate: Timestamp;
    grade_level: string
};

export const importBeneficiaries = onCall<string>(async (req) => {
    logger.log("importBeneficiaries called");
    if (!req.auth || !req.auth.token.is_admin) {
        throw new HttpsError("permission-denied", "Authentication and admin privileges required!");
    }

    const lines = splitToLines(req.data);
    let skipped = 0;

    // process beneficiaries by line
    const importedBeneficiaries: Beneficiary[] = lines.map((line, index) => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, ""));

        // parse guardians
        const guardians: Guardian[] = [0, 1, 2].map(i => {
            const [name, relation, contact_number, email] = [
                values[8 + i * 4] ?? "",
                values[9 + i * 4] ?? "",
                values[10 + i * 4] ?? "",
                values[11 + i * 4] ?? ""
            ];
            const g = { name, relation, contact_number, email };
            if (!g.name && !g.relation && !g.contact_number && !g.email) {
                return null;
            }
            return g;
        }).filter(Boolean) as Guardian[];

        // validate accredited_id: must be blank or a valid number
        if (values[0] && values[0].trim() !== "" && isNaN(Number(values[0]))) {
            logger.warn(`Line ${index + 2} skipped: Invalid accredited_id "${values[0]}".`);
            skipped++;
            return null;
        }

        // parse beneficiary. add birthdate later, remove unnecessary fields
        const b: Omit<Beneficiary, "birthdate" | "attended_events" | "docID"> = {
            accredited_id: values[0] ? Number(values[0]) : NaN,
            first_name: values[1]?.trim() ?? "",
            last_name: values[2]?.trim() ?? "",
            sex: values[3]?.trim() ?? "",
            grade_level: values[5]?.trim() ?? "",
            address: values[6]?.trim() ?? "",
            cluster: values[7]?.trim() ?? "",
            guardians,
            time_to_live: null,
        };

        // validate and format names. skip if missing
        if (!b.first_name || !b.last_name) {
            logger.warn(`Line ${index + 2} skipped: Missing or invalid name fields.`);
            skipped++;
            return null;
        }
        b.first_name = capitalize(b.first_name);
        b.last_name = capitalize(b.last_name);

        // ensure at least one guardian. add placeholder if none
        if (b.guardians.length === 0) {
            b.guardians.push({ name: "", relation: "", contact_number: "", email: "" });
            logger.warn(`Line ${index + 2}: No guardian information provided, added placeholder.`);
        }

        // parse and validate birthdate. add placeholder if none, skip if invalid
        const birthdateStr = values[4]?.trim() ?? "";
        let birthdate: Timestamp;
        if (!birthdateStr) {
            birthdate = Timestamp.fromDate(new Date(1900, 0, 1));
            logger.warn(`Line ${index + 2}: Missing birthdate, added sentinel birthdate.`);
        } else {
            const date = new Date(birthdateStr);
            if (isNaN(date.getTime())) {
                logger.warn(`Line ${index + 2} skipped: Invalid birthdate "${birthdateStr}".`);
                skipped++;
                return null;
            }
            birthdate = Timestamp.fromDate(date);
        }

        // validate sex. skip if invalid, allow if blank

        if (b.sex && !isValidSex(b.sex)) {
            logger.warn(`Line ${line} skipped: Invalid sex value "${b.sex}".`);
            skipped++;
            return null;
        }
        b.sex = b.sex ? b.sex[0].toUpperCase() : ""; // always only get first char if not blank/invalid

        // validate grade level using helper
        if (b.grade_level) {
            const normalizedGrade = csvHelpers.normalizeGradeLevel(b.grade_level);
            if (normalizedGrade === null) {
                logger.warn(`Line ${index + 2} skipped: Invalid grade level "${b.grade_level}".`);
                skipped++;
                return null;
            }
            b.grade_level = normalizedGrade;
        }

        // validate guardians' number & email. 
        for (const [i, g] of b.guardians.entries()) {
            if (g.contact_number && g.contact_number.startsWith("9") && g.contact_number.length === 10) {
                g.contact_number = "0" + g.contact_number;
            }
            const invalidContact = g.contact_number && !isValidContact(g.contact_number);
            const invalidEmail = g.email && !emailRegEx.test(g.email);
            if (invalidContact) {
                // skip if contact invalid
                logger.warn(`Line ${index + 2} skipped: Guardian ${i + 1} has invalid contact number "${g.contact_number}"".`);
                skipped++;
                return null;
            } else if (invalidEmail) {
                // keep blank if invalid email
                logger.warn(`Line ${index + 2}: Guardian ${i + 1} has invalid email "${g.email}". Placeholder used.`);
                g.email = "";
            }
        }

        return { ...b, birthdate } as Beneficiary;
    }).filter(Boolean) as Beneficiary[];

    if (!importedBeneficiaries.length) {
        throw new HttpsError("invalid-argument", "Failed to import any beneficiaries. Please ensure your file contains valid data.");
    }

    logger.info("Imported beneficiaries", { count: importedBeneficiaries.length });
    logger.log(importedBeneficiaries)

    // prepare for batch import and count.
    const importedIds = new Set<number>();
    let importedWaitlist = 0;
    try {
        const batch = firestore.batch();
        const existingSnapshot = await firestore.collection("beneficiaries").where("time_to_live", "==", null).get();

        // Use Map for O(1) duplicate checking
        const existingIds = new Set<number>(existingSnapshot.docs.map(doc => Number(doc.data().accredited_id)));
        const existingNames = new Map<string, boolean>();
        existingSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const nameKey = `${data.first_name?.toLowerCase()}_${data.last_name?.toLowerCase()}`;
            existingNames.set(nameKey, true);
        });

        importedBeneficiaries.forEach(b => {
            if (Number.isNaN(b.accredited_id)) {
                // if no id, skip if name already exist using optimized lookup
                const nameKey = `${b.first_name.toLowerCase()}_${b.last_name.toLowerCase()}`;
                if (existingNames.has(nameKey)) {
                    logger.warn(`Beneficiary "${b.first_name} ${b.last_name}" already exists. Skipping.`);
                    skipped++;
                    return;
                }

                existingNames.set(nameKey, true); // Track in current batch
                importedWaitlist++;
            } else if (existingIds.has(b.accredited_id as number) || importedIds.has(b.accredited_id as number)) {
                // if id provided but already exists, skip
                logger.warn(`Incoming beneficiary with id ${b.accredited_id} already exists. Skipping.`);
                skipped++;
                return;
            }

            const docRef = firestore.collection("beneficiaries").doc();
            batch.set(docRef, b);
            // dont add blank id to list of imported ids
            if (!Number.isNaN(b.accredited_id)) importedIds.add(b.accredited_id as number);
        });

        // check if there are any beneficiaries to add
        if ((importedIds.size + importedWaitlist) === 0) {
            throw new HttpsError("invalid-argument", "No valid beneficiaries were imported. Please ensure your data does not already exist in the system.");
        }

        // add beneficiaries
        await batch.commit();
        logger.info(`New beneficiaries imported successfully! Added: ${importedIds.size + importedWaitlist}, Skipped: ${skipped}`);
    } catch (err: unknown) {
        logger.error("Failed to import CSV", err);
        if (err instanceof Error)
            throw new HttpsError("internal", err.message ?? "Failed to import CSV due to internal error. Please contact an admin or developer for assistance.");
        else
            throw new HttpsError("internal", "Failed to import CSV due to internal error. Please contact an admin or developer for assistance.")
    }

    return { imported: importedIds.size + importedWaitlist, skipped };
});

export const exportBeneficiaries = onCall<void>(async (req) => {
    logger.log("exportBeneficiaries called");
    if (!req.auth) return false;

    // fetch all beneficiaries
    const snapshot = await firestore.collection("beneficiaries").get();
    const docs = snapshot.docs
        .map(doc => doc.data())
        .filter(doc => doc.time_to_live == null);

    if (!docs.length) {
        throw new HttpsError("not-found", "There are no beneficiaries to export.");
    }

    // map fields to headers
    const beneficiaryCols = [
        { label: "Child Number (ID)", field: "accredited_id" },
        { label: "First Name", field: "first_name" },
        { label: "Last Name", field: "last_name" },
        { label: "Sex", field: "sex" },
        { label: "Birthdate", field: "birthdate" },
        { label: "Grade Level", field: "grade_level" },
        { label: "Address", field: "address" },
        { label: "Cluster", field: "cluster" },
    ];

    // add guardian columns (for 3)
    const guardianCols = [];
    for (let i = 1; i <= 3; i++) {
        guardianCols.push(
            { label: `Name (Guardian ${i})`, field: "" },
            { label: `Relation (Guardian ${i})`, field: "" },
            { label: `Contact Number (Guardian ${i})`, field: "" },
            { label: `Email (Guardian ${i})`, field: "" }
        );
    }

    const headers = [...beneficiaryCols, ...guardianCols];

    // build CSV string
    const csvRows = [
        headers.map(header => csvHelpers.escapeField(header.label)).join(","),

        // data rows
        ...docs.map(doc => {
            const guardians: Guardian[] = doc.guardians;
            return [
                ...beneficiaryCols.map(header => {
                    const value = doc[header.field];

                    // handle waitlist ids
                    if (header.field === "accredited_id") {
                        if (!value || Number.isNaN(value)) return csvHelpers.escapeField("");
                        return csvHelpers.escapeField(value);
                    }

                    // handle birthdate format mm/dd/yyyy
                    if (header.field === "birthdate") {
                        return csvHelpers.escapeField(csvHelpers.formatDate(value as Timestamp));
                    }

                    return csvHelpers.escapeField(value);
                }),

                // traverse guardian array and format
                ...[0, 1, 2].flatMap(idx => {
                    const g = guardians[idx] || {};
                    return [
                        csvHelpers.escapeField(g.name || ""),
                        csvHelpers.escapeField(g.relation || ""),
                        csvHelpers.escapeField(g.contact_number || ""),
                        csvHelpers.escapeField(g.email || "")
                    ];
                })
            ].join(",");
        })
    ];
    const csvContent = csvRows.join("\r\n");
    return csvContent;
});