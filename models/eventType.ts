export interface Event {
  docID: string;
  event_name: string;
  description: string;
  date: Date;
  is_recurring: boolean;
}