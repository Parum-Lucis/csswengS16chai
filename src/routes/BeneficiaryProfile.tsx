import EventCard from "../components/EventCard";
import { useNavigate, useParams } from "react-router";
import "../css/styles.css";
import { useEffect, useMemo, useState } from "react";
import { db, store } from "../firebase/firebaseConfig";
import { doc, getDoc, getDocs, Timestamp, updateDoc, collectionGroup, where, query } from "firebase/firestore"
import type { Beneficiary } from "@models/beneficiaryType";
import GuardianCard from "../components/GuardianCard";
import { toast } from "react-toastify";
import { createPortal } from 'react-dom';
// import { Baby, Notebook, Pencil, Percent, SquareChartGantt, UserRound } from 'lucide-react';
import type { Guardian } from "@models/guardianType";
import type { AttendedEvents } from "@models/attendedEventsType";
import { emailRegex } from "../util/emailRegex";
import { add, compareAsc } from "date-fns";
// import type { Event } from "@models/eventType";
import { ProfilePictureInput } from "../components/ProfilePicture";
import { beneficiaryConverter } from "../util/converters";
import { deleteObject, getBlob, ref, uploadBytes } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

export function BeneficiaryProfile() {
    const params = useParams()
    const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null)
    const [originalBenificiary, setOriginalBeneficiary] = useState<Beneficiary | null>(null)
    const [formState, setForm] = useState<boolean | null>(null);
    const [guardians, setGuardians] = useState<Guardian[]>([])
    const [minimizeState, setMinimize] = useState(false)
    const [showDeleteModal, setDeleteModal] = useState(false)
    const [docID, setDocID] = useState(beneficiary?.docID)
    const [gradeLevel, setGradeLevel] = useState<string>("");
    // attendee list
    const [attendedEvents, setAttendedEvents] = useState<AttendedEvents[]>([])
    const [attendance, setAttendance] = useState({ present: 0, events: 0 })

    useEffect(() => {
        const fetchBeneficiary = async () => {
            const getQuery = doc(db, "beneficiaries", params.docId as string).withConverter(beneficiaryConverter)
            const beneficiariesSnap = await getDoc(getQuery)
            if (beneficiariesSnap.exists()) {
                const data = beneficiariesSnap.data();
                setBeneficiary(data)
                setOriginalBeneficiary(data)
                setGuardians(data.guardians)
                setDocID(beneficiariesSnap.id)
                setGradeLevel(data.grade_level.toString()) // see commit desc re: this change
                if (data.pfpPath) {
                    const path = data.pfpPath;
                    const r = ref(store, path);
                    const blob = await getBlob(r);
                    setBeneficiary(prev => (prev === null ? null : { ...prev, pfpFile: new File([blob], path) }))
                }
            }

            setForm(true)

            const attList: AttendedEvents[] = []
            let pres = 0
            let events = 0
            const attRef = await getDocs(query(collectionGroup(db, "attendees"), where("beneficiaryID", "==", beneficiariesSnap.id)))
            attRef.forEach((att) => {
                const attData = att.data() as AttendedEvents
                attList.push({ ...attData, docID: att.ref.parent.parent!.id }); // docID is eventID here
                // ignore if null/undefined (means event hasn't happened)
                if (attData.event_start.toMillis() < (Date.now() - ((new Date()).getTimezoneOffset() * 60000))) {
                    if (attData.attended ?? false)
                        pres += 1
                    events += 1
                }
            })
            setAttendedEvents(attList)
            setAttendance({ present: pres, events: events })
        }
        fetchBeneficiary()
    }, [setBeneficiary, setAttendedEvents, params.docId])
    console.log(beneficiary)
    console.log(guardians)
    const navigate = useNavigate();
    const { sex, address } = beneficiary || {}

    const birthdate = new Date((beneficiary?.birthdate.seconds ?? 0) * 1000)

    useEffect(() => {
        document.body.style.overflow = showDeleteModal ? 'hidden' : 'unset';
    }, [showDeleteModal]);

    // thx liana for code :pray:
    const [filter, setFilter] = useState<string>("");
    const [status, setStatus] = useState<string>("");
    const [sort, setSort] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const modifiedList = useMemo<AttendedEvents[]>(() => {
        let filteredAtt = [...attendedEvents];

        // Filter profiles based on who attended
        if (filter === "beneficiary") {
            filteredAtt = filteredAtt.filter(e => e.who_attended == "Beneficiary")
        } else if (filter === "parent") {
            filteredAtt = filteredAtt.filter(e => e.who_attended == "Parent")
        } else if (filter === "family") {
            filteredAtt = filteredAtt.filter(e => e.who_attended == "Family")
        }

        // Sort profiles based on attendance status
        if (status === "present") {
            filteredAtt = filteredAtt.filter(e => e.attended && Date.now() > e.event_start.toMillis());
        } else if (status === "absent") {
            filteredAtt = filteredAtt.filter(e => !(e.attended) && Date.now() > e.event_start.toMillis())
        } else if (status === "upcoming") {
            filteredAtt = filteredAtt.filter(e => Date.now() < e.event_start.toMillis())
        }

        // Sort profiles based on event
        if (sort === "name") {
            filteredAtt.sort((a, b) => a.event_name.localeCompare(b.event_name));
        } else if (sort === "oldest") {
            filteredAtt.sort((a, b) => compareAsc(a.event_start.toDate(), b.event_start.toDate()))
        } else if (sort === "latest") {
            filteredAtt.sort((a, b) => compareAsc(b.event_start.toDate(), a.event_start.toDate()))
        }

        // Search filter (partial or exact matches on name)
        if (search.trim() !== "") {
            const searchLower = search.trim().toLowerCase();
            const terms = searchLower.split(/[\s,]+/).filter(Boolean);

            filteredAtt = filteredAtt.filter(att => {
                const values = [
                    att.event_name.toLowerCase()
                ];
                return terms.every(term =>
                    values.some(value => value.includes(term))
                );
            });
        }
        return filteredAtt
    }, [attendedEvents, filter, sort, status, search])

    function handleEdit() {
        if (formState === false && originalBenificiary) {
            setBeneficiary(originalBenificiary);
            setGradeLevel(originalBenificiary.grade_level.toString());
            // if guardians were modified, return to original
            if (guardians != originalBenificiary.guardians) {
                setGuardians(originalBenificiary.guardians);
            }
        }
        setForm(!formState)
    }

    function handleMinimize() {
        setMinimize(!minimizeState)
    }

    function handleAdd() {
        if (guardians.length + 1 <= 3) {
            setGuardians([...guardians, {
                name: '',
                relation: '',
                email: '',
                contact_number: ''
            }])
        }
        else
            toast.error("Cannot add more than 3 guardians!")
    }


    function handleSub() {
        if (guardians.length - 1 >= 1) {
            // applied
            const reducedGuardians = guardians.slice(0, -1);
            setGuardians(reducedGuardians)
            setBeneficiary({ ...beneficiary as Beneficiary, guardians: reducedGuardians })
        }
        else
            toast.error("Cannot have 0 guardians!")
    }

    function handleDelete() {
        setDeleteModal(!showDeleteModal)
    }

    const handleConfirm = async () => {
        setDeleteModal(!showDeleteModal)
        if (!beneficiary) return;

        const updateRef = doc(db, "beneficiaries", docID!)
        const { pfpFile, ...beneficiaryRes } = beneficiary;
        console.log(pfpFile);
        try {
            await updateDoc(updateRef, {
                ...beneficiaryRes,
                time_to_live: Timestamp.fromDate(add(new Date(), { days: 30 }))
            })
            toast.success("Account delete success!")
            navigate("/beneficiary")
            navigate("/beneficiary")
        }
        catch (e) {
            console.error(e)
            toast.error("Something went wrong")
        }
    }

    const handleSave =
        async () => {
            if (!sex?.trim() || !gradeLevel.trim() || !address?.trim() || !birthdate) {
                toast.error("Please fill up all fields!")
                return
            }

            if (!gradeLevel.trim()) {
                toast.error("Please put a valid Grade Number")
                return
            }
            const updateRef = doc(db, "beneficiaries", docID!)
            console.log(beneficiary)

            // const emailRegEx = new RegExp(
            //     /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
            // ); // from https://emailregex.com/
            let test = false
            guardians.forEach((guardian, i) => {
                Object.values(guardian).forEach((val) => {
                    if (!(val.toString().trim())) {
                        toast.error("Please fill up all fields for Guardian " + (i + 1));
                        test = true
                        return
                    }
                })
                if (test)
                    return
                else if (!emailRegex.test(guardian.email)) {
                    console.log(guardian.email)
                    toast.error("Please input a proper email for Guardian " + (i + 1));
                    test = true
                    return
                }
                else if (guardian.contact_number.length != 11 || guardian.contact_number.slice(0, 2) != "09") {
                    toast.error('Please input an 11-digit contact number starting with "09" for Guardian ' + (i + 1));
                    test = true
                    return
                }

            });
            if (test)
                return
            try {

                let newFilePath: string;
                try {
                    newFilePath = `pfp/beneficiaries/${crypto.randomUUID()}`;
                } catch {
                    newFilePath = `pfp/beneficiaries/${uuidv4()}`;
                }

                if (beneficiary?.pfpFile) {
                    const { pfpFile, ...volunteerRed } = beneficiary;
                    if (originalBenificiary?.pfpPath) {
                        const oldRef = ref(store, originalBenificiary.pfpPath);
                        deleteObject(oldRef); // don't even wait for it.
                    }

                    // upload the new picture
                    const newPfpRef = ref(store, newFilePath);
                    await Promise.all([
                        uploadBytes(newPfpRef, pfpFile),
                        updateDoc(updateRef, {
                            ...volunteerRed,
                            pfpPath: newFilePath,
                            grade_level: gradeLevel,
                            guardians,
                        })
                    ])
                } else {
                    await updateDoc(updateRef, {
                        ...beneficiary,
                        grade_level: gradeLevel,
                        guardians,
                    })
                }

                setOriginalBeneficiary({ ...beneficiary as Beneficiary, grade_level: gradeLevel, guardians: guardians })
                setForm(true);
                toast.success("Account update success!")
            } catch (e) {
                toast.error("Something went wrong!");
                console.log(e);
            }
        }

    return (
        <div className="w-full min-h-screen bg-secondary flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
            {showDeleteModal && (
                createPortal(
                    <div className="fixed top-0 right-0 left-0 bottom-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-sm p-6 w-full max-w-md">
                            <h2 className="text-lg font-bold text-secondary mb-4">Confirm Deletion</h2>
                            <p className="mb-6 text-secondary">Are you sure you want to delete this account? This action cannot be undone.</p>
                            <div className="flex justify-end gap-3">
                                <button
                                    className="bg-gray-300 hover:bg-gray-400 text-secondary font-semibold px-4 py-2 rounded"
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
            <div className="relative w-full max-w-4xl rounded-md flex flex-col items-center pb-10 px-4 sm:px-6 overflow-hidden">

                {(formState === null) && (
                    <h3
                        className="z-1 fixed right-4 bottom-20 bg-[#e7c438] text-white px-4 py-2 rounded font-semibold md:right-5 md:bottom-25">
                        Fetching...
                    </h3>
                )}
                <ProfilePictureInput readOnly={formState ?? true} pfpFile={beneficiary?.pfpFile ?? null}
                    onPfpChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            const files = e.target.files;
                            setBeneficiary(prev => prev === null ? null : ({ ...prev, pfpFile: files[0] }))
                        }
                    }} />
                <div className="relative mt-30 w-full max-w-2xl bg-primary rounded-md px-4 sm:px-6 py-8 pt-25">
                    <div className="flex flex-col items-end mr-[-0.5rem] mt-[-5rem]">
                        <SemiCircularProgress value={attendance.events > 0 ? (attendance.present / attendance.events) * 100 : 0} />
                    </div>
                    <div className="flex flex-row justify-center gap-2">
                        {formState === true && (
                            <h3 className="text-secondary text-2xl text-center font-bold font-sans">
                                {`${beneficiary?.last_name}, ${beneficiary?.first_name}`.length > 15
                                    ? `${beneficiary?.last_name}, ${beneficiary?.first_name}`.slice(0, 15) + "..."
                                    : `${beneficiary?.last_name}, ${beneficiary?.first_name}`}
                            </h3>
                        )}
                        {(formState === false) && (
                            <div className="flex flex-col justify-center sm:flex-row sm:gap-4">
                                <div className="flex flex-col w-full sm:w-1/2">
                                    <label htmlFor="fName" className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                                        First Name
                                    </label>
                                    <input
                                        id="fName"
                                        name="fName"
                                        type="text"
                                        className="input-text w-full text-sm"
                                        onChange={(e) => setBeneficiary({ ...beneficiary as Beneficiary, first_name: e.target.value })}
                                        value={beneficiary?.first_name}
                                    />
                                </div>
                                <div className="flex flex-col w-full sm:w-1/2">
                                    <label htmlFor="lName" className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                                        Last Name
                                    </label>
                                    <input
                                        id="lName"
                                        name="lName"
                                        type="text"
                                        className="input-text w-full"
                                        onChange={(e) => setBeneficiary({ ...beneficiary as Beneficiary, last_name: e.target.value })}
                                        value={beneficiary?.last_name}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="w-full flex justify-center mt-1">
                        <div className="flex flex-row gap-2 text-secondary font-sans m-2">
                            <label htmlFor="idNum">ID:</label>
                            <input
                                name="idNum"
                                id="idNum"
                                type="number"
                                className="underline text-sm text-secondary font-sans px-0 py-0 w-auto border border-secondary rounded-sm"
                                onChange={(e) => setBeneficiary({ ...beneficiary as Beneficiary, accredited_id: Number(e.target.value) })}
                                value={beneficiary?.accredited_id}
                                readOnly={formState ?? true}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 mt-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex flex-col flex-1">
                                <label
                                    htmlFor="bDate"
                                    className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                                    Birth Date:
                                </label>
                                <input
                                    type="date"
                                    id="bDate"
                                    className="appearance-none w-full text-white border border-secondary bg-tertiary rounded px-3 py-2 font-sans"
                                    readOnly={formState ?? true}
                                    onChange={(e) => setBeneficiary({ ...beneficiary as Beneficiary, birthdate: Timestamp.fromDate((new Date(e.target.value))) })}
                                    value={birthdate?.toISOString().substring(0, 10)} />
                            </div>
                            <div className="flex flex-col flex-1">
                                <label
                                    htmlFor="Sex"
                                    className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                                    Sex:
                                </label>
                                <select
                                    id="Sex"
                                    className="appearance-none w-full text-white border border-secondary bg-tertiary rounded px-3 py-2 font-sans"
                                    disabled={formState ?? true}
                                    onChange={(e) => setBeneficiary({ ...beneficiary as Beneficiary, sex: e.target.value })}
                                    value={sex}
                                >
                                    <option className="bg-secondary text-white" value="M">Male</option>
                                    <option className="bg-secondary text-white" value="F">Female</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <label
                                htmlFor="gLevel"
                                className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                                Grade Level:
                            </label>
                            <select
                                id="gLevel"
                                className="appearance-none w-full text-white border border-secondary bg-tertiary rounded px-3 py-2 font-sans"
                                disabled={formState ?? true}
                                onChange={(e) => setGradeLevel(e.target.value)}
                                value={gradeLevel}
                            >
                                <option className="bg-secondary text-white" value="N">Nursery</option>
                                <option className="bg-secondary text-white" value="K">Kindergarten</option>
                                <option className="bg-secondary text-white" value="1">1</option>
                                <option className="bg-secondary text-white" value="2">2</option>
                                <option className="bg-secondary text-white" value="3">3</option>
                                <option className="bg-secondary text-white" value="4">4</option>
                                <option className="bg-secondary text-white" value="5">5</option>
                                <option className="bg-secondary text-white" value="6">6</option>
                                <option className="bg-secondary text-white" value="7">7</option>
                                <option className="bg-secondary text-white" value="8">8</option>
                                <option className="bg-secondary text-white" value="9">9</option>
                                <option className="bg-secondary text-white" value="10">10</option>
                                <option className="bg-secondary text-white" value="11">11</option>
                                <option className="bg-secondary text-white" value="12">12</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label
                                htmlFor="add"
                                className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                                Address:
                            </label>
                            <input
                                type="text"
                                id="add"
                                className="w-full text-white border border-secondary bg-tertiary rounded px-3 py-2 font-sans"
                                readOnly={formState ?? true}
                                onChange={(e) => setBeneficiary({ ...beneficiary as Beneficiary, address: e.target.value })}
                                value={address} />
                        </div>
                        {formState === false && (
                            <div className="flex flex-row justify-end gap-1">
                                <button
                                    type="button"
                                    className={`flex w-fit bg-secondary text-primary p-1 px-3 rounded-sm font-semibold font-sans cursor-pointer`}
                                    onClick={handleAdd}>
                                    +
                                </button>
                                <button
                                    type="button"
                                    className={`flex w-fit bg-secondary text-primary p-1 px-3 rounded-sm font-semibold font-sans cursor-pointer`}
                                    onClick={handleSub}>
                                    -
                                </button>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <button
                                className={`flex items-center justify-between bg-secondary text-primary px-2 py-1 rounded-t-sm font-semibold font-sans transition-all duration-300 cursor-pointer ${minimizeState ? "rounded-b-sm" : "rounded-t-sm"}`}
                                onClick={handleMinimize}>
                                Guardian Information
                                <span className="flex items-center justify-center">
                                    <i className={`text-3xl mb-[-0.5rem] fi fi-ss-angle-small-down transition-all duration-300 ${minimizeState ? "rotate-180 mt-[-1rem]" : "rotate-0"}`}></i>
                                </span>
                            </button>
                            <div className={` overflow-auto transition-all duration-300 ease-in-out ${minimizeState ? "max-h-0 opacity-0" : "max-h-96 opacity-100"}`}>
                                <div className="w-full rounded-b-sm text-white border border-secondary bg-tertiary p-3">
                                    {Array.from(
                                        { length: guardians.length },
                                        (_, i) => (
                                            <div className="pb-4">
                                                <h3 className="font-sans mb-2">Guardian {i + 1}</h3>
                                                <GuardianCard formState={formState} index={i} guardians={guardians} setGuardians={setGuardians} />
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-row items-center justify-around w-full gap-4">
                            {(!formState && formState !== null) && (
                                <button
                                    type="submit"
                                    className="mt-2 w-full bg-red-600 hover:bg-red-800 text-white px-4 py-2 rounded font-semibold font-sans cursor-pointer"
                                    onClick={handleEdit}>
                                    Discard
                                </button>
                            )}
                            <button
                                type="submit"
                                className="mt-2 w-full bg-secondary text-white px-4 py-2 rounded font-semibold font-sans cursor-pointer"
                                onClick={formState ? handleEdit : handleSave}
                                disabled={formState === null}>
                                {formState || formState === null ? "Edit" : "Save"}
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="mt-2 w-full bg-secondary text-white px-4 py-2 rounded font-semibold font-sans cursor-pointer"
                            onClick={handleDelete}
                            disabled={formState === null}>
                            Delete Account
                        </button>
                    </div>
                </div>
                <div className="w-full max-w-2xl mt-8">
                    <h3 className="text-primary text-2xl text-center font-bold font-[Montserrat] mb-4">
                        Event Record
                    </h3>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                        <select
                            className="appearance-none p-2 rounded-md border border-gray-300 text-sm w-full"
                            onChange={e => setFilter(e.target.value)}
                        >
                            <option className="bg-secondary text-white" value="">Filter By</option>
                            <option className="bg-secondary text-white" value="beneficiary">Beneficiary</option>
                            <option className="bg-secondary text-white" value="parent">Parent</option>
                            <option className="bg-secondary text-white" value="family">Family</option>
                        </select>
                        <select
                            className="appearance-none p-2 rounded-md border border-gray-300 text-sm w-full"
                            onChange={e => setStatus(e.target.value)}
                        >
                            <option className="bg-secondary text-white" value="">Attendance Status</option>
                            <option className="bg-secondary text-white" value="present">Present</option>
                            <option className="bg-secondary text-white" value="absent">Absent</option>
                            <option className="bg-secondary text-white" value="upcoming">Upcoming Events</option>
                        </select>
                        <select
                            className="appearance-none p-2 rounded-md border border-gray-300 text-sm w-full"
                            onChange={e => setSort(e.target.value)}
                        >
                            <option className="bg-secondary text-white" value="">Sort by</option>
                            <option className="bg-secondary text-white" value="name">Event Name</option>
                            <option className="bg-secondary text-white" value="latest">Latest Event</option>
                            <option className="bg-secondary text-white" value="oldest">Oldest Event</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Search"
                            className="p-2 rounded-md border border-gray-300 text-sm w-full"
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className={`space-y-2 gap-2 ${modifiedList.length === 0 ? "text-center" : ""}`}>
                        {modifiedList.map((att, index) => (
                            <EventCard key={index} attEvent={att} />
                        ))}
                        <span>{modifiedList.length === 0 ? "No Events Recorded!" : ""}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface SemiCircularProgressProps {
    value: number
}
const SemiCircularProgress = (props: SemiCircularProgressProps) => {
    return (
        <div className="flex flex-col items-center z-10">
            <div role="semicircularprogressbar" style={{ ['--value' as any]: props.value }}>
                <span className="text-sm text-secondary">{props.value}%</span>
            </div>
            <div className="mt-1 text-sm text-center text-secondary font-semibold">
                Attendance <br></br> Rate
            </div>
        </div>
    );
};
