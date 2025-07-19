import type { Beneficiary } from "@models/beneficiaryType";
import { startTransition, useEffect, useOptimistic, useState } from "react";
import { collection, doc, getDocs, query, QueryDocumentSnapshot, updateDoc, where, type FirestoreDataConverter } from "firebase/firestore";
import { differenceInDays, differenceInYears } from "date-fns";
import { db } from "../../firebase/firebaseConfig";
import { toast } from "react-toastify";
import { DeletedProfileList } from "./DeletedProfileList";

const converter: FirestoreDataConverter<Beneficiary> = {
    toFirestore: (data: Beneficiary) => data,
    fromFirestore: (snap: QueryDocumentSnapshot) =>
        snap.data() as Beneficiary
}


export function DeletedBeneficiaryList() {

    const [profiles, setProfiles] = useState<Beneficiary[]>([]);
    const [isFetching, setLoading] = useState<boolean>(true);

    const [oProfiles, removeOProfiles] = useOptimistic<Beneficiary[], string>(
        profiles,
        (prev, removedId) => prev.filter((val) => val.docID !== removedId)
    )

    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>("");
    const [search, setSearch] = useState<string>("");

    useEffect(() => {
        async function run() {
            try {
                const q = query(collection(db, "beneficiaries"), where("time_to_live", "!=", null)).withConverter(converter);
                const res = await getDocs(q);
                setProfiles(res.docs.map(doc => ({ ...doc.data(), docID: doc.id })));
            } catch (error) {
                toast.error("Couldn't load beneficiaries.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        run();
    }, [])

    function handleRestore(profile: Beneficiary) {
        const name = profile.first_name + " " + profile.last_name;
        const docId = profile.docID
        startTransition(async () => {
            try {
                removeOProfiles(docId);
                const d = doc(db, "beneficiaries", docId);

                await updateDoc(d, { time_to_live: null });

                toast.success("successfully restored " + name);
                setProfiles(b => b.filter(v => v.docID !== docId));
            } catch (error) {
                console.log(error);
                toast.error("couldn't restored " + name);
            }
        })
    }

    return (
        <div className="w-full max-w-md mx-auto mt-6 p-4">
            <h1 className="text-center text-6xl font-bold text-[#254151] mb-4 font-[Montserrat]">Profile List</h1>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="p-2 rounded-md border border-gray-300 text-sm"
                >
                    <option value="">Filter By</option>
                    <option value="admin">Admins</option>
                    <option value="volunteer">Volunteers (Non-Admin)</option>
                </select>

                <select
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    className="p-2 rounded-md border border-gray-300 text-sm"
                >
                    <option value="">Sort by</option>
                    <option value="last">Last Name</option>
                    <option value="first">First Name</option>
                    <option value="age">Age</option>
                </select>

                <input
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="p-2 rounded-md border border-gray-300 text-sm"
                />
            </div>
            <DeletedProfileList<Beneficiary>

                profiles={oProfiles}
                ProfileCard={DeletedBeneficiaryCard}
                handleRestore={handleRestore}
                loading={isFetching}


            />
        </div>
    )
}

function DeletedBeneficiaryCard({ profile, onRestore }:
    { profile: Beneficiary, onRestore: (profile: Beneficiary) => void }) {
    const { first_name, last_name, sex, birthdate, time_to_live } = profile;
    console.log(time_to_live)
    const daysLeftuntilDeleted = time_to_live ? differenceInDays(time_to_live.toDate(), new Date()) : "?"
    // const daysLeftuntilDeleted = "hi"
    return (

        <div
            className="flex items-center justify-between bg-[#45B29D] text-white rounded-xl p-4 shadow-md transition"
        >
            <div className="flex-grow flex items-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
                    <svg
                        className="w-6 h-6 text-[#45B29D]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
                        />
                    </svg>
                </div>
                <div className="flex flex-col text-sm">
                    <span className="font-bold text-base font-[Montserrat]">
                        {`${last_name.toUpperCase()}, ${first_name}`}
                    </span>
                    <span>Age: {differenceInYears(new Date(), birthdate.toDate())}</span>
                    <span>Sex: {sex}</span>
                    <span>Days Left: <span className="text-red-500 font-bold">{daysLeftuntilDeleted}</span></span>
                </div>
            </div>

            <button onClick={() => onRestore(profile)} className="cursor-pointer h-full">
                <svg xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-undo2-icon lucide-undo-2">
                    <path d="M9 14 4 9l5-5" />
                    <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
                </svg>
            </button>

        </div>


    );
}