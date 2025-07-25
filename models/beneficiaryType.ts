import type { Timestamp } from "firebase/firestore";
import type { Guardian } from "./guardianType.js";

export interface Beneficiary {
  docID: string;
  accredited_id: number; // NaN if waitlist!
  last_name: string;
  first_name: string;
  birthdate: Timestamp;
  address: string;
  sex: string;
  grade_level: number;
  guardians: Guardian[];
  time_to_live?: Timestamp | null;
}