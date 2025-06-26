import type { Timestamp } from "firebase/firestore";

export interface Volunteer {
  docID?: string;
  last_name: string;
  first_name: string;
  contact_number: number;
  email: string;
  role: string;
  sex: string;
  birthdate: Timestamp;
  address: string;
  is_admin: boolean;
}