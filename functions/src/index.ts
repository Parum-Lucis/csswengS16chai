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

// import type { Volunteer } from "../../src/models/volunteerType"
// import { generateRandomPassword } from "./util/generatePassword";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
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

export interface Volunteer {
    docID?: string;
    last_name: string;
    first_name: string;
    contact_number: string;
    email: string;
    role: string;
    is_admin: boolean;
    sex: string;
    address: string;
    birthdate: Timestamp;
}

setGlobalOptions({ maxInstances: 10 });

function generateRandomPassword(pass_length: number) {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    return Array.from(crypto.getRandomValues(new Uint32Array(pass_length)))
        .map((x) => chars[x % chars.length])
        .join('')
}

const app = initializeApp();
const auth = getAuth(app);
const firestore = getFirestore(app);

export const createVolunteerProfile = onCall<Volunteer>(async (req) => {
    const { email, is_admin } = req.data;
    try {

        const { uid } = await auth.createUser({
            email,
            password: generateRandomPassword(10),
        })

        await auth.setCustomUserClaims(uid, { is_admin })
        await firestore.doc(`volunteers/${uid}`).create(req.data)
        return true;

    } catch (error) {
        logger.log(error)
        return false;
    }

})