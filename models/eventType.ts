import type { AttendedEvents } from "./attendedEventsType";

export interface Event {
  docID: string;
  event_name: string;
  description: string;
  start_date: Date;
  end_date: Date;
  attendees: AttendedEvents[];
}