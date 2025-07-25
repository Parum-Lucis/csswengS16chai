import type { AttendedEvents } from "@models/attendedEventsType";
import { X } from "lucide-react";
import { useRef, type ReactEventHandler } from "react";

export function SendSMSModal({ attendees, showModal, onClose }: { attendees: AttendedEvents[], showModal: boolean, onClose: ReactEventHandler }) {

    const dialogRef = useRef<HTMLDialogElement>(null);
    if (showModal) {
        dialogRef.current?.showModal()
    } else {
        dialogRef.current?.close()
    }

    const cost = 5

    return (
        <dialog ref={dialogRef} className="w-full max-w-3xl inset-0 fixed m-auto" onClose={onClose} >
            <div className="p-6">
                <div className="flex justify-between flex-row mb-8">
                    <h1 className="text-xl">Send SMS</h1>
                    <button type="button" onClick={onClose}><X /></button>
                </div>
                <div className="flex flex-col px-4">
                    <div className="flex justify-between flex-row items-center">
                        <div className="flex flex-col">
                            <h2 className="m-0">Send SMS Automatically to all participants.</h2>
                            <p className="italic text-sm">Note: This will cost <span className="text-blue-600 font-bold">{cost}</span> pesos.</p>
                        </div>
                        <button className="hover:opacity-80 focus:opacity-50 p-4 bg-primary text-white rounded-md cursor-pointer">Notify All via Text</button>
                    </div>
                </div>
            </div>
        </dialog>
    )
}