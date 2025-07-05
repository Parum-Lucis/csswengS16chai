import { useNavigate, useParams } from "react-router";
import "../css/styles.css";
import { UserContext } from "../context/userContext.ts";
import { useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore"
import type { Volunteer } from "../models/volunteerType.ts";
import { createPortal } from 'react-dom';
import { toast } from "react-toastify";

export function YourProfile() {
    // const params = useParams()
    const [volunteer, setVolunteer] = useState<Volunteer | null>(null)
    const [originalVolunteer, setOriginalVolunteer] = useState<Volunteer | null>(null)
    const [formState, setForm] = useState<boolean | null>(null);
    const [docID, setDocID] = useState(volunteer?.docID)
    const [showDeleteModal, setDeleteModal] = useState(false)
    
    useEffect(() =>  {
        const fetchBeneficiary = async () => {
            const getQuery = doc(db, "volunteers", "test-vol-1")
            const volunteerSnap = await getDoc(getQuery)
            if(volunteerSnap.exists())
            setVolunteer(volunteerSnap.data() as Volunteer)
            setOriginalVolunteer(volunteerSnap.data() as Volunteer)
            setDocID(volunteerSnap.id)
            setForm(true)
        }
        fetchBeneficiary()
    }, [setVolunteer])
    console.log(volunteer)
    const navigate = useNavigate();
    const usertest = useContext(UserContext);
    const { sex, contact_number : contact, email, is_admin, address } = volunteer || {}
    const birthdate = new Date((volunteer?.birthdate.seconds ?? 0)*1000)

    useEffect(() => {

        // If there is no user logged in, skip this page and redirect to login page.
        if (usertest === null) {
        navigate("/");
        }
    }, [usertest, navigate]);

    useEffect(() =>{
        document.body.style.overflow = showDeleteModal ? 'hidden': 'unset';
    },[showDeleteModal ]);

    function handleDelete(){
        setDeleteModal(!showDeleteModal)
    }

    const handleConfirm = async () => {
        setDeleteModal(!showDeleteModal)
        
        const updateRef = doc(db, "volunteers", docID!)
        console.log(volunteer)
        await updateDoc(updateRef, {
        ...volunteer,
        time_to_live : (Date.now() + 2592000000)
        })
        toast.success("Account delete success!")
        navigate("/")
    }

    function handleEdit(){
        if (formState === false && originalVolunteer) {
            setVolunteer(originalVolunteer);
        }
        setForm(!formState)
    }

    const handleSave = 
    async () => {
        setForm(!formState)
        if(!(sex!.toString().trim()) || !(contact!.toString().trim()) || !(email!.toString().trim()) || !(address!.toString().trim())) {
            toast.error("Please fill up all fields!")
            return
        }
        const emailRegEx = new RegExp(
            /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
        ); // from https://emailregex.com/
        if (!emailRegEx.test(email!)) {
            toast.error("Please input a proper email!");
            return
        }
        const updateRef = doc(db, "volunteers", docID!)
        console.log(volunteer)
        try {
            await updateDoc(updateRef, {
            ...volunteer
            })
            setOriginalVolunteer(volunteer)
            toast.success("Account update success!")
            setTimeout(function() {
                location.reload();
            }, 1000);
        } catch {
            toast.error("Something went wrong")
        }
    }

    return (
        <div className="w-full min-h-screen bg-[#254151] flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
            {showDeleteModal &&(
                createPortal(
                    <div className="transition-all duration-300 fixed top-0 right-0 left-0 bottom-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-sm p-6 w-full max-w-md">
                            <h2 className="text-lg font-bold text-[#254151] mb-4">Confirm Deletion</h2>
                            <p className="mb-6 text-[#254151]">Are you sure you want to delete this account? This action cannot be undone.</p>
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
            <div className="relative w-full max-w-4xl rounded-md flex flex-col items-center pt-8 pb-10 px-4 sm:px-6 overflow-hidden">
                <div className="-top-5 sm:-top-20 z-10 w-32 h-32 sm:w-36 sm:h-36 bg-gray-500 border-[5px] border-[#45B29D] rounded-full flex items-center justify-center mb-1">
                    <i className="flex text-[6rem] sm:text-[8rem] text-gray-300 fi fi-ss-circle-user"></i>
                </div>

            <button
                onClick={() => auth.signOut()}
                className="absolute left-4 top-8 bg-[#45B29D] text-white px-4 py-2 rounded font-semibold hover:bg-[#45b29c8a] transition">
                Sign Out
            </button>
            {(formState === null) && (
            <h3
                className="z-1 fixed right-4 bottom-15 bg-[#e7c438] text-white px-4 py-2 rounded font-semibold hover:bg-[#45b29c8a] transition">
                Fetching...
            </h3>
            )}

            <div className="w-full max-w-2xl bg-[#45B29D] rounded-md px-4 sm:px-6 py-8">
                <h3 className="text-[#254151] text-2xl text-center font-bold font-[Montserrat]">
                {volunteer?.last_name}, {volunteer?.first_name} {volunteer?.is_admin ? "(Admin)": ""}
                </h3>
                <div className="flex flex-col gap-4 mt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-col flex-1">
                    <label
                        htmlFor="bDate"
                        className="mb-1 bg-[#254151] text-white px-2 py-1 rounded font-semibold font-[Montserrat]">
                        Birth Date:
                    </label>
                    <input
                        type="date"
                        id="bDate"
                        className="w-full text-white border border-[#254151] bg-[#3EA08D] rounded px-3 py-2 font-[Montserrat]"
                        readOnly={formState ?? true}
                        onChange={(e) => setVolunteer({...volunteer as Volunteer, birthdate : Timestamp.fromMillis(Date.parse(e.target.value))})}
                        value={birthdate?.toISOString().substring(0,10)}/>
                    </div>

                    <div className="flex flex-col flex-1">
                    <label
                        htmlFor="Sex"
                        className="mb-1 bg-[#254151] text-white px-2 py-1 rounded font-semibold font-[Montserrat]">
                        Sex:
                    </label>
                    <input
                        type="text"
                        id="Sex"
                        className="w-full text-white border border-[#254151] bg-[#3EA08D] rounded px-3 py-2 font-[Montserrat]"
                        readOnly={formState ?? true}
                        onChange={(e) => setVolunteer({...volunteer as Volunteer, sex : e.target.value})}
                        value={sex}/>
                    </div>
                </div>
                <div className="flex flex-col">
                    <label
                        htmlFor="email"
                        className="mb-1 bg-[#254151] text-white px-2 py-1 rounded font-semibold font-[Montserrat]">
                    Email:
                    </label>
                    <input
                        type="email"
                        id="email"
                        className="w-full text-white border border-[#254151] bg-[#3EA08D] rounded px-3 py-2 font-[Montserrat]"
                        readOnly={formState ?? true}
                        onChange={(e) => setVolunteer({...volunteer as Volunteer, email : e.target.value})}
                        value={email}
                        />
                </div>
                <div className="flex flex-col">
                    <label
                        htmlFor="cNum"
                        className="mb-1 bg-[#254151] text-white px-2 py-1 rounded font-semibold font-[Montserrat]">
                    Contact No:
                    </label>
                    <input
                        type="number"
                        id="cNum"
                        className="w-full text-white border border-[#254151] bg-[#3EA08D] rounded px-3 py-2 font-[Montserrat]"
                        readOnly={formState ?? true}
                        onChange={(e) => setVolunteer({...volunteer as Volunteer, contact_number : e.target.value})}
                        value={"0"+Number(contact)}
                        />
                </div>
                <div className="flex flex-col">
                    <label
                        htmlFor="add"
                        className="mb-1 bg-[#254151] text-white px-2 py-1 rounded font-semibold font-[Montserrat]">
                    Address:
                    </label>
                    <input
                        type="text"
                        id="add"
                        className="w-full text-white border border-[#254151] bg-[#3EA08D] rounded px-3 py-2 font-[Montserrat]"
                        readOnly={formState ?? true}
                        onChange={(e) => setVolunteer({...volunteer as Volunteer, address : e.target.value})}
                        value={address}/>
                </div>
                <div className="flex flex-row items-center justify-around w-full gap-4">
                    {(!formState && formState !== null) && (
                    <button
                        type="submit"
                        className="mt-2 w-full bg-red-600 text-white px-4 py-2 rounded font-semibold font-[Montserrat] cursor-pointer"
                        onClick={handleEdit}>
                        Discard
                    </button>
                    )}
                    <button
                        type="submit"
                        className="mt-2 w-full bg-[#254151] text-white px-4 py-2 rounded font-semibold font-[Montserrat] cursor-pointer"
                        onClick={formState ? handleEdit : handleSave}
                        disabled={formState===null}>
                    {formState || formState === null ? "Edit" : "Save Changes"}
                    </button>
                </div>
                <button
                        type="submit"
                        className="mt-2 w-full bg-[#254151] text-white px-4 py-2 rounded font-semibold font-[Montserrat] cursor-pointer"
                        onClick={handleDelete}
                        disabled={formState===null}>
                        Delete Account
                </button>
                </div>
             </div>
        </div>
    </div>
    );
}


