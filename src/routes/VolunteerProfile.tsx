import { useNavigate, useParams } from "react-router";
import "../css/styles.css";
import { UserContext } from "../util/userContext";
import { useContext, useEffect, useState } from "react";
import { auth, db, store } from "../firebase/firebaseConfig";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore"
import type { Volunteer } from "@models/volunteerType";
import { createPortal } from 'react-dom';
import { toast } from "react-toastify";
import { emailRegex } from "../util/emailRegex";
import { callDeleteVolunteerProfile, callPromoteVolunteerToAdmin } from "../firebase/cloudFunctions";
import { signOut } from "firebase/auth";
import { ProfilePictureInput } from "../components/ProfilePicture";
import { volunteerConverter } from "../util/converters";
import { deleteObject, getBlob, ref, uploadBytes } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

export function VolunteerProfile() {
    const params = useParams()
    const user = useContext(UserContext);
    const [volunteer, setVolunteer] = useState<Volunteer | null>(null)
    const [originalVolunteer, setOriginalVolunteer] = useState<Volunteer | null>(null)
    const [isViewForm, setIsViewForm] = useState<boolean>(true);
    const [docID, setDocID] = useState(volunteer?.docID)
    const [showDeleteModal, setDeleteModal] = useState(false)

    useEffect(() => {
        const fetchBeneficiary = async () => {
            if (!params.docId) return
            const getQuery = doc(db, "volunteers", params.docId).withConverter(volunteerConverter)
            const volunteerSnap = await getDoc(getQuery)
            if (volunteerSnap.exists()) {
                const data = volunteerSnap.data()
                console.log(data)
                setVolunteer(data)
                setOriginalVolunteer(data)
                setDocID(volunteerSnap.id)
                setIsViewForm(true)
                if (data.pfpPath) {
                    const path = data.pfpPath;
                    const r = ref(store, path);
                    const blob = await getBlob(r);
                    setVolunteer(prev => (prev === null ? null : { ...prev, pfpFile: new File([blob], path) }))
                }
            }
        }
        fetchBeneficiary()
    }, [params.docId])
    const navigate = useNavigate();
    const { first_name, last_name, sex, contact_number: contact, email, address } = volunteer || {}
    const birthdate = new Date((volunteer?.birthdate.seconds ?? 0) * 1000)

    useEffect(() => {
        document.body.style.overflow = showDeleteModal ? 'hidden' : 'unset';
    }, [showDeleteModal]);

    function handleDelete() {
        setDeleteModal(!showDeleteModal)
    }

    const handleConfirm = async () => {
        setDeleteModal(!showDeleteModal)

        try {

            const res = await callDeleteVolunteerProfile(docID);

            if (!res.data) {
                toast.error("Couldn't delete this profile.")
            } else {
                setDeleteModal(!showDeleteModal)
                toast.success("Account delete success!")
                if (user?.uid === params.docId) {
                    signOut(auth);
                    navigate("/");
                }
                else
                    navigate('../')
            }

        } catch (error) {
            console.log(error)
            toast.error("Couldn't delete this profile.");
        }
    }

    function handleEdit() {
        if (isViewForm === false && originalVolunteer) {
            setVolunteer(originalVolunteer);
        }
        setIsViewForm(!isViewForm)
    }

    const handleSave =
        async () => {
            setIsViewForm(!isViewForm)
            if (!(first_name!.toString().trim()) || !(last_name!.toString().trim()) || !(sex!.toString().trim()) || !(contact!.toString().trim()) || !(email!.toString().trim()) || !(address!.toString().trim())) {
                toast.error("Please fill up all fields!")
                return
            }

            if (contact!.length != 11 || contact!.slice(0, 2) != "09") {
                toast.error('Please input an 11-digit contact number starting with "09"!');
                return
            }

            if (!emailRegex.test(email!)) {
                toast.error("Please input a proper email!");
                return
            }

            let newFilePath: string;
                try {
                    newFilePath = `pfp/volunteers/${crypto.randomUUID()}`;
                } catch {
                    newFilePath = `pfp/volunteers/${uuidv4()}`;
                }
            const updateRef = doc(db, "volunteers", docID!)
            try {

                // did they try to upload a picture?
                if (volunteer?.pfpFile) {
                    // delete the existing picture and upload new one.
                    const { pfpFile, ...volunteerRed } = volunteer;
                    if (originalVolunteer?.pfpPath) {
                        const oldRef = ref(store, originalVolunteer.pfpPath);
                        deleteObject(oldRef); // don't even wait for it.
                    }

                    // upload the new picture
                    const newPfpRef = ref(store, newFilePath);
                    await Promise.all([
                        uploadBytes(newPfpRef, pfpFile),
                        updateDoc(updateRef, {
                            ...volunteerRed,
                            pfpPath: newFilePath
                        })
                    ])
                } else {
                    await updateDoc(updateRef, {
                        ...volunteer,
                    })
                }


                setOriginalVolunteer(volunteer)
                toast.success("Account update successs!")
            } catch {
                toast.error("Something went wrong")
            }
        }

    async function handlePromote() {
        if (params.docId === null) return;

        const res = await callPromoteVolunteerToAdmin(params.docId);
        if (res.data) {
            toast.info("Successfully promoted the Volunteer!");
            setOriginalVolunteer(v => v === null ? null : ({ ...v, is_admin: true, role: "Volunteer" }))
        } else {
            toast.error("couldn't promote volunteer");
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
                            {
                                user?.uid === params.docId &&
                                <p className="mb-6 text-secondary">This is your own account. You will be <b>logged</b> out.</p>}
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

                {(isViewForm === null) && (
                    <h3
                        className="z-1 fixed right-4 bottom-20 bg-[#e7c438] text-white px-4 py-2 rounded font-semibold md:right-5 md:bottom-25">
                        Fetching...
                    </h3>
                )}

                <div className="mt-30 w-full max-w-2xl bg-primary rounded-md px-4 sm:px-6 py-8 pt-25">
                    <div className="flex flex-col items-center">
                        {isViewForm ? (
                            <h3 className="text-secondary text-2xl text-center font-bold font-sans">
                                {`${volunteer?.last_name}, ${volunteer?.first_name}`.length > 15
                                    ? `${volunteer?.last_name}, ${volunteer?.first_name}`.slice(0, 15) + "..."
                                    : `${volunteer?.last_name}, ${volunteer?.first_name}`}
                                
                                <br />

                                {`${volunteer?.is_admin ? "(Admin)" : ""}`}
                            </h3>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex flex-col">
                                    <label htmlFor="fName" className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                                        First Name
                                    </label>
                                    <input
                                        id="fName"
                                        name="fName"
                                        type="text"
                                        className="input-text w-full"
                                        onChange={(e) => setVolunteer({ ...volunteer as Volunteer, first_name: e.target.value })}
                                        value={first_name}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="lName" className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                                        Last Name
                                    </label>
                                    <input
                                        id="lName"
                                        name="lName"
                                        type="text"
                                        className="input-text w-full"
                                        onChange={(e) => setVolunteer({ ...volunteer as Volunteer, last_name: e.target.value })}
                                        value={last_name}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-4 mt-6">
                        <ProfilePictureInput readOnly={isViewForm} pfpFile={volunteer?.pfpFile ?? null}
                            onPfpChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    const files = e.target.files;
                                    setVolunteer(prev => prev === null ? null : ({ ...prev, pfpFile: files[0] }))
                                }
                            }} />
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
                                    readOnly={isViewForm ?? true}
                                    onChange={(e) => setVolunteer({ ...volunteer as Volunteer, birthdate: Timestamp.fromMillis(Date.parse(e.target.value)) })}
                                    value={birthdate?.toISOString().substring(0, 10)} />
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
                                    readOnly={isViewForm ?? true}
                                    onChange={(e) => setVolunteer({ ...volunteer as Volunteer, sex: e.target.value })}
                                    value={sex} />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <label
                                htmlFor="email"
                                className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                                Email:
                            </label>
                            <input
                                type="email"
                                id="email"
                                className="w-full text-white border border-secondary bg-tertiary rounded px-3 py-2 font-sans"
                                readOnly={isViewForm ?? true}
                                onChange={(e) => setVolunteer({ ...volunteer as Volunteer, email: e.target.value })}
                                value={email}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label
                                htmlFor="cNum"
                                className="mb-1 bg-secondary text-white px-2 py-1 rounded font-semibold font-sans">
                                Contact No:
                            </label>
                            <input
                                type="number"
                                id="cNum"
                                className="w-full text-white border border-secondary bg-tertiary rounded px-3 py-2 font-sans"
                                readOnly={isViewForm ?? true}
                                onChange={(e) => setVolunteer({ ...volunteer as Volunteer, contact_number: e.target.value })}
                                value={"0" + Number(contact)}
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
                                readOnly={isViewForm ?? true}
                                onChange={(e) => setVolunteer({ ...volunteer as Volunteer, address: e.target.value })}
                                value={address} />
                        </div>
                        <div className="flex flex-row items-center justify-around w-full gap-4">
                            {(!isViewForm && isViewForm !== null) && (
                                <button
                                    type="submit"
                                    className="mt-2 w-full bg-red-600 text-white px-4 py-2 rounded font-semibold font-sans cursor-pointer"
                                    onClick={handleEdit}>
                                    Discard
                                </button>
                            )}
                            <button
                                type="submit"
                                className="mt-2 w-full bg-secondary text-white px-4 py-2 rounded font-semibold font-sans cursor-pointer"
                                onClick={isViewForm ? handleEdit : handleSave}
                                disabled={isViewForm === null}>
                                {isViewForm || isViewForm === null ? "Edit" : "Save"}
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="mt-2 w-full bg-secondary text-white px-4 py-2 rounded font-semibold font-sans cursor-pointer"
                            onClick={handleDelete}
                            disabled={isViewForm === null}>
                            Delete Account
                        </button>
                        {
                            !originalVolunteer?.is_admin &&
                            <button
                                type="button"
                                className="mt-2 w-full bg-[#254151] text-white px-4 py-2 rounded font-semibold font-[Montserrat] cursor-pointer"
                                onClick={handlePromote}
                                disabled={isViewForm === null}>
                                Promote account to Admin
                            </button>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}