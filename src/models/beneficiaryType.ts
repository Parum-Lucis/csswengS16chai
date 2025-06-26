import type { Timestamp } from "firebase/firestore";
import type { AttendedEvents } from "./attendedEventsType";
import type { Guardian } from "./guardianType";

export interface Beneficiary {
  docID?: string;
  accredited_id?: number;
  last_name: string;
  first_name: string;
  birthdate: Timestamp;
  address: string;
  sex: string;
  grade_level?: number;
  attended_events: AttendedEvents[];
  guardians: Guardian[];
}