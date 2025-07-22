import type { Timestamp } from "firebase/firestore";

export interface AttendedEvents {
  docID: string;
  beneficiaryID: string;
  event_name: string;
  event_start: Timestamp;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  attended?: boolean;
  who_attended?: string;
}