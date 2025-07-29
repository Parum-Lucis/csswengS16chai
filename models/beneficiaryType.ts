import type { Timestamp } from "firebase/firestore";
import type { Guardian } from "./guardianType.js";
import type { AttendedEvents } from "./attendedEventsType.js";

export interface Beneficiary {
  docID: string;
  accredited_id: number; // NaN if waitlist!
  last_name: string;
  first_name: string;
  birthdate: Timestamp;
  address: string;
  sex: string;
  grade_level: string;
  attended_events: AttendedEvents[];
  guardians: Guardian[];
  pfpPath?: string;
  pfpFile?: File | null;
  time_to_live?: Timestamp | null; 
}