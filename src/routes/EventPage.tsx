import { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { useNavigate, useParams } from "react-router";
import { collection, doc, getDoc, getDocs, Timestamp, updateDoc, deleteDoc, setDoc } from "firebase/firestore"
import type { Event } from "@models/eventType"
import { toast } from "react-toastify";
import { createPortal } from 'react-dom';
import type { AttendedEvents } from "@models/attendedEventsType";
import type { Beneficiary } from "@models/beneficiaryType";
import AttendeesCard from "../components/AttendeesCard";
import { callDeleteEvent } from '../firebase/cloudFunctions';
import { EllipsisVertical } from 'lucide-react';
import { SendSMSModal } from "../components/SendSMSModal";

export function EventPage() {
  const params = useParams()
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null)
  const [originalEvent, setOriginalEvent] = useState<Event | null>(null)
  const [attendees, setAttendees] = useState<AttendedEvents[]>([])
  const [docID, setDocID] = useState(event?.docID)
  const [showDeleteModal, setDeleteModal] = useState(false)
  // for bene list
  const [notAttendeeList, setNotAttendeeList] = useState<Beneficiary[]>([])
  const [checklist, setChecklist] = useState<boolean[]>([])
  const [runQuery, setRunQuery] = useState<boolean>(true)
  // for remove list 
  const [removeChecklist, setRemoveChecklist] = useState<boolean[]>([])
  // for dropdowns
  const [showAddDropdown, setShowAddDropdown] = useState(false)
  const [showRemoveDropdown, setShowRemoveDropdown] = useState(false)
  const [showOtherDropdown, setShowOtherDropdown] = useState(false)

  // for sms modal
  const [isShowSMSModal, setIsShowSMSModal] = useState(false);

  // use effect for fetch event & fetch attendees
  useEffect(() => {
    const fetchEvent = async () => {
      const getQuery = doc(db, "events", params.docId as string)
      const attendeeQuery = collection(db, "events", params.docId as string, "attendees")
      const eventsSnap = await getDoc(getQuery)
      const attendeesList = await getDocs(attendeeQuery)
      if (eventsSnap.exists()) {
        setEvent(eventsSnap.data() as Event)
        setOriginalEvent(eventsSnap.data() as Event)
      }
      if (!attendeesList.empty) {
        const updAttendees: AttendedEvents[] = []
        // const updBene: Beneficiary[] = []
        const updRemove: boolean[] = []
        attendeesList.forEach((att) => {
          updAttendees.push(att.data() as AttendedEvents)
          // beneficiaryID.push((att.data() as AttendedEvents).beneficiaryID)
          updRemove.push(false)
          console.log(att.data())
          console.log((att.data() as AttendedEvents).beneficiaryID)
        })
        setAttendees(updAttendees.sort((a, b) => a.first_name.localeCompare(b.first_name)))
        // setRemoveChecklist(updRemove)
        // const beneficiaryQuery = query(
        //   collection(db, "beneficiaries"),
        //   where(documentId(), "in", beneficiaryID)
        // )
        // const beneficiaryRef = await getDocs(beneficiaryQuery)
        // console.log(beneficiaryRef.size)
        // beneficiaryRef.forEach((bene) => {
        //   console.log("id is " + bene.id)
        //   updBene.push({ ...(bene.data() as Beneficiary), docID: bene.id })
        // })
        // setBeneficiaryList(updBene.sort((a, b) => a.docID.localeCompare(b.docID)))
      }
      console.log((eventsSnap.data() as Event))
      setDocID(eventsSnap.id)
      setRunQuery(true)
    }
    fetchEvent()
  }, [setEvent, setAttendees, params.docId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.target instanceof HTMLElement &&
        !target.closest("[data-dropdown-toggle='addDropdown']") &&
        !target.closest("[data-dropdown-toggle='removeDropdown']") &&
        !target.closest("[data-dropdown-toggle='otherDropdown']") &&
        !target.closest("#dropdownAdd") &&
        !target.closest("#dropdownRemove") &&
        !target.closest("#dropdownOther")
      ) {
        setShowAddDropdown(false);
        setShowRemoveDropdown(false);
        setShowOtherDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = showDeleteModal ? 'hidden' : 'unset';
  }, [showDeleteModal]);

  const { name, description, location: event_location } = event || {}

  // date handling
  const start_date = new Date((event?.start_date.seconds ?? 0) * 1000)
  start_date.setMinutes(start_date.getMinutes() - start_date.getTimezoneOffset()) // local datetime

  const end_date = new Date((event?.end_date.seconds ?? 0) * 1000)
  end_date.setMinutes(end_date.getMinutes() - end_date.getTimezoneOffset()) // local datetime

  const max_date = start_date.toISOString().substring(0, 11) + "23:59"
  console.log(max_date, start_date.toISOString().substring(0, 16))

  // edit event
  const handleSave = async (e: React.MouseEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name?.trim() || !description?.trim() || !start_date || !end_date) {
      toast.error("Please fill up all fields!")
      return
    }
    else if (start_date.getTime() > end_date.getTime()) {
      toast.error("Start date cannot be greater than end date!")
      return
    }
    else if (start_date.toISOString().substring(0, 10) !== end_date.toISOString().substring(0, 10)) {
      toast.error("Start date must be the same date as end date!")
      return
    }
    else {
      console.log("i am here")
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
      } catch {
        toast.error("Something went wrong")
      }
    }
  }

  // delete modal
  function handleDelete() {
    setDeleteModal(!showDeleteModal);
  }

  // delete event
  const handleConfirm = async () => {
    setDeleteModal(!showDeleteModal)

    try {
      callDeleteEvent(params.docId)
        .then((result) => {
          if (result.data) {
            toast.success("Event delete success!")
            navigate("/event");
          } else { toast.error("Could not delete the event (no auth or event not found)") }
        })
    }
    catch {
      toast.error("Something went wrong!")
    }
  }

  // retrieves all beneficiaries not in attendee list, only runs the first time add attendees button is pressed
  const showBeneficiaryList = async () => {
    const beneficiaryID: string[] = []
    setChecklist([])

    if (runQuery) {
      const updList: Beneficiary[] = []
      const updChecklist: boolean[] = []
      const beneficiarySnap = await getDocs(collection(db, "beneficiaries"));

      attendees.forEach((att) => {
        beneficiaryID.push(att.beneficiaryID)
      })
      const beneficiaryRefList = beneficiarySnap.docs.filter((a) => !beneficiaryID.includes(a.id))
      if (beneficiaryRefList.length > 0) {
        beneficiaryRefList.forEach((notAtt) => {
          updList.push({ ...(notAtt.data() as Beneficiary), docID: notAtt.id })
          updChecklist.push(false)
        })
        setNotAttendeeList(updList)
        setChecklist(updChecklist)
      }
      setRunQuery(false)
    }
  }

  // adds new attendees to attendee list, then refreshes page
  const handleAddAttendees = async () => {
    let upd = false
    for (let i = 0; i < checklist.length; i++) {
      if (checklist[i]) {
        const addRef = doc(collection(db, 'events/' + docID + "/attendees"))
        await setDoc(addRef, {
          attendance: false,
          who_attended: "Beneficiary", // temp
          first_name: notAttendeeList[i].first_name,
          last_name: notAttendeeList[i].last_name,
          beneficiaryID: notAttendeeList[i].docID,
          docID: addRef.id
        });
        if (addRef) {
          upd = true
        }
        else toast.error("Submission failed.");
      }
    }
    if (upd) {
      toast.success("Success!");
      setTimeout(function () {
        location.reload();
      }, 1000);
      setRunQuery(true)
    }
    else {
      toast.success("Nothing to update")
    }
  }

  // removes attendees from attendee list, then refreshes page
  const handleRemoveAttendees = async () => {
    let refresh = false
    console.log("checklist is" + removeChecklist)
    for (let i = 0; i < removeChecklist.length; i++) {
      if (removeChecklist[i]) {
        console.log("im here at delete")
        console.log("docid is " + attendees[i].docID + ", bene is " + attendees[i].first_name)
        console.log("attended_events ID is " + attendees[i].beneficiaryID + "bene id is " + attendees[i].docID)
        await deleteDoc(doc(db, "events/" + docID + "/attendees/" + attendees[i].docID))
        refresh = true
      }
    }
    if (refresh) {
      toast.success("Success!");
      setTimeout(function () {
        location.reload();
      }, 1000);
      setRunQuery(true)
    }
    else toast.success("Nothing to update")
  }

  function handleSendSMSButtonClick() {
    setIsShowSMSModal(true);
    setShowOtherDropdown(false);
  }

  return (
    <>
      <div className="w-full min-h-screen bg-secondary flex items-center justify-center px-4 sm:px-6 lg:px-8 relative pb-60">
        {showDeleteModal && (
          createPortal(
            <div className="fixed top-0 right-0 left-0 bottom-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-sm p-6 w-full max-w-md">
                <h2 className="text-lg font-bold text-[#254151] mb-4">Confirm Deletion</h2>
                <p className="mb-6 text-[#254151]">Are you sure you want to delete this event? This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                  <button
                    className="bg-gray-300 hover:bg-gray-400 text-[#254151] font-semibold px-4 py-2 rounded"
                    onClick={handleDelete}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded"
                    onClick={handleConfirm}
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        )}
        <div className="relative w-full max-w-4xl rounded-md flex flex-col items-center pt-8 pb-10 px-4 sm:px-6">
          <div className="w-full max-w-2xl bg-primary rounded-md px-4 sm:px-6 py-8">
            <form onSubmit={handleSave}>
              <h2 className="text-secondary text-2xl text-center font-bold font-sans">
                {name ?? "Event Name"}
              </h2>

              <div className="flex flex-col gap-4 mt-6">
                {/* <input
                        id="name"
                        name="name"
                        type="string"
                        className="input-text w-full"
                        value={name}
                        onChange={e => setEvent({...event as Event, name : e.target.value})}
                      /> */}

                <div className="flex flex-col flex-1">
                  <label
                    htmlFor="description"
                    className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                    Description:
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    className="input-text w-full"
                    value={description}
                    onChange={e => setEvent(prev => ({ ...prev as Event, description: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col flex-1">
                    <label
                      htmlFor="startdate"
                      className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                      Start:
                    </label>

                    <input
                      id="startdate"
                      name="startdate"
                      type="datetime-local"
                      className="input-text w-full appearance-none"
                      step="1"
                      value={start_date.toISOString().substring(0, 19)}
                      onChange={e => setEvent(prev => ({ ...prev as Event, start_date: isNaN(Date.parse(e.target.value)) ? originalEvent!.start_date : Timestamp.fromMillis(Date.parse(e.target.value)) }))}
                    />
                  </div>

                  <div className="flex flex-col flex-1">
                    <label htmlFor="enddate"
                      className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                      End:
                    </label>

                    <input
                      id="enddate"
                      name="enddate"
                      type="datetime-local"
                      className="input-text w-full appearance-none"
                      step="1"
                      // min={start_date.toISOString().substring(0, 16)}
                      // max={max_date}
                      value={end_date.toISOString().substring(0, 19)}
                      onChange={e => setEvent(prev => ({ ...prev as Event, end_date: isNaN(Date.parse(e.target.value)) ? originalEvent!.end_date : Timestamp.fromMillis(Date.parse(e.target.value)) }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col flex-1">
                  <label htmlFor="location" className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    className="input-text w-full"
                    value={event_location}
                    onChange={e => setEvent(prev => ({ ...prev as Event, location: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-row items-center justify-around w-full gap-4">
                  <button
                    type="submit"
                    className="mt-2 w-full bg-secondary text-white px-4 py-2 rounded font-semibold font-sans cursor-pointer"
                  //  onClick={formState ? handleEdit : handleSave}
                  //  disabled={formState===null}>
                  //  {formState || formState === null ? "Edit" : "Save Changes"}</form>
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="mt-2 w-full bg-secondary text-white px-4 py-2 rounded font-semibold font-sans cursor-pointer"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </form>
          </div>

          <h2 className="text-primary text-2xl font-bold font-sans text-center mt-5">List of Attendees:</h2>
          <div className="relative w-full max-w-2xl mt-3">
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                className="bg-primary text-white font-sans font-bold rounded-md mt-3 px-10 py-2 hover:onhover transition-colors w-full lg:w-48"
                type="button"
                onClick={() => {
                  handleRemoveAttendees()
                }}
              >
                Remove
              </button>
              <button
                className="bg-primary text-white font-sans font-bold rounded-md mt-3 px-10 py-2 hover:onhover transition-colors w-full lg:w-48"
                onClick={() => {
                  setShowAddDropdown(!showAddDropdown)
                  showBeneficiaryList()
                }}
                data-dropdown-toggle="dropdownAdd"
              >
                Add
              </button>

              {showAddDropdown && (
                <div
                  id="dropdownAdd"
                  className="flex flex-col absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg w-full px-4 py-3 max-h-60 overflow-y-auto"
                >
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full px-4 py-2 mb-3 text-gray-600 border border-gray-300 rounded-md"
                  />
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {
                      notAttendeeList.length > 0 ? (
                        notAttendeeList.map((notAtt, i) => (
                          <div className="space-y-2" key={i}>
                            <label className="flex items-center px-4 py-3 bg-primary text-white rounded-md hover:bg-onhover transition cursor-pointer">
                              <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 rounded text-white bg-white border-white checked:accent-secondary checked:border-white mr-3"
                                onChange={() => {
                                  const updChecklist = [...checklist]
                                  updChecklist[i] = !checklist[i]
                                  setChecklist(updChecklist)
                                }}
                              />
                              <span className="font-semibold text-md text-white">{notAtt.first_name + " " + notAtt.last_name}</span>
                            </label>
                          </div>
                        ))
                      ) : "No beneficiaries to show"
                    }
                  </div>
                  <div className="mt-4 text-right">
                    <button
                      className="text-secondary font-semibold hover:underline cursor-pointer"
                      type="button"
                      onClick={handleAddAttendees}
                    >
                      Update List
                    </button>
                  </div>
                </div>
              )}

              <button
                className="w-full bg-primary text-white px-4 py-2 rounded font-semibold font-sans cursor-pointer sm:w-3/10"
                type="button"
                onClick={() => {
                  setShowRemoveDropdown(!showRemoveDropdown)
                  showBeneficiaryList()
                }}
                data-dropdown-toggle="dropdownRemove"
              >
                Remove
              </button>

              {showRemoveDropdown && (
                <div
                  id="dropdownRemove"
                  className="flex flex-col absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg w-full px-4 py-3 max-h-60 overflow-y-auto"
                >
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full px-4 py-2 mb-3 text-gray-600 border border-gray-300 rounded-md"
                  />
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {
                      notAttendeeList.length > 0 ? (
                        notAttendeeList.map((notAtt, i) => (
                          <div className="space-y-2" key={i}>
                            <label className="flex items-center px-4 py-3 bg-primary text-white rounded-md hover:bg-onhover transition cursor-pointer">
                              <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 rounded text-white bg-white border-white checked:accent-secondary checked:border-white mr-3"
                                onChange={() => {
                                  const updChecklist = [...checklist]
                                  updChecklist[i] = !checklist[i]
                                  setChecklist(updChecklist)
                                }}
                              />
                              <span className="font-semibold text-md text-white">{notAtt.first_name + " " + notAtt.last_name}</span>
                            </label>
                          </div>
                        ))
                      ) : "No beneficiaries to show"
                    }
                  </div>
                  <div className="mt-4 text-right">
                    <button
                      className="text-secondary font-semibold hover:underline cursor-pointer"
                      type="button"
                      onClick={handleRemoveAttendees}
                    >
                      Update List
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 w-full sm:w-4/10">
                <button
                  className="w-full bg-primary text-white px-4 py-2 rounded font-semibold font-sans cursor-pointer sm:w-9/10"
                  type="button"
                >
                  Update
                </button>

                <div className="relative w-2/10">
                  <button
                    type="submit"
                    className="h-[40px] bg-primary text-white px-4 py-2 rounded font-semibold font-sans cursor-pointer flex items-center justify-center"
                    onClick={() => {
                      setShowOtherDropdown(!showOtherDropdown);
                    }}
                    data-dropdown-toggle="dropdownOther"
                  >
                    <EllipsisVertical className="w-5 h-5" />
                  </button>

                  {showOtherDropdown && (
                    <div id="dropdownOther" className="absolute right-0 mt-0 w-48 bg-white rounded-md shadow-lg z-10">
                      <ul className="py-1">
                        <li className="font-extraboldsans text-gray-700 cursor-pointer hover:opacity-70">
                          <button type="button" className="cursor-pointer px-4 py-2 w-full h-full text-left" onClick={handleSendSMSButtonClick}>Send SMS</button>
                        </li>
                        <li className="font-extraboldsans px-4 py-2 text-gray-700 cursor-pointer hover:opacity-70">
                          Send Email
                        </li>
                        <li className="font-extraboldsans px-4 py-2 text-gray-700 cursor-pointer hover:opacity-70">
                          Export
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full max-w-2xl mt-3">
              {
                attendees.length > 0 ? attendees.map((att, i) => (
                  <AttendeesCard
                    key={i}
                    name={attendees[i].first_name + " " + attendees[i].last_name}
                    isPresent={att.attended ?? false}
                    who_attended={att.who_attended ?? "None"}
                    handleToggle={() => {
                      const updRemoveCkl = [...removeChecklist]
                      updRemoveCkl[i] = !removeChecklist[i]
                      setRemoveChecklist(updRemoveCkl)
                    }}
                  />
                )) : <div className="text-center text-white w-full max-w-2xl items-center mt-2 mr-2 font-sans bg-primary p-5 rounded-[5px] font-semibold mb-2"> "No data to show" </div>
              }
            </div>
          </div>
        </div>
      </div>
      {/* just shoving my modals down here cause it doesn't matter where they are technically. */}
      <SendSMSModal onClose={() => { console.log("hi"); setIsShowSMSModal(false) }} attendees={attendees} showModal={isShowSMSModal} event={event ?? {} as Event} />
    </>
  );
}