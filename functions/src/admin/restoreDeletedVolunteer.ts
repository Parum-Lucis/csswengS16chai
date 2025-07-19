import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/https";
import { logger } from "firebase-functions/v2";

/**
 * 
 */
export const restoreDeletedVolunteer = onCall<string>(async (req) => {
    if (!req.auth) return false;
    if (!req.auth.token.is_admin) return false;

    const uid = req.data;
    try {

        await Promise.all([
            getAuth().updateUser(uid, { disabled: false }),
            getFirestore().doc(`volunteers/${uid}`).update({ time_to_live: null })
        ])

        return true;

    } catch (error) {
        logger.error(error)
        return false;
    }
})