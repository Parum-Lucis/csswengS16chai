import { AttendedEvents } from "@models/attendedEventsType";
import { getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import type { Event } from "@models/eventType";

import nodemailer from "nodemailer";

const firestore = getFirestore()

export const sendEmailReminder = onCall<Event>(async (req) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'jericho_reyes@dlsu.edu.ph',
            pass: process.env.APP_PASSWORD
        }
    }); 

    const attRef = await firestore.collection("events/"+req.data.docID+"/attendees").get()

    const success = await Promise.all(attRef.docs.map(async (att) => {
        const attendee = att.data() as AttendedEvents
        const info = await transporter.sendMail({
            from: 'CHAI-TAGUIG',
            to: attendee.email,
            subject: "Event Reminder for " + req.data.name,
            text: "This is a reminder to attend the event titled " + req.data.name + " as you are one of the listed attendees of this event. Description: " + req.data.description, // plain‑text body
            html: "<b>This is a reminder to attend the event titled " + req.data.name + " as you are one of the listed attendees of this event. Description: " + req.data.description + "</b>", // HTML body
        });
        logger.log("Message sent:", info.messageId);
        logger.log(info)
        if(info.accepted.length > 0)
            return true
        else return false
    })) 

     return success;
})