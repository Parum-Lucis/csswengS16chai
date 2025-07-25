import type { Timestamp } from "firebase/firestore";

export interface Event {
  docID?: string;
  name: string;
  description: string;
  start_date: Timestamp;
  end_date: Timestamp;
  location: string;
  time_to_live?: Timestamp | null;
}