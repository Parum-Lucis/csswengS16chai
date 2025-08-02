import { onCall, HttpsError } from "firebase-functions/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { Event } from "@models/eventType";
import { splitToLines, csvHelpers } from "./helpers";

const firestore = getFirestore();

export const importEvents = onCall<string>(async (req) => {
    logger.log("importEvents called");
    if (!req.auth) return false;

    // split and skip header
    const lines = splitToLines(req.data);

    const importedEvents = lines.map((line, index) => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, ""));
        const [name, description, dateStr, startTimeStr, endTimeStr, location] = values;

        // check required fields: name, date, startTime, endTime
        if (!name?.trim() || !dateStr?.trim() || !startTimeStr?.trim() || !endTimeStr?.trim()) {
            logger.warn(`Line ${index + 2} skipped: Missing required fields (name, date, start time, or end time).`);
            return null;
        }

        // parse date and times
        const date = dateStr.trim();
        const startTime = startTimeStr.trim();
        const endTime = endTimeStr.trim();

        var startDateTime, endDateTime;

        try {
            startDateTime = new Date(date);
            endDateTime = new Date(date);

            // set hours and minutes for start and end times
            const [startHourStr, startMinuteStr] = (startTime as string).split(":");
            const [endHourStr, endMinuteStr] = (endTime as string).split(":");
            const startHour = Number(startHourStr);
            const startMinute = Number(startMinuteStr);
            const endHour = Number(endHourStr);
            const endMinute = Number(endMinuteStr);

            // check if parsing went ok
            if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
                logger.warn(`Line ${index + 2} skipped: Invalid start or end time format.`);
                return null;
            }
            startDateTime.setUTCHours(startHour - 8, startMinute, 0, 0);
            endDateTime.setUTCHours(endHour - 8, endMinute, 0, 0);

            logger.log(startDateTime, endDateTime)
        } catch (err) {
            logger.warn(`Line ${index + 2} skipped: Error parsing date or time.`);
            return null;
        }

        // cut to 255 characters, as per specs
        const trimmedDescription = description.trim().slice(0, 255);

        return {
            name: name.trim(),
            description: trimmedDescription,
            start_date: Timestamp.fromDate(startDateTime),
            end_date: Timestamp.fromDate(endDateTime),
            location: location.trim(),
            time_to_live: null,
        } as Event;
    }).filter(Boolean);

    if (!importedEvents.length) {
        throw new HttpsError("invalid-argument", "No valid events to import.");
    }

    let imported = 0;
    let skipped = 0;

    try {
        const eventsSnapshot = await firestore.collection("events").where("time_to_live", "==", null).get();

        var existingEvents = eventsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                name: data.name,
                start_date: data.start_date,
                end_date: data.end_date
            };
        });

        const batch = firestore.batch();
        importedEvents.forEach(event => {
            if (!event) return;

            const existing = existingEvents.filter(existingEvent => {
                return (
                    existingEvent.name.trim().toLowerCase() === event.name.trim().toLowerCase() &&
                    existingEvent.start_date.toMillis() === event.start_date.toMillis() &&
                    existingEvent.end_date.toMillis() === event.end_date.toMillis()
                );
            });

            if (existing.length > 0) {
                logger.warn(`Event "${event.name}" with same start and end date already exists. Skipping.`);
                skipped++;
                return;
            }

            const docRef = firestore.collection("events").doc();
            batch.set(docRef, event);
            existingEvents.push({
                name: event.name,
                start_date: event.start_date,
                end_date: event.end_date
            });
            imported++;
        });
        await batch.commit();
        logger.info(`Imported ${importedEvents.length} events successfully.`);
    } catch (err: any) {
        logger.error("Failed to import events CSV", err);
        throw new HttpsError("internal", err.message ?? "Failed to import events.");
    }

    if (imported === 0) {
        throw new HttpsError("invalid-argument", "No valid events were imported. Please ensure your data does not already exist in the system.");
    }

    return { imported, skipped };
});

