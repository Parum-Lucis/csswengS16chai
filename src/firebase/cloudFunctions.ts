import { httpsCallable } from "firebase/functions";
import { func } from "./firebaseConfig";
import type { Volunteer } from "@models/volunteerType";
import type { Event } from "@models/eventType";

export const callCreateVolunteerProfile = httpsCallable<Volunteer>(func, 'createVolunteerProfile');
export const callDeleteVolunteerProfile = httpsCallable<string>(func, 'deleteVolunteerProfile');
export const callDeleteBeneficiaryProfile = httpsCallable<string>(func, 'deleteBeneficiaryProfile');
export const callPromoteVolunteerToAdmin = httpsCallable<string>(func, 'promoteVolunteerToAdmin');
export const callRestoreDeletedVolunteer = httpsCallable<string, boolean>(func, "restoreDeletedVolunteer");
export const callDeleteEvent = httpsCallable<string>(func, 'deleteEvent');
export const sendEmailReminder = httpsCallable<Event, boolean>(func, 'sendEmailReminder');
