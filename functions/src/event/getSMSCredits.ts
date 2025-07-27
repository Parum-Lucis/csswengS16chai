import { GetSMSCreditsResponse } from "@models/GetSMSCreditsResponse";
import { onCall } from "firebase-functions/https";
import { logger } from "firebase-functions/v2";

type IProgResponseObject = {
    status: string;
    message: string;
    data: {
        load_balance: number
    }
}

export const getSMSCredits = onCall<void, Promise<GetSMSCreditsResponse>>(async () => {
    const url = "https://sms.iprogtech.com/api/v1/account/sms_credits?"

    const params = new URLSearchParams({
        api_token: process.env.IPROG_API_TOKEN ?? ""
    });

    try {
        const res = await fetch(url + params.toString(), {
            headers: {
                "Content-Type": "application/json"
            }
        })

        if (res.ok) {
            const j = await res.json() as IProgResponseObject;
            return { credits: j.data.load_balance, success: true };
        }

        throw new Error("Something happened.");

    } catch (error) {
        logger.error(error)
        return { credits: -1, success: false };
    }
})