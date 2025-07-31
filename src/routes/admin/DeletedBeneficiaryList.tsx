import type { Beneficiary } from "@models/beneficiaryType";
import { startTransition, useEffect, useOptimistic, useState, useMemo } from "react";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { compareDesc, differenceInDays, differenceInYears } from "date-fns";
import { db, store } from "../../firebase/firebaseConfig";
import { toast } from "react-toastify";
import { DeletedProfileList } from "./DeletedProfileList";
import { beneficiaryConverter } from "../../util/converters";
import { getBlob, ref } from "firebase/storage";

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
                const q = query(collection(db, "beneficiaries"), where("time_to_live", "!=", null)).withConverter(beneficiaryConverter);
                const res = await getDocs(q);
                setProfiles(res.docs.map(doc => doc.data()));
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

    const modifiedList = useMemo<Beneficiary[]>(() => {
            let temp = oProfiles;
            if (filter === "waitlist") {
            // waitlist: id = NaN (implementation) OR field doesnt exist for benef (incase)
            temp = temp.filter(profile => profile.accredited_id === undefined || profile.accredited_id === null || isNaN(profile.accredited_id));
            } else if (filter === "student") {
            // student: id = an existing field & number!!
            temp = temp.filter(profile => profile.accredited_id !== undefined && profile.accredited_id !== null && !isNaN(profile.accredited_id));
            }
    
            // Sort profiles based on selected sort val
            if (sort === "last") {
                temp.sort((a, b) => a.last_name.localeCompare(b.last_name));
            } else if (sort === "first") {
                temp.sort((a, b) => a.first_name.localeCompare(b.first_name));
            } else if (sort === "age") {
                temp.sort((a, b) => compareDesc(a.birthdate.toDate(), b.birthdate.toDate()));
            } else if (sort === "id") {
                temp.sort((a, b) => {
                // make waitlisted be at bottom of list for ASCENDING
                const aIsWaitlisted = isNaN(a.accredited_id);
                const bIsWaitlisted = isNaN(b.accredited_id);
                if (aIsWaitlisted && bIsWaitlisted) return 0;
                if (aIsWaitlisted) return 1;
                if (bIsWaitlisted) return -1;
                return a.accredited_id - b.accredited_id;
            });
            } else if (sort === "deletion") {
                temp.sort((a, b) =>
                    a.time_to_live !== null && a.time_to_live !== undefined && b.time_to_live !== null && b.time_to_live !== undefined ?
                        b.time_to_live?.toMillis() - a.time_to_live?.toMillis() : -1)
            }
    
            // Search filter (partial or exact matches on name and age)
            if (search.trim() !== "") {
            const searchLower = search.trim().toLowerCase();
            const terms = searchLower.split(/[\s,]+/).filter(Boolean);

            temp = temp.filter(profile => {
                const values = [
                profile.first_name.toLowerCase(),
                profile.last_name.toLowerCase(),
                // dont include birthdate, messes up results
                isNaN(profile.accredited_id) ? "waitlisted" : profile.accredited_id.toString(),
                // dont include age, messes up results when looking for id
                ];
                return terms.every(term =>
                values.some(value => value.includes(term))
                );
            });
            }
        return temp;
    }, [filter, sort, search, oProfiles])

    return (
        <div className="w-full max-w-md mx-auto mt-6 p-4">
            <h1 className="text-center text-5xl font-bold text-primary mb-4 font-sans">Deleted List</h1>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="appearance-none p-2 rounded-md border border-gray-300 text-sm w-full sm:w-3/10"
                >
                    <option className="bg-secondary text-white" value="">Filter By</option>
                    <option className="bg-secondary text-white" value="student">
                        Students
                    </option>
                    <option className="bg-secondary text-white" value="waitlist">
                        Waitlisted
                    </option>
                </select>

                <select
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    className="appearance-none p-2 rounded-md border border-gray-300 text-sm w-full sm:w-3/10"
                >
                    <option className="bg-secondary text-white" value="">Sort by</option>
                    <option className="bg-secondary text-white" value="last">
                        Last Name
                    </option>
                    <option className="bg-secondary text-white" value="first">
                        First Name
                    </option>
                    <option className="bg-secondary text-white" value="id">
                        Child ID
                    </option>
                    <option className="bg-secondary text-white" value="age">
                        Age
                    </option>
                </select>

                <input
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="p-2 rounded-md border border-gray-300 text-sm w-full sm:w-5/10"
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
    const { first_name, last_name, sex, birthdate, time_to_live, pfpPath } = profile;
    const [isLoading, setIsLoading] = useState(true);
    const [picURL, setPicURL] = useState("");
    const daysLeftuntilDeleted = time_to_live ? differenceInDays(time_to_live.toDate(), new Date()) : "?"
    // const daysLeftuntilDeleted = "hi"
    useEffect(() => {
        async function fetchPictureBlob() {
            setIsLoading(true);
            if (!pfpPath) {
                setIsLoading(false);
                return
            }

            try {
                const r = ref(store, pfpPath);
                const blob = await getBlob(r);
                setPicURL(URL.createObjectURL(blob));
            } catch (error) {
                console.error(error);

            } finally {
                setIsLoading(false);
            }
        }
        fetchPictureBlob();
    }, [pfpPath]);
    return (

        <div
            className="flex items-center justify-between bg-[#45B29D] text-white rounded-xl p-4 shadow-md transition"
        >
            <div className="flex-grow flex items-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 overflow-hidden">
                    {
                        isLoading || !picURL ?

                            <svg
                                className="w-6 h-6 text-[#45B29D]"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
                                />
                            </svg> :
                            <img src={picURL} />
                    }
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