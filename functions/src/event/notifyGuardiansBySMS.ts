import { IProgSMSResObject } from "@models/IProgSMSResObject";
import { notifyGuardiansBySMSProps } from "@models/notifyGuardiansBySMSProps";
import { onCall } from "firebase-functions/https";



export const notifyGuardiansBySMS = onCall<notifyGuardiansBySMSProps, Promise<IProgSMSResObject>>(async (req) => {

    const { phoneNumbers, eventDetails } = req.data;
    const url = 'https://sms.iprogtech.com/api/v1/sms_messages/send_bulk';
    const data = new URLSearchParams({
        api_token: process.env.IPROG_API_TOKEN ?? "",
        message: eventDetails,
        phone_number: phoneNumbers
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