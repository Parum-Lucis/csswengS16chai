import { AttendedEvents } from "@models/attendedEventsType";
import { getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import type { Event } from "@models/eventType";

import nodemailer from "nodemailer";
import mjml2html from "mjml";
import { formatInTimeZone } from "date-fns-tz";


const firestore = getFirestore()

export const sendEmailReminder = onCall<Event>(async (req) => {
    // nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'jericho_reyes@dlsu.edu.ph',
            pass: process.env.APP_PASSWORD
        }
    }); 

    // querying each attendee of event
    const attRef = await firestore.collection("events/"+req.data.docID+"/attendees").get()

    // takes email of each attendee
    const emailList: string[] = []
    attRef.forEach((att) => {
        emailList.push((att.data() as AttendedEvents).email)
    })

    // dates
    const start_date = new Date((req.data.start_date.seconds ?? 0) * 1000)
    const end_date = new Date((req.data.end_date.seconds ?? 0) * 1000)

    // mjml json template for email
    const { html }= mjml2html({
            tagName: 'mjml',
            attributes: {},
            children: [{
                tagName: 'mj-body',
                attributes: {},
                children: [{
                    tagName: 'mj-section',
                    attributes: {},
                    children: [{
                        tagName: 'mj-column',
                        attributes: {},
                        children: [{
                            tagName: 'mj-image',
                            attributes: {
                                'width': '100px',
                                'src': 'cid:CHAI',
                                'align': "center"
                            }
                        },
                            {
                            tagName: 'mj-text',
                            attributes: {
                                'font-size': "25px", 
                                'font-family': "helvetica"
                            },
                            content: 'Event Reminder for ' + req.data.name
                        },
                        {
                            tagName: 'mj-divider',
                            attributes: {}
                        }, 
                        {
                            tagName: 'mj-text',
                            attributes: {
                                'font-size': "15px", 
                                'font-family': "helvetica"
                            },
                            content: 'This is a reminder to attend the event titled ' 
                                + req.data.name + ' between ' 
                                + formatInTimeZone(start_date, "Asia/Manila", "h:mm bb") +  ' and ' 
                                + formatInTimeZone(end_date, "Asia/Manila", "h:mm bb") + ' on ' 
                                + formatInTimeZone(start_date, "Asia/Manila", "MMMM d, yyyy.")
                        },
                        {
                            tagName: 'mj-text',
                            attributes: {
                                'font-size': "15px", 
                                'font-family': "helvetica"
                            },
                            content: 'Event Description: ' + req.data.description
                        },
                        {
                            tagName: 'mj-text',
                            attributes: {
                                'font-size': "15px", 
                                'font-family': "helvetica"
                            },
                            content: 'For more details, please contact CHAI-Taguig at ...'
                        },
                        {
                            tagName: 'mj-divider',
                            attributes: {}
                        }, 
                        {
                            tagName: 'mj-text',
                            attributes: {
                                'font-size': "12px", 
                                'font-family': "helvetica",
                                'font-style': "italic"
                            },
                            content: 'DISCLAIMER: You are receiving this email as you are listed as one of the beneficiaries of this CHAI-Taguig event. If you are not an intended recipient, you must not read, copy, store, disclose, distribute this message, or act in reliance upon the information contained in it. If you received this e-mail in error, please contact the sender and delete the material from any computer or system.'
                        }]
                    }]
                }]
            }]
    })

    //
    const info = await transporter.sendMail({
        from: 'CHAI-TAGUIG',
        bcc: emailList,
        subject: "Event Reminder for " + req.data.name,
        text: "This is a reminder to attend the event titled " + req.data.name + " as you are one of the listed attendees of this event. Description: " + req.data.description,
        html: html,
        attachments: [{
            filename: 'CHAI.jpg',
            path: './public/CHAI.jpg',
            cid: 'CHAI'
        }],
    })
    logger.log("Message sent:", info.messageId);
    logger.log(info)
    if(info.accepted.length > 0)
        return true
    else return false
})