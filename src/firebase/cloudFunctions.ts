import { httpsCallable } from "firebase/functions";
import { func } from "./firebaseConfig";
import type { Volunteer } from "@models/volunteerType";

export const callCreateVolunteerProfile = httpsCallable<Volunteer>(func, 'createVolunteerProfile');
export const callDeleteVolunteerProfile = httpsCallable<string>(func, 'deleteVolunteerProfile');