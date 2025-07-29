import type { Beneficiary } from "@models/beneficiaryType";
import type { Volunteer } from "@models/volunteerType";
import type { Event } from "@models/eventType";
import type { FirestoreDataConverter, QueryDocumentSnapshot } from "firebase/firestore";

// EDITED: added check to add time_to_live if it doesnt have the field
// because we only recently implemented time_to_live being required. yes    

export const beneficiaryConverter: FirestoreDataConverter<Beneficiary> = {
    toFirestore: (data) => ({
        ...data,
        time_to_live: data.time_to_live ?? null
    }),
    fromFirestore: (snap) => {
        const data = snap.data() as Beneficiary;
        return {
            ...data,
            docID: snap.id,
            time_to_live: data.time_to_live ?? null
        };
    }
}

export const volunteerConverter: FirestoreDataConverter<Volunteer> = {
    toFirestore: (data: Volunteer) => ({
        ...data,
        time_to_live: data.time_to_live ?? null
    }),
    fromFirestore: (snap) => {
        const data = snap.data() as Volunteer;
        return {
            ...data,
            docID: snap.id,
            time_to_live: data.time_to_live ?? null
        };
    }
}

export const eventConverter: FirestoreDataConverter<Event> = {
    toFirestore: (event) => event,
    fromFirestore: (snapshot: QueryDocumentSnapshot<Event>, options) => {
        const data = snapshot.data(options);
        return {
            ...data,
            docID: snapshot.id,
            time_to_live: data.time_to_live ?? null
        }

    }
}

