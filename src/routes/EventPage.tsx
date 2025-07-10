import { useState, useEffect, type ReactHTMLElement } from "react";
import { db } from "../firebase/firebaseConfig";
import { useNavigate, useParams } from "react-router";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore"
import type { Event } from "@models/eventType"
import { toast } from "react-toastify";

export function EventPage() {
    const params = useParams()
    const [event, setEvent] = useState<Event| null>(null)
    const [originalEvent, setOriginalEvent] = useState<Event| null>(null)
    const [docID, setDocID] = useState(event?.docID)

    useEffect(() =>  {
        const fetchBeneficiary = async () => {
        const getQuery = doc(db, "events", params.docId as string)
        const eventsSnap = await getDoc(getQuery)
        if(eventsSnap.exists())
            setEvent(eventsSnap.data() as Event)
            setOriginalEvent(eventsSnap.data() as Event)
            console.log((eventsSnap.data() as Event))
            setDocID(eventsSnap.id)
        }
        fetchBeneficiary()
    }, [setEvent])

    const { name, description } = event || {}

    const start_date = new Date((event?.start_date.seconds ?? 0)*1000)
    start_date.setMinutes(start_date.getMinutes() - start_date.getTimezoneOffset()) // local datetime

    const end_date = new Date((event?.end_date.seconds ?? 0)*1000)
    end_date.setMinutes(end_date.getMinutes() - end_date.getTimezoneOffset()) // local datetime

    const max_date = start_date.toISOString().substring(0,11) + "23:59"
    console.log(max_date, start_date.toISOString().substring(0,16))

    const handleSave = async (e: React.MouseEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        try {
            start_date.setMinutes(start_date.getMinutes() + start_date.getTimezoneOffset())
            end_date.setMinutes(end_date.getMinutes() + end_date.getTimezoneOffset())
            const updateRef = doc(db, "events", docID!)
            await updateDoc(updateRef, {
                ...event
            })
            setOriginalEvent(event)
            toast.success("Update success!")
            console.log(event)
            setTimeout(function() {
                location.reload();
            }, 1000);
        } catch {
            toast.error("Something went wrong")
        }
    }

    return (
        <form onSubmit={handleSave}>
            <label htmlFor="name" className="text-black font-[Montserrat] font-semibold">
                Name:
              </label>
              <input
                id="name"
                name="name"
                type="string"
                className="input-text w-full"
                value={name}
                onChange={e => setEvent({...event as Event, name : e.target.value})}
              />
              <label htmlFor="description" className="text-black font-[Montserrat] font-semibold">
                Description:
              </label>
              <textarea
                id="description"
                name="description"
                className="input-text w-full"
                value={description}
                onChange={e => setEvent({...event as Event, description : e.target.value})}
              />
              <label htmlFor="startdate" className="text-black font-[Montserrat] font-semibold">
                Start:
              </label>
              <input
                id="startdate"
                name="startdate"
                type="datetime-local"
                className="input-text w-full"
                step="1"
                value={start_date.toISOString().substring(0,19)}
                onChange={e => setEvent({...event as Event, start_date : Timestamp.fromMillis(Date.parse(e.target.value))})}
              />
              <label htmlFor="enddate" className="text-black font-[Montserrat] font-semibold">
                End:
              </label>
              <input
                id="enddate"
                name="enddate"
                type="datetime-local"
                className="input-text w-full"
                step="1"
                min={start_date.toISOString().substring(0,16)}
                max={max_date}
                value={end_date.toISOString().substring(0,19)}
                onChange={e => setEvent({...event as Event, end_date : Timestamp.fromMillis(Date.parse(e.target.value))})}
              />
              <button type="submit">Submit</button>
        </form>
    )
}
