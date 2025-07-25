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
import { onCall } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

import { Volunteer } from "@models/volunteerType";
// import { generateRandomPassword } from "./util/generatePassword";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { generateRandomPassword } from "./utils/generatePassword";
import { onSchedule } from "firebase-functions/scheduler";
import { createTimestampFromNow } from "./utils/time";
import { onDocumentUpdated } from "firebase-functions/firestore";
import { Beneficiary } from "@models/beneficiaryType";
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

export const updateAttendees = onDocumentUpdated("beneficiaries/{docID}", async (event) => {
    const batch = firestore.batch()
    const attRef = firestore.collectionGroup("attendees").where("beneficiaryID", "==", event.data?.after.id);
    (await attRef.get()).forEach((att) => batch.update(att.ref, {
        "first_name": (event.data?.after.data() as Beneficiary).first_name,
        "last_name": (event.data?.after.data() as Beneficiary).last_name
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


export { promoteVolunteerToAdmin } from "./admin/promoteVolunteerToAdmin";
export { restoreDeletedVolunteer } from "./admin/restoreDeletedVolunteer"