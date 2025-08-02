import type { Event } from "./eventType.js";

export interface notifyGuardiansBySMSProps {
    phoneNumbers: string;
    eventDetails: string;
    event: Event;
}