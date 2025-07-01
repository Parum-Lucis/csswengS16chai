import type { Timestamp } from "firebase/firestore";

export interface Volunteer {
  docID: string;
  last_name: string;
  first_name: string;
  contact_number: string;
  email: string;
  role: string;
  is_admin: boolean;
  sex: string;
  address: string;
  birthdate: Timestamp;
}