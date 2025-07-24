import { httpsCallable } from "firebase/functions";
import { func } from "./firebaseConfig";
import type { Volunteer } from "@models/volunteerType";

export const callCreateVolunteerProfile = httpsCallable<Volunteer>(func, 'createVolunteerProfile');
export const callDeleteVolunteerProfile = httpsCallable<string>(func, 'deleteVolunteerProfile');
export const callDeleteBeneficiaryProfile = httpsCallable<string>(func, 'deleteBeneficiaryProfile');
export const callDeleteEvent = httpsCallable<string>(func, 'deleteEvent');
export const callImportBeneficiaries = httpsCallable<string, { imported: number; skipped: number }>(func, 'importBeneficiaries');
export const callImportEvents = httpsCallable<string, { imported: number; skipped: number }>(func, 'importEvents');
export const callImportVolunteers = httpsCallable<string, { imported: number; skipped: number }>(func, 'importVolunteers');
export const callExportBeneficiaries = httpsCallable<void, string>(func, 'exportBeneficiaries');
export const callExportEvents = httpsCallable<void, string>(func, 'exportEvents');
export const callExportVolunteers = httpsCallable<void, string>(func, 'exportVolunteers');