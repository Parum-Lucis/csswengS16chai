import type { AttendedEvents } from "@models/attendedEventsType";
import { Mail, FilesIcon, X, Bell } from "lucide-react";
import { useMemo, useRef, useState, type ReactEventHandler } from "react"; // Removed useState as isAttemptingEmail is no longer needed
import { toast } from "react-toastify";
import type { Event } from "@models/eventType";
import { add, format } from "date-fns";
import { Link } from "react-router-dom"; // Link is needed for mailto
import { sendEmailReminder } from "../firebase/cloudFunctions";

// currying magic.
function handleCopy(text: string) {
    return async function () {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Successfully copied to clipboard!");
        } catch (error) {
            console.log(error);
            toast.error("Couldn't copy into clipboard.");
        }
    }
}

export function SendEmailModal({ event, attendees, showModal, onClose }: { event: Event, attendees: AttendedEvents[], showModal: boolean, onClose: ReactEventHandler }) {
    const [isAttemptingEmail, setIsAttemptingEmail] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);

    const { emailAddresses, emailSubject, emailBody, mailtoLink } = useMemo(() => {      
        const emailAddresses = attendees.reduce((prev, curr) => (prev + "," + curr.email), "").replace(/^,/, "");

        const emailSubject = `Reminder: ${event.name}`;

        const eventTitle = `This is a reminder to attend the event titled ${event.name}.`
        const eventTime = `It will happen between ${format(add(event.start_date.toDate(), { hours: -8 }), "h:mm bb")} and ${format(add(event.end_date.toDate(), { hours: -8 }), "h:mm bb")} on ${format(add(event.start_date.toDate(), { hours: -8 }), "MMMM d, yyyy")}.`
        const eventBlurb = `About the event: ${event.description}`
        const emailBody = [eventTitle, eventTime, eventBlurb].reduce((prev, curr) => prev + "\n\n" + curr, "").replace(/^\n\n/, "");

        const mailtoLink = `mailto:${encodeURIComponent(emailAddresses)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

        return { emailAddresses, emailSubject, emailBody, mailtoLink }

    }, [attendees, event]);

    async function handleNotify() {
        setIsAttemptingEmail(true);
        console.log(event)
        try {
            const res = await sendEmailReminder(event);

            if (res) {
                toast.success(`Successfully sent notifcation to beneficiaries!`)
            } else {
                toast.error("Couldn't send notifcation. Try again. (Possibly hit email limits!)");
            }
        } catch (e) {
            toast.error("Error: Couldn't send notifcation. Try again. (Possibly hit email limits!)");
            console.error(e);
        }

        setIsAttemptingEmail(false);
    }

    if (showModal) {
        dialogRef.current?.showModal();
    } else {
        dialogRef.current?.close();
    }

    return (
        <dialog ref={dialogRef} className="w-full max-w-3xl inset-0 fixed m-auto" onClose={onClose} >
            <div className="px-6 py-10">
                <div className="flex justify-between flex-row mb-8">
                    <h1 className="text-xl">Send Email</h1>
                    <button type="button" onClick={onClose}><X /></button>
                </div>

                <div className="flex flex-col px-4 gap-4">
                    <div className="flex justify-between flex-row items-center gap-2 sm:gap-6">
                        <div className="flex items-center gap-2">
                            <Bell className="h-full flex-grow hidden sm:block" />
                            <div className="flex flex-col">

                                <h2 className="m-0"><span className="font-bold">Automatically</span> send to all participants.</h2>
                                <p className="italic text-sm">This will cost
                                    <span className="text-green-600 font-bold"> fuckall </span>
                                    pesos. Remember to top-up{" "}
                                    <Link to="https://sms.iprogtech.com/" className="underline text-shadow-primary">here</Link>
                                </p>
                            </div>
                        </div>
                        <button
                            disabled={isAttemptingEmail}
                            onClick={handleNotify}
                            className={`hover:opacity-80 focus:opacity-50 p-4 bg-primary text-white
                            rounded-md cursor-pointer text-nowrap ` + (isAttemptingEmail ? "cursor-not-allowed opacity-30" : "")}>Notify</button>
                    </div>
                    <div className="flex justify-center items-center w-4/5 gap-4 mx-auto my-6">
                        <hr className="border-gray-400 border-2 flex-grow" />
                        <span className="">OR</span>
                        <hr className="border-gray-400 border-2 flex-grow" />
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between flex-row items-center gap-2 sm:gap-6">
                            <div className="flex items-center gap-2">
                                <Mail className="h-full flex-grow hidden sm:block" />
                                <div className="flex flex-col">
                                    <h2 className="m-0"><span className="font-bold">Send Email manually</span> to all participants.</h2>
                                    <p className="italic text-sm">This will open your default email client.
                                    </p>
                                </div>
                            </div>
                            <Link className="hover:opacity-80 focus:opacity-50 p-4 bg-primary text-white rounded-md cursor-pointer text-nowrap"
                                to={mailtoLink}
                            >Send</Link>
                        </div>
                        <span className="text-sm mt-4">
                            If the button above doesn't open your email app or doesn't work, you can manually send an email by creating a new email and adding the email addresses, subject, and body from below.
                        </span>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row gap-2">
                                <button onClick={handleCopy(emailAddresses)} className="hover:opacity-80 focus:opacity-50">
                                    <FilesIcon />
                                </button>
                                <details className="border-black border-2 flex-grow p-2">
                                    <summary>Email Addresses</summary>
                                    {emailAddresses}
                                </details>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row gap-2">
                                <button onClick={handleCopy(emailSubject)} className="hover:opacity-80 focus:opacity-50">
                                    <FilesIcon />
                                </button>
                                <details className="border-black border-2 flex-grow p-2">
                                    <summary>Email Subject</summary>
                                    {emailSubject}
                                </details>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row gap-2">
                                <button onClick={handleCopy(emailBody)} className="hover:opacity-80 focus:opacity-50">
                                    <FilesIcon />
                                </button>
                                <details className="border-black border-2 flex-grow p-2">
                                    <summary>Email Body</summary>
                                    {emailBody}
                                </details>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </dialog>
    )
}