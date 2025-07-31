import { getAuth } from "firebase-admin/auth"
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/https"

const auth = getAuth();
const db = getFirestore();

export const initializeEmulator = onCall(async () => {

    const { uid: uid1 } = await auth.createUser({
        email: "admin@chai.com",
        password: "firebase"
    })

    await Promise.all([
        auth.setCustomUserClaims(uid1, { is_admin: true }),
        db.doc(`volunteers/${uid1}`).create({
            address: "wherever",
            birthdate: Timestamp.fromDate(new Date("April 17, 2004")),
            contact_number: "09876543211",
            email: "admin@chai.com",
            sex: "Female",
            first_name: "admin",
            last_name: "person",
            is_admin: true,
            role: "Admin",
            time_to_live: null
        })
    ])

    const { uid: uid2 } = await auth.createUser({
        email: "volunteer@chai.com",
        password: "firebase"
    })

    await Promise.all([
        auth.setCustomUserClaims(uid2, { is_admin: true }),
        db.doc(`volunteers/${uid2}`).create({
            docID: "",
            address: "wherever",
            birthdate: Timestamp.fromDate(new Date("October 16, 2004")),
            contact_number: "09876543211",
            email: "volunteer@chai.com",
            sex: "Female",
            first_name: "volunteer",
            last_name: "person",
            is_admin: true,
            role: "Volunteer",
            time_to_live: null
        })
    ])

    const bulk = db.bulkWriter();

    // creating three beneficiaries
    bulk.set(db.doc('beneficiaries/b1'), {
        docID: "",
        address: "LRT1",
        attended_events: [],
        birthdate: Timestamp.fromDate(new Date("July 26, 2014")),
        first_name: "Pedro",
        last_name: "Gil",
        grade_level: 6,
        guardians: [
            {
                contact_number: "09876543211",
                email: "b1_gil@gmail.com",
                name: "Gil Puyat",
                relation: "Father"
            }
        ],
        sex: "Male",
        time_to_live: null
    });

    bulk.set(db.doc("beneficiaries/b2"), {
        docID: "",
        address: "LRT1",
        attended_events: [],
        birthdate: Timestamp.fromDate(new Date("January 3, 2015")),
        first_name: "Vito",
        last_name: "Cruz",
        grade_level: 6,
        guardians: [
            {
                contact_number: "09876543211",
                email: "j_dc@gmail.com",
                name: "Juan Dela Cruz",
                relation: "Father"
            }
        ],
        sex: "Male",
        time_to_live: null
    });

    bulk.set(db.doc("beneficiaries/b3"), {
        docID: "",
        address: "LRT2",
        attended_events: [],
        birthdate: Timestamp.fromDate(new Date("January 3, 2019")),
        first_name: "Betty",
        last_name: "Go",
        grade_level: 1,
        guardians: [
            {
                contact_number: "09876543211",
                email: "lang_go@gmail.com",
                name: "Go Lang",
                relation: "Mother"
            }
        ],
        sex: "Female",
        time_to_live: null
    });

    bulk.set(db.doc("events/e1"), {
        attendees: [],
        description: "fatten up the children!",
        end_date: Timestamp.fromDate(new Date(2025, 4, 3, 10)),
        start_date: Timestamp.fromDate(new Date(2025, 4, 3, 11)),
        location: "Taguig",
        name: "Hansel and Gretel",
        time_to_live: null
    })

    bulk.flush();
})