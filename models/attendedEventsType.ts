export interface AttendedEvents {
  docID: string;
  beneficiaryID: string;
  first_name: string;
  last_name: string;
  attended?: boolean;
  who_attended?: string;
}