export const exportEvents = onCall<void>(async (req) => {
    logger.log("exportEvents called");
    if (!req.auth) return false;

    // fetch all events
    const snapshot = await firestore.collection("events").get();
    const docs = snapshot.docs
        .map(doc => doc.data())
        .filter(doc => doc.time_to_live == null);
    if (!docs.length) {
        throw new HttpsError("not-found", "There are no events to export.");
    }

    // define headers
    const headers = [
        "Name", "Description", "Date", "Start Time", "End Time", "Location"
    ];

    const csvRows = [
        headers.map(header => csvHelpers.escapeField(header)).join(","),
        ...docs.map(doc => {
            const event = doc as Event;
            const startDateObj = new Date(event.start_date.toMillis() + 8 * 60 * 60 * 1000);
            const endDateObj = new Date(event.end_date.toMillis() + 8 * 60 * 60 * 1000);

            return [
                csvHelpers.escapeField(event.name || ""),
                csvHelpers.escapeField(event.description || ""),
                csvHelpers.escapeField(csvHelpers.formatDate(Timestamp.fromDate(startDateObj))),
                csvHelpers.escapeField(csvHelpers.formatTime(startDateObj)),
                csvHelpers.escapeField(csvHelpers.formatTime(endDateObj)),
                csvHelpers.escapeField(event.location || "")
            ].join(",");
        })
    ];
    const csvContent = csvRows.join("\r\n");
    return csvContent;
});

export const exportAttendees = onCall<string>(async (req) => {
    logger.log("exportAttendees called");
    if (!req.auth) return false;

    const eventDocID = req.data;
    if (!eventDocID) {
        throw new HttpsError("invalid-argument", "Event ID is required.");
    }

    // fetch event information
    const eventDoc = await firestore.collection("events").doc(eventDocID).get();
    if (!eventDoc.exists) {
        throw new HttpsError("not-found", "Event not found.");
    }
    const eventData = eventDoc.data() as Event;

    // fetch all attendees for the specific event from the subcollection
    const attendeesSnapshot = await firestore.collection("events").doc(eventDocID).collection("attendees").get();

    if (attendeesSnapshot.empty) {
        throw new HttpsError("not-found", "No attendees found for this event.");
    }

    const attendeeDocs = attendeesSnapshot.docs.map(doc => doc.data());

    // fetch actual benefs from collection for child num
    const beneficiaryIds = attendeeDocs.map(doc => doc.beneficiaryID);
    const beneficiariesSnapshot = await firestore.collection("beneficiaries")
        .where("__name__", "in", beneficiaryIds)
        .get();

    // create a map of beneficiaryID to accredited_id
    const beneficiaryMap = new Map();
    beneficiariesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        beneficiaryMap.set(doc.id, data.accredited_id);
    });

    // define headers for attendees export
    const headers = [
        "Child Number (ID) ID", "First Name", "Last Name", "Email", "Contact Number", "Attended", "Who Attended"
    ];

    const csvRows = [
        // Event information headers
        [
            csvHelpers.escapeField("Event Name"),
            csvHelpers.escapeField("Description"),
            csvHelpers.escapeField("Date"),
            csvHelpers.escapeField("Start Time"),
            csvHelpers.escapeField("End Time"),
            csvHelpers.escapeField("Location"),
            csvHelpers.escapeField("")
        ].join(","),
        
        // Event information data
        [
            csvHelpers.escapeField(eventData.name),
            csvHelpers.escapeField(eventData.description),
            csvHelpers.escapeField(csvHelpers.formatDate(Timestamp.fromDate(new Date(eventData.start_date.toMillis() + 8 * 60 * 60 * 1000)))),
            csvHelpers.escapeField(csvHelpers.formatTime(new Date(eventData.start_date.toMillis() + 8 * 60 * 60 * 1000))),
            csvHelpers.escapeField(csvHelpers.formatTime(new Date(eventData.end_date.toMillis() + 8 * 60 * 60 * 1000))),
            csvHelpers.escapeField(eventData.location),
            csvHelpers.escapeField("")
        ].join(","),
        
        // Empty row for separation
        "",
        
        // Headers row
        headers.map(header => csvHelpers.escapeField(header)).join(","),
        
        // Attendee data rows
        ...attendeeDocs.map(doc => {
            const accreditedId = beneficiaryMap.get(doc.beneficiaryID);
            return [
                csvHelpers.escapeField(accreditedId && !isNaN(accreditedId) ? accreditedId.toString() : ""),
                csvHelpers.escapeField(doc.first_name || ""),
                csvHelpers.escapeField(doc.last_name || ""),
                csvHelpers.escapeField(doc.email || ""),
                csvHelpers.escapeField(doc.contact_number || ""),
                csvHelpers.escapeField(doc.attended ? "Yes" : "No"),
                csvHelpers.escapeField(doc.who_attended || ""),
            ].join(",");
        })
    ];
    const csvContent = csvRows.join("\r\n");
    return csvContent;
});

