/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { setGlobalOptions } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

import { Volunteer } from "@models/volunteerType";
// import { generateRandomPassword } from "./util/generatePassword";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { generateRandomPassword } from "./utils/generatePassword";
import { onSchedule } from "firebase-functions/scheduler";
import { createTimestampFromNow } from "./utils/time";
import { onDocumentUpdated } from "firebase-functions/firestore";
import { Beneficiary as BeneficiaryFrontend } from "@models/beneficiaryType";
import { Guardian } from "@models/guardianType"
import { Event } from "@models/eventType";
import 'dotenv/config';

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.

setGlobalOptions({ maxInstances: 10 });


const app = initializeApp();
const auth = getAuth(app);
const firestore = getFirestore(app);

// issue with Timestamp type used; dapat from firebase-admin package but our model
// uses the one from non-admin, so they dont match. my workaround for now: 
type Beneficiary = Omit<BeneficiaryFrontend, "birthdate" | "grade_level"> & { birthdate: Timestamp; grade_level: string };


/**
 * Helper that splits a CSV string into non-empty lines.
 * Ignores first header.
 * Throws error if there are less than 2 lines (header + at least one data row).
 */
function splitToLines(csv: string): string[] {
    const ignoreHeader = true; // adjust if need

    // remove blank rows
    csv = csv
        .split(/\r?\n/)
        .filter(line => line.split(",").some(cell => cell.trim() !== ""))
        .join("\n");
    csv = csv.replace(/\t/g, ",");
    const lines = csv.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
        throw new HttpsError("invalid-argument", "CSV must contain at least one data row.");
    }
    return ignoreHeader ? lines.slice(1) : lines;
}

/**
 * Helper that properly capitalizes names.
 * Splits names by " " and "-".
 * Makes the first letter of each atomic name uppercase, while the rest are lowercase.
 */
const capitalize = (str: string) =>
    str.split(" ").map(word =>
        word
            .split("-")
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join("-")
    ).join(" ");

/**
 * Helper that checks if contact_number is valid.
 * Requires number to be 11 characters and to start with "09".
 */
const isValidContact = (num: string) =>
    num.length === 11 && num.startsWith("09");

// regex used for emails
const emailRegEx = new RegExp(
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
); // from https://emailregex.com/

// list of valid grade levels
const validGradeLevels = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "n", "k"
];

export const promoteMetoAdmin = onCall(async (req) => {
    if (!req.auth) return false;
    const { uid } = req.auth;
    await auth.setCustomUserClaims(uid, { is_admin: true });
    firestore.doc(`volunteers/${uid}`).update(
        {
            role: "Admin",
            is_admin: true
        }
    )
    return true;
})

export const createVolunteerProfile = onCall<Volunteer>(async (req) => {
    if (!req.auth) return false;
    if (!req.auth.token.is_admin) return false;

    const { first_name, last_name, contact_number, email, role, is_admin, sex, address, birthdate, pfpPath } = req.data;
    console.log(req.data);
    try {

        const { uid } = await auth.createUser({
            email,
            password: generateRandomPassword(10),
        })

        await Promise.all([
            auth.setCustomUserClaims(uid, { is_admin }),
            firestore.doc(`volunteers/${uid}`).create({
                first_name,
                last_name,
                contact_number,
                email,
                role,
                is_admin,
                sex,
                address,
                pfpPath: pfpPath === undefined || pfpPath.length === 0 ? null : pfpPath,
                birthdate: new Timestamp(birthdate.seconds, birthdate.nanoseconds),
                time_to_live: null
            })
        ])

        return true;

    } catch (error) {
        logger.error(error)
        return false;
    }

})

export const deleteVolunteerProfile = onCall<string>(async (req) => {
    if (!req.auth) return false;
    if (req.auth.uid !== req.data && !req.auth.token.is_admin) return false;

    const uid = req.data;
    try {

        await auth.updateUser(uid, {
            disabled: true
        })
        await firestore.doc(`volunteers/${uid}`).update(
            { time_to_live: createTimestampFromNow({ seconds: 30 }) }
        )
        return true;

    } catch (error) {
        logger.error(error)
        return false;
    }
})

