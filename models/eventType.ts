import type { Timestamp } from "firebase/firestore";
import type { AttendedEvents } from "./attendedEventsType";

export interface Event {
  docID?: string;
  name: string;
  description: string;
  start_date: Timestamp;
  end_date: Timestamp;
  location: string;
  attendees?: AttendedEvents[]; // optional because we use collection instead
  time_to_live?: Timestamp | null;
}