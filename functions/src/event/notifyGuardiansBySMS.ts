import { AttendedEvents } from "@models/attendedEventsType";
import { onCall } from "firebase-functions/https";

type PhilSMSResponse = {
    status: "success" | "error";
    data: string
}

export const notifyGuardiansBySMS = onCall<AttendedEvents[]>(async (req) => {
    const contactList = req.data.map(({ contact_number, first_name, last_name }) => ({ contact_number, first_name, last_name }))
    const contacts = contactList.reduce((prev, curr) => `${prev},63${curr.contact_number.replace(/^0/, "")}`, "")

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${process.env.PHILSMS_API_TOKEN}`);
    headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");

    const message = "THIS IS A TEST. If you receive this message, please disregard. -rdbt"

    const body = {
        recipient: contacts,
        sender_id: "RDBT TEST",
        type: "plain",
        message
    }

    const res = await fetch("https://app.philsms.com/api/v3/sms/send", {
        headers: headers,
        body: JSON.stringify(body)
    })

})