export const updateAttendeesBeneficiary = onDocumentUpdated("beneficiaries/{docID}", async (event) => {
    const batch = firestore.batch()
    const attRef = firestore.collectionGroup("attendees").where("beneficiaryID", "==", event.data?.after.id);
    (await attRef.get()).forEach((att) => {
        const data = event.data?.after.data() as Beneficiary;
        batch.update(att.ref, {
            "first_name": data.first_name,
            "last_name": data.last_name,
            "contact_number": data.guardians[0].contact_number,
            "email": data.guardians[0].email
        })
    })

    await batch.commit()
})

export const updateAttendeesEvent = onDocumentUpdated("events/{docID}", async (event) => {
    const batch = firestore.batch()
    const attRef = firestore.collectionGroup("attendees").where("docID", "==", event.data?.after.id);
    (await attRef.get()).forEach((att) => batch.update(att.ref, {
        "event_name": (event.data?.after.data() as Event).name,
        "event_start": (event.data?.after.data() as Event).start_date
    }))

    await batch.commit()
})

/*
 * firebase functions:shell
 * setInterval(() => cronCleaner(), 60000)
 */
export const cronCleaner = onSchedule("every 1 minutes", async () => {
    try {
        logger.log("Cleanup running!")
        // Clean volunteers
        const snapshot = await firestore.collection("volunteers")
            .where("time_to_live", "<=", Timestamp.now())
            .get();

        if (snapshot.size === 0) {
            logger.log("No volunteers to kill sadj");
        } else {
            snapshot.forEach(async doc => {
                logger.info(`Deleting volunteer ${doc.id}`);
                await Promise.all([
                    auth.deleteUser(doc.id),
                    firestore.doc(`volunteers/${doc.id}`).delete()
                ])
                logger.info(`Successfully deleted volunteer ${doc.id}`);
            })

            logger.info("Successfully deleted a bunch of volunteers! Count: " + snapshot.size)
        }

        // Clean beneficiaries
        const beneficiarySnapshot = await firestore.collection("beneficiaries")
            .where("time_to_live", "<=", Timestamp.now())
            .get();

        if (beneficiarySnapshot.size === 0) {
            logger.log("No expired beneficiaries.");
        } else {
            beneficiarySnapshot.forEach(async doc => {
                logger.info(`Deleting beneficiary ${doc.id}`);
                await firestore.doc(`beneficiaries/${doc.id}`).delete()
                logger.info(`Successfully deleted beneficiary ${doc.id}`);
            })

            logger.info("Successfully deleted beneficiaries! Count:" + beneficiarySnapshot.size)
        }

        // clean events
        const eventSnapshot = await firestore.collection("events")
            .where("time_to_live", "<=", Timestamp.now())
            .get();

        if (eventSnapshot.size === 0) {
            logger.log("No expired events.");
            return;
        }

        eventSnapshot.forEach(async doc => {
            logger.info(`Deleting event ${doc.id}`);
            await firestore.doc(`events/${doc.id}`).delete();
            logger.info(`Successfully deleted event ${doc.id}`);
        });

        logger.info("Successfully deleted events! Count: " + eventSnapshot.size);
    } catch (error) {
        logger.error(error)
    }
})

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
                values[7 + i * 4] ?? "",
                values[8 + i * 4] ?? "",
                values[9 + i * 4] ?? "",
                values[10 + i * 4] ?? ""
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
        let b: Omit<Beneficiary, "birthdate" | "attended_events" | "docID"> = {
            accredited_id: values[0] ? Number(values[0]) : NaN,
            first_name: values[1]?.trim() ?? "",
            last_name: values[2]?.trim() ?? "",
            sex: values[3]?.trim() ?? "",
            grade_level: values[5]?.trim() ?? "",
            address: values[6]?.trim() ?? "",
            guardians,
            time_to_live: null,
        };
        


        // validate and format names. skip if missing
        if (!b.first_name || !b.last_name ) {
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
        if (b.sex && b.sex.toLowerCase() !== "m" && b.sex.toLowerCase() !== "f") {
            logger.warn(`Line ${index + 2} skipped: Invalid sex value "${b.sex}".`);
            skipped++;
            return null;
        }

        // validate grade level. skip if invalid, allow if blank
        if (b.grade_level && !validGradeLevels.includes(b.grade_level)) {
            logger.warn(`Line ${index + 2} skipped: Invalid grade level "${b.grade_level}".`);
            skipped++;
            return null;
        }

        // validate guardians' number & email. skip if contact invalid (if invalid email save blank)
        for (const [i, g] of b.guardians.entries()) {
            const invalidContact = g.contact_number && !isValidContact(g.contact_number);
            const invalidEmail = g.email && !emailRegEx.test(g.email);

            if (invalidContact) {
                logger.warn(`Line ${index + 2} skipped: Guardian ${i + 1} has invalid contact number \"${g.contact_number}\"".`);
                skipped++;
                return null;
            } else if (invalidEmail) {
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

    // prepare for batch import and count.
    const importedIds = new Set<number>();
    let importedWaitlist = 0;
    try {
        const batch = firestore.batch();
        const existingSnapshot = await firestore.collection("beneficiaries").where("time_to_live", "==", null).get();
        const existingIds = new Set<number>(existingSnapshot.docs.map(doc => Number(doc.data().accredited_id)));

        importedBeneficiaries.forEach(b => {

            if (Number.isNaN(b.accredited_id)) {
                // if no id, skip if name already exist
                const duplicate = Array.from(existingSnapshot.docs).find(doc => {
                    const data = doc.data();
                    return (
                        data.first_name?.toLowerCase() === b.first_name.toLowerCase() &&
                        data.last_name?.toLowerCase() === b.last_name.toLowerCase()
                    );
                });
                
                if (duplicate) {
                    logger.warn(`Beneficiary "${b.first_name} ${b.last_name}" already exists. Skipping.`);
                    skipped++;
                    return;
                }

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
    } catch (err: any) {
        logger.error("Failed to import CSV", err);
        throw new HttpsError("internal", err.message ?? "Failed to import CSV due to internal error. Please contact an admin or developer for assistance.");
    }

    return { imported: importedIds.size + importedWaitlist, skipped };
});

// not done
export const importEvents = onCall<string>(async (req) => {
    logger.log("importEvents called");
    console.log("importEvents called");
    if (!req.auth) return false;

    // split and skip header
    const lines = splitToLines(req.data);

    const importedEvents = lines.map((line, index) => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, ""));

        const [name, description, dateStr, startTimeStr, endTimeStr, location] = values;

        // parse date and times
        const date = dateStr.trim();
        const startTime = startTimeStr.trim();
        const endTime = endTimeStr.trim();

        var startDateTime, endDateTime;

        try {
            startDateTime = new Date(date);
            endDateTime = new Date(date);

            // set hours and minutes for start and end times
            const [startHourStr, startMinuteStr] = (startTime as string).split(":");
            const [endHourStr, endMinuteStr] = (endTime as string).split(":");
            const startHour = Number(startHourStr);
            const startMinute = Number(startMinuteStr);
            const endHour = Number(endHourStr);
            const endMinute = Number(endMinuteStr);

            // check if parsing went ok
            if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
                logger.warn(`Line ${index + 2} skipped: Invalid start or end time format.`);
                return null;
            }
            startDateTime.setUTCHours(startHour - 8, startMinute, 0, 0);
            endDateTime.setUTCHours(endHour - 8, endMinute, 0, 0);

            logger.log(startDateTime, endDateTime)
        } catch (err) {
            logger.warn(`Line ${index + 2} skipped: Error parsing date or time.`);
            return null;
        }

        // cut to 255 characters, as per specs
        const trimmedDescription = description.trim().slice(0, 255);

        return {
            name: name.trim(),
            description: trimmedDescription,
            start_date: Timestamp.fromDate(startDateTime),
            end_date: Timestamp.fromDate(endDateTime),
            location: location.trim(),
            time_to_live: null,
        } as Event;
    }).filter(Boolean);

    if (!importedEvents.length) {
        throw new HttpsError("invalid-argument", "No valid events to import.");
    }

    let imported = 0;
    let skipped = 0;

    try {
        const eventsSnapshot = await firestore.collection("events").where("time_to_live", "==", null).get();
    
        var existingEvents = eventsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                name: data.name,
                start_date: data.start_date,
                end_date: data.end_date
            };
        });

        const batch = firestore.batch();
        importedEvents.forEach(event => {
            if (!event) return;
            
            const existing = existingEvents.filter(existingEvent => {
                return (
                    existingEvent.name.trim().toLowerCase() === event.name.trim().toLowerCase() &&
                    existingEvent.start_date.toMillis() === event.start_date.toMillis() &&
                    existingEvent.end_date.toMillis() === event.end_date.toMillis()
                );
            });

            if (existing.length > 0) {
                logger.warn(`Event "${event.name}" with same start and end date already exists. Skipping.`);
                skipped++;
                return;
            }

            const docRef = firestore.collection("events").doc();
            batch.set(docRef, event);
            existingEvents.push({
                name: event.name,
                start_date: event.start_date,
                end_date: event.end_date
            });
            imported++;
        });
        await batch.commit();
        logger.info(`Imported ${importedEvents.length} events successfully.`);
    } catch (err: any) {
        logger.error("Failed to import events CSV", err);
        throw new HttpsError("internal", err.message ?? "Failed to import events.");
    }

    if (imported === 0) {
        throw new HttpsError("invalid-argument", "No valid events were imported. Please ensure your data does not already exist in the system.");
    }
    
    return { imported, skipped };
});

