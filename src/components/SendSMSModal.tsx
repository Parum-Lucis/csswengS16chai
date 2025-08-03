import type { AttendedEvents } from "@models/attendedEventsType";
import { Bell, FilesIcon, MessageSquareReply, X } from "lucide-react";
import { useMemo, useRef, useState, type ReactEventHandler } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getMobileOperatingSystem } from "../util/getMobileOperatingSystem";
import type { Event } from "@models/eventType";
import { add, format } from "date-fns";
import { callNotifyGuardiansBySMS } from "../firebase/cloudFunctions";

// currying magic.
function handleCopy(text: string) {
    return async function () {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("successfully copied to clipboard!");
        } catch (error) {
            console.log(error);
            toast.error("couldn't copy into clipboard.");
        }

    }
}

export function SendSMSModal({ event, attendees, showModal, onClose }: { event: Event, attendees: AttendedEvents[], showModal: boolean, onClose: ReactEventHandler }) {

    const [isAttemptingSMS, setIsAttemptingSMS] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);

    const { cost, phoneNumbers, eventDetails, smsProtocolLink } = useMemo(() => {

        // I'm currently not checking if the numbers are fine.
        const phoneNumbers = attendees.reduce((prev, curr) => (prev + "," + curr.contact_number), "").replace(/^,/, "");

        // reused Jericho's template, but I refused to install another package and hacked the system
        const eventTitle = `This is a reminder to attend the event titled ${event.name}.`
        const eventTime = `It will happen between ${format(add(event.start_date.toDate(), { hours: -8 }), "h:mm bb")} and ${format(add(event.end_date.toDate(), { hours: -8 }), "h:mm bb")} on ${format(add(event.start_date.toDate(), { hours: -8 }), "MMMM d, yyyy")}.`
        const eventBlurb = `About the event: ${event.description}`
        const eventDetails = [eventTitle, eventTime, eventBlurb].reduce((prev, curr) => prev + "\n\n" + curr, "").replace(/^\n\n/, "");

        // building the sms link. This is like fucking magic. here: https://stackoverflow.com/a/58131833/19171356
        let smsProtocolLink = "sms://"
        if (getMobileOperatingSystem() === "iOS")
            smsProtocolLink += `open?addresses=`
        smsProtocolLink += `${phoneNumbers};?&body=${encodeURI(eventDetails)}`;

        const cost = Math.ceil(eventDetails.length * attendees.length / 160);

        return { cost, phoneNumbers, eventDetails, smsProtocolLink }

    }, [attendees, event])

    async function handleNotify() {
        setIsAttemptingSMS(true);
        try {
            if (!event.docID) throw Error("No event id?");

            const res = await callNotifyGuardiansBySMS({ phoneNumbers, eventDetails, event });

            if (res.data.status === 200) {
                toast.success(`Successfully sent notification to beneficiaries! -${cost} credits`)
            } else {
                toast.error("Couldn't send notification. Try again. (possible credit lost!)");
            }
        } catch (e) {
            toast.error("Couldn't send notification. Try again. (possible credit lost!)");
            console.error(e);
        }

        setIsAttemptingSMS(false);
    }

    if (showModal) {
        dialogRef.current?.showModal()
    } else {
        dialogRef.current?.close()
    }

    return (
        <dialog ref={dialogRef} className="w-full max-w-3xl inset-0 fixed m-auto" onClose={onClose} >
            <div className="px-6 py-10">
                <div className="flex justify-between flex-row mb-8">
                    <h1 className="text-xl">Send SMS</h1>
                    <button type="button" onClick={onClose}><X /></button>
                </div>

                <div className="flex flex-col px-4 gap-4">
                    <div className="flex justify-between flex-row items-center gap-2 sm:gap-6">
                        <div className="flex items-center gap-2">
                            <Bell className="h-full flex-grow hidden sm:block" />
                            <div className="flex flex-col">

                                <h2 className="m-0"><span className="font-bold">Automatically</span> send to all participants.</h2>
                                <p className="italic text-sm">This will cost
                                    <span className="text-green-600 font-bold"> {cost} </span>
                                    pesos. Remember to top-up{" "}
                                    <Link to="https://sms.iprogtech.com/" className="underline text-shadow-primary" target="_blank">here</Link>
                                </p>
                            </div>
                        </div>
                        <button
                            disabled={isAttemptingSMS}
                            onClick={handleNotify}
                            className={`hover:opacity-80 focus:opacity-50 p-4 bg-primary text-white
                            rounded-md cursor-pointer text-nowrap ` + (isAttemptingSMS ? "cursor-not-allowed opacity-30" : "")}>Notify</button>
                    </div>
                    <div className="flex justify-center items-center w-4/5 gap-4 mx-auto my-6">
                        <hr className="border-gray-400 border-2 flex-grow" />
                        <span className="">OR</span>
                        <hr className="border-gray-400 border-2 flex-grow" />
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between flex-row items-center gap-2 sm:gap-6">
                            <div className="flex items-center gap-2">
                                <MessageSquareReply className="h-full flex-grow hidden sm:block" />
                                <div className="flex flex-col">

                                    <h2 className="m-0"><span className="font-bold">Manually</span> send to all participants.</h2>
                                    <p className="italic text-sm">Will only cost your phone's load.
                                    </p>
                                </div>
                            </div>
                            <Link className="hover:opacity-80 focus:opacity-50 p-4 bg-primary text-white rounded-md cursor-pointer text-nowrap"
                                to={smsProtocolLink}
                            >Send</Link>
                        </div>
                        <span className="text-sm mt-4">
                            If the button above doesn't send you to your text messaging app or doesn't work, you can manually mass send a text message by creating a {" "}
                            <Link className="underline"
                                to="https://support.google.com/messages/answer/9367099?hl=en">"Group Chat"</Link>.
                        </span>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row gap-2">
                                <button onClick={handleCopy(phoneNumbers)} className="hover:opacity-80 focus:opacity-50">
                                    <FilesIcon />
                                </button>
                                <details className="border-black border-2 flex-grow p-2 break-all">
                                    <summary>Phone numbers</summary>
                                    {phoneNumbers}
                                </details>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row gap-2">
                                <button onClick={handleCopy(eventDetails)} className="hover:opacity-80 focus:opacity-50">
                                    <FilesIcon />
                                </button>
                                <details className="border-black border-2 flex-grow p-2 break-all">
                                    <summary>Event Details</summary>
                                    {eventDetails}
                                </details>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </dialog>
    )
}