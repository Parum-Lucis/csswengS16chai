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
import { DocumentData, getFirestore, QuerySnapshot, Timestamp } from "firebase-admin/firestore";
import { generateRandomPassword } from "./utils/generatePassword";
import { onSchedule } from "firebase-functions/scheduler";
import { createTimestampFromNow } from "./utils/time";
import { onDocumentUpdated } from "firebase-functions/firestore";
import { Beneficiary } from "@models/beneficiaryType";
import { Event } from "@models/eventType";

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
    if (req.auth.uid !== req.data && !req.auth.token.is_admin) return false;

    const uid = req.data;
    try {

        await auth.updateUser(uid, {
            disabled: true
        })
        await auth.updateUser(uid, {
            disabled: true
        })
        await firestore.doc(`volunteers/${uid}`).update(
            { time_to_live: createTimestampFromNow({ days: 30 }) }
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
    const dataRef = await attRef.get();
    dataRef.forEach((att) => {
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
    const attRef = firestore.collection(`events/${event.data?.after.id}/attendees`);
    (await attRef.get()).forEach((att) => batch.update(att.ref, {
        "event_name": (event.data?.after.data() as Event).name,
        "event_start": (event.data?.after.data() as Event).start_date
    }))

    await batch.commit()
})


const isFulfilled = <T>(input: PromiseSettledResult<T>): input is PromiseFulfilledResult<T> =>
    input.status === 'fulfilled'
/*
 * firebase functions:shell
 * setInterval(() => cronCleaner(), 60000)
 */
// this will now run every hour instead of every minute
export const cronCleaner = onSchedule("0 * * * *", async () => {
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
    } catch (e) {
        logger.error(e)
    }

    try {

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
    } catch (e) {
        logger.error(e)
    }

    try {
        // clean events
        const eventSnapshot = await firestore.collection("events")
            .where("time_to_live", "<=", Timestamp.now())
            .get();

        if (eventSnapshot.size === 0) {
            logger.log("No expired events.");
            return;
        } else {
            const bulk = firestore.bulkWriter();
            const attendeesPromise: Promise<QuerySnapshot<DocumentData, DocumentData>>[] = [];
            eventSnapshot.forEach(async doc => {
                bulk.delete(doc.ref);
                attendeesPromise.push(doc.ref.collection("attendees").get());
            })
            const attendees = await Promise.allSettled(attendeesPromise)
            attendees.forEach(res => {
                if (isFulfilled<QuerySnapshot>(res))
                    res.value.forEach(attendee => bulk.delete(attendee.ref))
            })

            // eventSnapshot.forEach(async doc => {
            //     logger.info(`Deleting event ${doc.id}`);
            //     await firestore.doc(`events/${doc.id}`).delete();
            //     logger.info(`Successfully deleted event ${doc.id}`);
            // });

            await bulk.flush()
            await bulk.close()

            logger.info("Successfully deleted events! Count: " + eventSnapshot.size);
        }
    } catch (error) {
        logger.error(error)
    }
})

export { initializeEmulator } from "./initializeEmulator";
export { promoteVolunteerToAdmin } from "./admin/promoteVolunteerToAdmin";
export { restoreDeletedVolunteer } from "./admin/restoreDeletedVolunteer"
// CSV functions
export { importBeneficiaries, exportBeneficiaries } from "./csv/beneficiaries";
export { importVolunteers, exportVolunteers } from "./csv/volunteers";
export { importEvents, exportEvents } from "./csv/events";

export { sendEmailReminder } from "./event/sendEmail";
export { notifyGuardiansBySMS } from "./event/notifyGuardiansBySMS"
export { getSMSCredits } from "./event/getSMSCredits"