// not done
export const importVolunteers = onCall<string>(async (req) => {
    logger.log("importVolunteers called");
    console.log("importVolunteers called");
    if (!req.auth) return false;
    if (!req.auth.token.is_admin) return false;

    const lines = splitToLines(req.data);

    const importedVolunteers: Volunteer[] = lines.map((line, index) => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, ""));
        var [email, first_name, last_name, sex, birthdateStr, contact_number, address, is_adminStr] = values;
        
        // check if all required fields exist
        if (!email || !first_name || !last_name || !is_adminStr) {
            logger.warn(`Line ${index + 2} skipped: Missing required fields.`);
            return null;
        }

        // validate email. skip if invalid
        if (!emailRegEx.test(email.trim())) {
            logger.warn(`Line ${index + 2} skipped: Invalid email format.`);
            return null;
        }

        // validate name and 
        if (!first_name.trim() || !last_name.trim() || !isNaN(Number(first_name.trim())) || !isNaN(Number(last_name.trim()))) {
            logger.warn(`Line ${index + 2} skipped: Missing or invalid name fields.`);
            return null;
        }
        first_name = capitalize(first_name.trim());
        last_name = capitalize(last_name.trim());

        // validate birthdate. skip if invalid, placeholder if blank
        let birthdate: Timestamp;
        if (birthdateStr.trim() === "") {
            birthdate = Timestamp.fromDate(new Date(1900, 0, 1));
        } else {
            const date = new Date(birthdateStr.trim());
            if (isNaN(date.getTime())) {
                logger.warn(`Line ${index + 2} skipped: Invalid birthdate.`);
                return null;
            }
            birthdate = Timestamp.fromDate(date);
        }

        // validate admin bool. if blank/invalid = false
        const is_admin = is_adminStr.trim().toLowerCase() === "true";
        return {
            email: email.trim(),
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            sex: sex.trim(),
            birthdate,
            address: address.trim(),
            contact_number: contact_number.trim(),
            is_admin,
            role: is_admin ? "Admin" : "Volunteer",
            time_to_live: null,
        } as Volunteer;
    }).filter(Boolean) as Volunteer[];

    if (importedVolunteers.length === 0) {
        throw new HttpsError("invalid-argument", "No valid volunteers to import.");
    }

    const existingSnapshot = await firestore.collection("volunteers").where("time_to_live", "==", null).get();
    const existingEmails = new Set<string>(existingSnapshot.docs.map(doc => String(doc.data().email).toLowerCase()));
    
    let skipped = 0;
    let imported = 0;

    await Promise.all(importedVolunteers.map(async volunteer => {
        if (existingEmails.has(volunteer.email.toLowerCase())) {
            logger.warn(`Volunteer with email ${volunteer.email} already exists. Skipping.`);
            skipped++;
            return;
        }
        try {
            const { uid } = await auth.createUser({
                email: volunteer.email,
                password: generateRandomPassword(10),
            });
            await Promise.all([
                auth.setCustomUserClaims(uid, { is_admin: volunteer.is_admin }),
                firestore.doc(`volunteers/${uid}`).create(volunteer),
            ]);
            imported++;
            existingEmails.add(volunteer.email.toLowerCase());
        } catch (error) {
            logger.warn(`Failed to import volunteer ${volunteer.email}: ${error}`);
            skipped++;
        }
    }));

    if (imported === 0) {
        throw new HttpsError("invalid-argument", "No valid volunteers were imported. Please ensure your data does not already exist in the system.");
    }

    return { imported, skipped };
});

