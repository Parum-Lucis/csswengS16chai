import type { Beneficiary } from "@models/beneficiaryType";
import type { Volunteer } from "@models/volunteerType";
import type { FirestoreDataConverter } from "firebase/firestore";

export const beneficiaryConverter: FirestoreDataConverter<Beneficiary> = {
    toFirestore: (data) => data,
    fromFirestore: (snap) => ({ ...snap.data() as Beneficiary, docID: snap.id })
}

export const volunteerConverter: FirestoreDataConverter<Volunteer> = {
    toFirestore: (data: Volunteer) => data,
    fromFirestore: (snap) => ({ ...snap.data() as Volunteer, docID: snap.id })
}
