import { Timestamp } from "firebase-admin/firestore";

export function createTimestampFromNow({
    seconds = 0,
    minutes = 0,
    hours = 0,
    days = 0
}): Timestamp {
    const now = Date.now();
    // converting each time unit to milliseconds
    const shiftedDate = new Date(now +
        seconds * 1000 +
        minutes * 1000 * 60 +
        hours * 1000 * 60 * 60 +
        days * 1000 * 60 * 60 * 24
    )
    return Timestamp.fromDate(shiftedDate);
}