// done
export const exportBeneficiaries = onCall<void>(async (req) => {
    logger.log("exportBeneficiaries called");
    console.log("exportBeneficiaries called");
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
        headers.map(header => header.label).join(","), // header row without quotes

        // data rows
        ...docs.map(doc => {
            const guardians: Guardian[] = doc.guardians;
            return [
                ...beneficiaryCols.map(header => {
                    let value = doc[header.field];

                    // handle waitlist ids
                    if (header.field === "accredited_id") {
                        if (!value || Number.isNaN(value)) return "";
                    }

                    // handle birthdate format mm/dd/yyyy
                    if (header.field === "birthdate") {
                        const dateObj = (value as Timestamp).toDate();
                        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const dd = String(dateObj.getDate()).padStart(2, '0');
                        const yyyy = dateObj.getFullYear();
                        return `${mm}/${dd}/${yyyy}`;
                    }

                    // remove quotes, just plain value
                    if (typeof value === "string") {
                        return value.replace(/"/g, '');
                    }
                    return value !== undefined ? value : "";
                }),

                // traverse guardian array and format
                ...[0, 1, 2].flatMap(idx => {
                    const g = guardians[idx] || {};
                    return [
                        g.name ? String(g.name).replace(/"/g, '') : "",
                        g.relation ? String(g.relation).replace(/"/g, '') : "",
                        g.contact_number ? String(g.contact_number).replace(/"/g, '') : "",
                        g.email ? String(g.email).replace(/"/g, '') : ""
                    ];
                })
            ].join(",");
        })
    ];
    const csvContent = csvRows.join("\r\n");
    return csvContent;
});

export const exportEvents = onCall<void>(async (req) => {
    logger.log("exportEvents called");
    console.log("exportEvents called");
    if (!req.auth) return false;

    // fetch all events
    const snapshot = await firestore.collection("events").get();
    const docs = snapshot.docs
        .map(doc => doc.data())
        .filter(doc => doc.time_to_live == null);
    if (!docs.length) {
        throw new HttpsError("not-found", "There are no events to export.");
    }

    // define headers
    const headers = [
        "Name", "Description", "Date", "Start Time", "End Time", "Location"
    ];

    const csvRows = [
        headers.join(","),
        ...docs.map(doc => {
            const event = doc as Event;
            const startDateObj = event.start_date.toDate();
            const endDateObj = event.end_date.toDate();

            // format date mm/dd/yyyy
            const mm = String(startDateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(startDateObj.getDate()).padStart(2, '0');
            const yyyy = startDateObj.getFullYear();
            const date = `${mm}/${dd}/${yyyy}`;

            // format time hh:mm 24-hr
            const formatTime = (d: Date) => {
                const hr = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                return `${hr}:${min}`;
            };

            return [
                event.name || "",
                event.description || "",
                date,
                formatTime(startDateObj),
                formatTime(endDateObj),
                event.location || ""
            ].join(",");
        })
    ];
    const csvContent = csvRows.join("\r\n");
    return csvContent;
});

export const exportVolunteers = onCall<void>(async (req) => {
    logger.log("exportVolunteers called");
    console.log("exportVolunteers called");
    if (!req.auth) return false;
    // fetch all volunteers
    const snapshot = await firestore.collection("volunteers").get();
    const docs = snapshot.docs
        .map(doc => doc.data() as Volunteer)
        .filter(vol => vol.time_to_live == null);
    if (!docs.length) {
        throw new HttpsError("not-found", "There are no volunteers to export.");
    }

    // define headers
    const headers = [
        "Email", "First Name", "Last Name", "Sex", "Birthdate", "Contact Number", "Address", "Admin"
    ];

    // build rows
    const csvRows = [
        headers.join(","),
        ...docs.map(vol => {
            // format date mm/dd/yyyy
            const birthdateObj = vol.birthdate.toDate();
            const mm = String(birthdateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(birthdateObj.getDate()).padStart(2, '0');
            const yyyy = birthdateObj.getFullYear();
            const birthdateStr = `${mm}/${dd}/${yyyy}`;
            return [
                vol.email || "",
                vol.first_name || "",
                vol.last_name || "",
                vol.sex || "",
                birthdateStr,
                vol.contact_number || "",
                vol.address || "",
                vol.is_admin ? "TRUE" : "FALSE"
            ].join(",");
        })
    ];
    const csvContent = csvRows.join("\r\n");
    return csvContent;
});

export { sendEmailReminder } from "./sendEmail";
export { promoteVolunteerToAdmin } from "./admin/promoteVolunteerToAdmin";
export { restoreDeletedVolunteer } from "./admin/restoreDeletedVolunteer"
export { notifyGuardiansBySMS } from "./event/notifyGuardiansBySMS"
export { getSMSCredits } from "./event/getSMSCredits"
