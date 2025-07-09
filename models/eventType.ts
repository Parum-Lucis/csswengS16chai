import type { Timestamp } from "firebase/firestore";
import type { AttendedEvents } from "./attendedEventsType";

export interface Event {
  docID: string;
  event_name: string;
  description: string;
  start_date: Timestamp;
  end_date: Timestamp;
  attendees: AttendedEvents[];
}