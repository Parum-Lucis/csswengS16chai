import { onCall, HttpsError } from "firebase-functions/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";

import { Volunteer } from "@models/volunteerType";
import { generateRandomPassword } from "../utils/generatePassword";
import { 
    splitToLines, 
    capitalize, 
    isValidContact, 
    emailRegEx,
    isValidSex, 
    csvHelpers 
} from "./helpers";

const firestore = getFirestore();
const auth = getAuth();

export const importVolunteers = onCall<string>(async (req) => {
    logger.log("importVolunteers called");
    if (!req.auth) return false;
    if (!req.auth.token.is_admin) return false;

    const lines = splitToLines(req.data);
    let skipped = 0;

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

        // validate name and check for numbers
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

        // validate sex.
        if (sex && !isValidSex(sex[0])) {
            logger.warn(`Line ${line} skipped: Invalid sex value "${sex}".`);
            skipped++;
            return null;
        }
        sex = sex ? sex[0].toUpperCase() : ""; // always only get first char if not blank/invalid


        // validate contact number
        if (contact_number && !isValidContact(contact_number.trim())) {
            logger.warn(`Line ${index + 2} skipped: Invalid contact number "${contact_number}".`);
            return null;
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

export const exportVolunteers = onCall<void>(async (req) => {
    logger.log("exportVolunteers called");
    if (!req.auth) return false;
    if (!req.auth.token.is_admin) return false;

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
        headers.map(header => csvHelpers.escapeField(header)).join(","),
        ...docs.map(vol => {
            return [
                csvHelpers.escapeField(vol.email || ""),
                csvHelpers.escapeField(vol.first_name || ""),
                csvHelpers.escapeField(vol.last_name || ""),
                csvHelpers.escapeField(vol.sex || ""),
                csvHelpers.escapeField(csvHelpers.formatDate(vol.birthdate)),
                csvHelpers.escapeField(vol.contact_number || ""),
                csvHelpers.escapeField(vol.address || ""),
                csvHelpers.escapeField(vol.is_admin ? "TRUE" : "FALSE")
            ].join(",");
        })
    ];
    const csvContent = csvRows.join("\r\n");
    return csvContent;
});