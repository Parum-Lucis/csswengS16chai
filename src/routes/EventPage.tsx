import { useState, useEffect, type ReactHTMLElement } from "react";
import { db } from "../firebase/firebaseConfig";
import { useNavigate, useParams } from "react-router";
import { collection, doc, getDoc, getDocs, Timestamp, updateDoc, query, where, documentId, DocumentReference } from "firebase/firestore"
import type { Event } from "@models/eventType"
import { toast } from "react-toastify";
import type { AttendedEvents } from "@models/attendedEventsType";
import type { Beneficiary } from "@models/beneficiaryType";
import AttendeesCard from "../components/AttendeesCard";
// import { callDeleteEvent } from '../firebase/cloudFunctions';
// callDeleteEvent(docId);


export function EventPage() {
    const params = useParams()
    const [event, setEvent] = useState<Event| null>(null)
    const [originalEvent, setOriginalEvent] = useState<Event| null>(null)
    const [attendees, setAttendees] = useState<AttendedEvents[]>([])
    const [beneficiaryList, setBeneficiaryList] = useState<Beneficiary[]>([])
    const [docID, setDocID] = useState(event?.docID)

    useEffect(() =>  {
      const fetchEvent = async () => {
        const getQuery = doc(db, "events", params.docId as string)
        const attendeeQuery = collection(db, "events", params.docId as string, "attendees")
        const eventsSnap = await getDoc(getQuery)
        const attendeesList = await getDocs(attendeeQuery)
        if(eventsSnap.exists())
          setEvent(eventsSnap.data() as Event)
          setOriginalEvent(eventsSnap.data() as Event)
          const beneficiaryID: string[] = []
          attendeesList.forEach((att) => {
              setAttendees([...attendees, att.data() as AttendedEvents])
              beneficiaryID.push((att.data() as AttendedEvents).docID)
              console.log(att.data())
              console.log((att.data() as AttendedEvents).docID)
          })
          const beneficiaryQuery = query(
              collection(db, "beneficiaries"),
              where(documentId(), "in", beneficiaryID)
          )
          const beneficiaryRef = await getDocs(beneficiaryQuery)
          console.log(beneficiaryRef.size)
          beneficiaryRef.forEach((bene) => {
            setBeneficiaryList([...beneficiaryList, bene.data() as Beneficiary])
          })
          console.log((eventsSnap.data() as Event))
          setDocID(eventsSnap.id)
        }
        fetchEvent()
    }, [setEvent, setAttendees, setBeneficiaryList, params.docId])
    console.log(beneficiaryList)
    const { name, description } = event || {}

    const start_date = new Date((event?.start_date.seconds ?? 0)*1000)
    start_date.setMinutes(start_date.getMinutes() - start_date.getTimezoneOffset()) // local datetime

    const end_date = new Date((event?.end_date.seconds ?? 0)*1000)
    end_date.setMinutes(end_date.getMinutes() - end_date.getTimezoneOffset()) // local datetime

    const max_date = start_date.toISOString().substring(0,11) + "23:59"
    console.log(max_date, start_date.toISOString().substring(0,16))

    const handleSave = async (e: React.MouseEvent<HTMLFormElement>) => {
      e.preventDefault()
      if(!name?.trim() || !description?.trim() || !start_date || !end_date) {
        toast.error("Please fill up all fields!")
        return
      }
      if(start_date > end_date) {
        toast.error("Start date cannot be greater than end date!")
        return
      }
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
      <>
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
        <div>
          Attendees:
          {Array.from(
            {length: beneficiaryList.length},
            (_, i) => (
              <div className="pb-4">
                <h3 className="font-[Montserrat] mb-2">Attendee {i + 1}</h3>
                <AttendeesCard name={beneficiaryList[i].first_name + " " + beneficiaryList[i].last_name} who_attended={attendees[i].who_attended!} attendance={attendees[i].attended ?? false} />
              </div>
            )
          )}
        </div>
      </>
    )
}
