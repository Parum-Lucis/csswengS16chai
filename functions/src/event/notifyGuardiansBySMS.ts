import { IProgSMSResObject } from "@models/IProgSMSResObject";
import { notifyGuardiansBySMSProps } from "@models/notifyGuardiansBySMSProps";
import { FirestoreDataConverter, getFirestore, QueryDocumentSnapshot, Timestamp } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/https";
import type { AttendedEvents } from "@models/attendedEventsType";
import { formatInTimeZone } from "date-fns-tz";

const url = 'https://sms.iprogtech.com/api/v1/sms_messages/send_bulk';
const attendeesConverter: FirestoreDataConverter<AttendedEvents> = {
    toFirestore: (event) => event,
    fromFirestore: (snapshot: QueryDocumentSnapshot<AttendedEvents>) => {
        const data = snapshot.data();
        return {
            ...data,
            docID: snapshot.id,
        }
    }
}

function toPhilTime(d: Timestamp) {
    return formatInTimeZone(new Date(d.seconds * 1000), "Asia/Manila", "h:mm bb");
}

export const notifyGuardiansBySMS = onCall<notifyGuardiansBySMSProps, Promise<IProgSMSResObject>>(async (req) => {
    if (!req.auth) return { status: 401, message: "Not logged in." };
    if (!req.auth.token.is_admin) return { status: 403, message: "Not an admin." };

    console.log(req.data.event)

    const { docID, name, description, start_date, end_date } = req.data.event;
    const attendees = await getFirestore().collection(`events/${docID}/attendees`).withConverter(attendeesConverter).get();
    const numbers = attendees.docs.map(snapshot => snapshot.data().contact_number)

    const eventTitle = `This is a reminder to attend the event titled ${name}, `
    const eventTime = `between ${toPhilTime(start_date)} and ${toPhilTime(end_date)} on ${formatInTimeZone(new Date(start_date.seconds * 1000), "Asia/Manila", "MMMM d, yyyy")}.`
    const eventBlurb = `About the event: ${description}`
    const eventDetails = [eventTitle + eventTime, eventBlurb].reduce((prev, curr) => prev + "\n\n" + curr, "").replace(/^\n\n/, "");


    const data = new URLSearchParams({
        api_token: process.env.IPROG_API_TOKEN ?? "",
        message: eventDetails,
        phone_number: numbers.reduce((prev, curr) => (curr.length === 0 ? prev : prev + "," + curr), "").replace(/^,/, "")
    });

    console.log(url + data.toString())
    try {
        const res = await fetch(url + "?" + data.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        })

        const j = await res.json() as IProgSMSResObject;
        return j;

    } catch (e) {
        console.error(e);
        return {
            status: 400,
            message: "Something went wrong"
        };
    }

})