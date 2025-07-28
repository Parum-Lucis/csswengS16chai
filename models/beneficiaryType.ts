import type { Timestamp } from "firebase/firestore";
import type { AttendedEvents } from "./attendedEventsType.js";
import type { Guardian } from "./guardianType.js";

export interface Beneficiary {
  docID?: string;
  accredited_id?: number; // NaN if waitlist! based on benef. creation
  last_name: string;
  first_name: string;
  birthdate: Timestamp;
  address: string;
  sex: string;
  grade_level: number; // this will be string in later prs
  attended_events?: AttendedEvents[];
  guardians: Guardian[];
  pfpPath?: string;
  pfpFile?: File | null;
  time_to_live?: Timestamp;
}