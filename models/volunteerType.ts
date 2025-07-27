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
  pfpPath?: string;
  pfpFile?: File | null; //not stored in firestore. Instead, should be retrieved via getBlob(...) or some other.
  time_to_live?: Timestamp | null;
}