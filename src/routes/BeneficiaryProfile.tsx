import EventCard from "../components/EventCard";
import { useNavigate, useParams } from "react-router";
import "../css/styles.css";
import { UserContext } from "../context/userContext";
import { useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, getDocs, Timestamp, updateDoc, collectionGroup, where, query } from "firebase/firestore"
import type { Beneficiary } from "@models/beneficiaryType";
import GuardianCard from "../components/GuardianCard";
import { toast } from "react-toastify";
import { createPortal } from 'react-dom';
import { callDeleteBeneficiaryProfile } from "../firebase/cloudFunctions";
import type { Guardian } from "@models/guardianType";
import type { AttendedEvents } from "@models/attendedEventsType";


export function BeneficiaryProfile() {
    const params = useParams()
    const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null)
    const [originalBenificiary, setOriginalBeneficiary] = useState<Beneficiary | null>(null)
    const [attendedEvents, setAttendedEvents] = useState<AttendedEvents[]>([])
    //formState = null, all disabled
    //formState = true, readonly
    //formState = false, edit
    const [formState, setForm] = useState<boolean | null>(null);
    //formState = 0, 0 guardian (just because lol)
    //formState = 1, 1 guardian
    //formState = 2, 2 guardian
    //formState = 3, 3 guardian
    const [guardians, setGuardians] = useState<Guardian[]>([])
    const [minimizeState, setMinimize] = useState(false)
    const [showDeleteModal, setDeleteModal] = useState(false)
    const [docID, setDocID] = useState(beneficiary?.docID)
    const [gradeLevel, setGradeLevel] = useState<string>("");


    useEffect(() =>  {
        const fetchBeneficiary = async () => {
        const getQuery = doc(db, "beneficiaries", params.docId as string)
        const beneficiariesSnap = await getDoc(getQuery)
        if(beneficiariesSnap.exists())
            setBeneficiary(beneficiariesSnap.data() as Beneficiary)
            setOriginalBeneficiary(beneficiariesSnap.data() as Beneficiary)
            setGuardians((beneficiariesSnap.data() as Beneficiary).guardians)
            console.log((beneficiariesSnap.data() as Beneficiary))
            setDocID(beneficiariesSnap.id)
            setGradeLevel((beneficiariesSnap.data() as Beneficiary).grade_level.toString()) // see commit desc re: this change
            setForm(true)

            const attList: AttendedEvents[] = []
            const attRef = await getDocs(query(collectionGroup(db, "attendees"), where("beneficiaryID", "==", beneficiariesSnap.id)))
            attRef.forEach((att) => {
                attList.push({...(att.data() as AttendedEvents), docID : att.id})
            })
            setAttendedEvents(attList)
        }
        fetchBeneficiary()
    }, [setBeneficiary, setAttendedEvents])
    console.log(beneficiary)
    console.log(guardians)
    const navigate = useNavigate();
    const usertest = useContext(UserContext);
    const { sex, grade_level : level, address} = beneficiary || {}

    const birthdate = new Date((beneficiary?.birthdate.seconds ?? 0)*1000)
        
    useEffect(() => {

        // If there is no user logged in, skip this page and redirect to login page.
        if (usertest === null) {
        navigate("/");
        }
    }, [usertest, navigate]);

    useEffect(() =>{
        document.body.style.overflow = showDeleteModal ? 'hidden': 'unset';
    },[showDeleteModal ]);


    function handleEdit(){
        if (formState === false && originalBenificiary) {
            setBeneficiary(originalBenificiary);
            setGradeLevel(originalBenificiary.grade_level.toString());
            // if guardians were modified, return to original
            if (guardians.length != originalBenificiary.guardians.length) {
                setGuardians(originalBenificiary.guardians);
            }
        }
        setForm(!formState)
    }

    function handleMinimize(){
        setMinimize(!minimizeState)
    }

    function handleAdd(){
        if (guardians.length+1 <= 3){
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
    
    function handleSub(){
        if (guardians.length-1 >= 1){
            // applied
            const reducedGuardians = guardians.slice(0, -1);
            setGuardians(reducedGuardians)
            setBeneficiary({ ...beneficiary as Beneficiary, guardians: reducedGuardians })
        }
        else
            toast.error("Cannot have 0 guardians!")
    }

    function handleDelete(){
        setDeleteModal(!showDeleteModal)
    }
    
    // THIS WILL CONFLICT. keep the other handleConfirm from profile-creation branch if ever
    // and let me know when I could fix it. ideally will be worked on when merged to main
    // const handleConfirm = async () => {
    
    //         try {
    
    //             const res = await callDeleteBeneficiaryProfile(docID);
    //             console.log(res);
    
    //             if (!res.data) {
    //                 toast.error("Couldn't delete this beneficiary profile.")
    //             } else {
    //                 setDeleteModal(!showDeleteModal)
    //                 toast.success("Beneficiary delete success!")
    //                 navigate("/") // TODO: navigate to beneficiary list
    //             }
    
    //         } catch (error) {
    //             console.log(error)
    //             toast.error("Couldn't delete this beneficiary profile.");
    //         }
    
    //     }

    const handleConfirm = async () => {
        setDeleteModal(!showDeleteModal)
        
        const updateRef = doc(db, "beneficiaries", docID!)
        console.log(beneficiary)
        try {
            await updateDoc(updateRef, {
            ...beneficiary,
            time_to_live : (Date.now() + 2592000000)
            })
            toast.success("Account delete success!")
            navigate("/")
        }
        catch {
            toast.error("Something went wrong")
        }
    }

    const handleSave = 
    async () => {
        // convert string input to number, if valid
        const gradeLevelNum = Number(gradeLevel);

        /* changed */
        // gradeLevelNum != 0 will only be true if gradeLevelNum is 0
        // modified others rin, it still checks for empty strings/whitespaces
        /*if(!(sex!.toString().trim()) || !gradeLevel || gradeLevelNum != 0 || !(address!.toString().trim()) || !birthdate){*/
        if (!sex?.trim() || !gradeLevel.trim() || !address?.trim() || !birthdate) {
            toast.error("Please fill up all fields!")
            return
        }       
        /* end of change */

        if(gradeLevelNum > 12 || gradeLevelNum < 1 || isNaN(gradeLevelNum)){
            toast.error("Please put a valid Grade Number")
            return 
        }
        const updateRef = doc(db, "beneficiaries", docID!)
        console.log(beneficiary)
        
        const emailRegEx = new RegExp(
            /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
        ); // from https://emailregex.com/
        let test = false
        guardians.forEach((guardian, i) => {
            Object.values(guardian).forEach((val, _) => {
                if(!(val.toString().trim())) {
                    toast.error("Please fill up all fields for Guardian " + (i+1));
                    test = true
                    return
                }
            })
            if(test)
                return
            else if (!emailRegEx.test(guardian.email)) {
                console.log(guardian.email)
                toast.error("Please input a proper email for Guardian " + (i+1));
                test = true
                return
            }
            else if (guardian.contact_number.length != 11 || guardian.contact_number.slice(0, 2) != "09") {
                toast.error("Please input a proper contact number for Guardian " + (i+1));
                test = true
                return
            }

        });
        if(test)
            return
        try {
            await updateDoc(updateRef, {
                ...beneficiary,
                guardians: guardians,
                grade_level: gradeLevelNum
            })
            setOriginalBeneficiary({...beneficiary as Beneficiary, grade_level: gradeLevelNum,guardians: guardians})
            toast.success("Account update success!")
            setTimeout(function() {
                location.reload();
            }, 1000);
        } catch {
            toast.error("Something went wrong")
        }
        

    }

    const eventsTest = [
        { id: 0, name: "Donation", date: "12/02/1902" },
        { id: 1, name: "Teaching", date: "12/02/1999" },
        { id: 2, name: "Airplane Visit", date: "11/09/2001" },
        { id: 3, name: "Church", date: "12/02/2004" },
        { id: 4, name: "Donation", date: "12/02/2005" },
        { id: 5, name: "Teaching", date: "12/02/2006" },
        { id: 6, name: "Food Drive", date: "12/02/2007" },
        { id: 7, name: "Food Drive", date: "12/02/2008" },
        { id: 8, name: "Christmas Party", date: "22/12/2009" },
    ];
    return (
        <div className="w-full min-h-screen bg-secondary flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
            {showDeleteModal &&(
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
                <div className="absolute sm:top-0 z-10 w-32 h-32 sm:w-36 sm:h-36 bg-gray-500 border-[10px] border-primary rounded-full flex items-center justify-center mb-1 mt-15">
                    <i className="flex text-[6rem] sm:text-[8rem] text-gray-300 fi fi-ss-circle-user"></i>
                </div>

            {(formState === null) && (
                <h3
                    className="z-1 fixed right-4 bottom-20 bg-[#e7c438] text-white px-4 py-2 rounded font-semibold md:right-5 md:bottom-25">
                    Fetching...
                </h3>
            )}

            <div className="mt-30 w-full max-w-2xl bg-primary rounded-md px-4 sm:px-6 py-8 pt-25">
                <h3 className="text-secondary text-2xl text-center font-bold font-sans">
                {beneficiary?.last_name}, {beneficiary?.first_name}
                </h3>
                <div className="w-full flex justify-center mt-1">
                    <div className="flex flex-row gap-2 text-secondary font-sans m-2">
                        <label htmlFor="idNum">ID:</label>
                        <input
                            name="idNum"
                            id="idNum"
                            type="number"
                            className="underline text-sm text-secondary font-sans px-0 py-0 w-auto border border-secondary rounded-sm"
                            onChange={(e) => setBeneficiary({...beneficiary as Beneficiary, accredited_id : Number(e.target.value)})}
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
                        onChange={(e) => setBeneficiary({...beneficiary as Beneficiary, birthdate : Timestamp.fromDate((new Date (e.target.value)))})}
                        value={birthdate?.toISOString().substring(0,10)}/>
                    </div>

                    <div className="flex flex-col flex-1">
                    <label
                        htmlFor="Sex"
                        className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                        Sex:
                    </label>
                    <input
                        type="text"
                        id="Sex"
                        className="w-full text-white border border-secondary bg-tertiary rounded px-3 py-2 font-sans"
                        readOnly={formState ?? true}
                        onChange={(e) => setBeneficiary({...beneficiary as Beneficiary, sex : e.target.value})}
                        value={sex}/>
                    </div>
                </div>
                <div className="flex flex-col">
                <label
                    htmlFor="gLevel"
                    className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                    Grade Level:
                </label>
                <input
                    type="text"
                    id="gLevel"
                    className="w-full text-white border border-secondary bg-tertiary rounded px-3 py-2 font-sans"
                    readOnly={formState ?? true}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    value={gradeLevel}
                />
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
                        onChange={(e) => setBeneficiary({...beneficiary as Beneficiary, address : e.target.value})}
                        value={address}/>
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
                          {length: guardians.length},
                          (_, i) => (
                            <div className="pb-4">
                              <h3 className="font-sans mb-2">Guardian {i + 1}</h3>
                              <GuardianCard formState={false} index={i} guardians={guardians} setGuardians={setGuardians} />
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
                        disabled={formState===null}>
                    {formState || formState === null ? "Edit" : "Save Changes"}
                    </button>
                </div>
                <button
                        type="submit"
                        className="mt-2 w-full bg-secondary text-white px-4 py-2 rounded font-semibold font-sans cursor-pointer"
                        onClick={handleDelete}
                        disabled={formState===null}>
                        Delete Account
                </button>
                </div>
            </div>
                <div className="w-full max-w-2xl mt-8">
                    <h3 className="text-primary text-2xl text-center font-bold font-sans mb-4">
                    Attended Events
                    </h3>
                    <div className="space-y-2">
                    {attendedEvents.map((att, index) => (
                        <EventCard key={index} attEvent={att}/>
                    ))}
                    </div>
                </div>
            </div>
        </div>
    );
}