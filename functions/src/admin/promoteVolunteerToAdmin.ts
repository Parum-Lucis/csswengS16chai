
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/https";
import { logger } from "firebase-functions/v2";

/**
 * promotes a volunteer to admin. Is idempotent.
 * Will fail if user (that called the function) is not an admin.
 * i.e. only admins can promote volunteers.
 * @params data.uid    string uid of the volunteer to be promoted.
 */
export const promoteVolunteerToAdmin = onCall<string>(async (req) => {
    if (!req.auth) return false;
    if (!req.auth.token.is_admin) return false;

    const uid = req.data;
    try {

        await Promise.all([
            getAuth().setCustomUserClaims(uid, { is_admin: true }),
            getFirestore().doc(`volunteers/${uid}`).update({ "is_admin": true, "role": "Admin" })
        ]);
        return true;

    } catch (error) {
        logger.error(error)
        return false;
    }

})