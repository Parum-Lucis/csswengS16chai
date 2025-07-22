import { startTransition, useEffect, useMemo, useOptimistic, useState } from "react";
import { collection, getDocs, query, QueryDocumentSnapshot, where } from "firebase/firestore";
import { compareDesc, differenceInDays, differenceInYears } from "date-fns";
import { db } from "../../firebase/firebaseConfig";
import { toast } from "react-toastify";
import type { Volunteer } from "@models/volunteerType";
import { DeletedProfileList } from "./DeletedProfileList";
import { callRestoreDeletedVolunteer } from "../../firebase/cloudFunctions";

const converter = {
    toFirestore: (data: Volunteer) => data,
    fromFirestore: (snap: QueryDocumentSnapshot) =>
        snap.data() as Volunteer
}


export function DeletedVolunteerList() {

    const [profiles, setProfiles] = useState<Volunteer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [oProfiles, removeOProfiles] = useOptimistic<Volunteer[], string>(
        profiles,
        (prev, removedId) => prev.filter((val) => val.docID !== removedId)
    )

    useEffect(() => {
        async function run() {
            try {
                const q = query(collection(db, "volunteers"), where("time_to_live", "!=", null)).withConverter(converter);
                const res = await getDocs(q);
                setProfiles(res.docs.map(doc => ({ ...doc.data(), docID: doc.id })));
            } catch (error) {
                toast.error("Couldn't load volunteers.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        run();
    }, [])

    function handleRestore(profile: Volunteer) {
        const { docID } = profile;
        const name = profile.first_name + " " + profile.last_name

        startTransition(async () => {
            try {
                removeOProfiles(docID);

                const ok = await callRestoreDeletedVolunteer(docID);
                if (ok) {
                    toast.success("successfully restored " + name);
                    setProfiles(b => b.filter(v => v.docID !== docID));
                } else {
                    throw "Something stopped us"
                }
            } catch (error) {
                console.log(error);
                toast.error("couldn't restored " + name);
            }
        })
    }


    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const modifiedList = useMemo<Volunteer[]>(() => {
        let temp = filter ? oProfiles.filter(profile => profile.role.toLocaleLowerCase() === filter.toLocaleLowerCase()) : oProfiles;

        // Sort profiles based on selected sort val
        if (sort === "last") {
            temp.sort((a, b) => a.last_name.localeCompare(b.last_name));
        } else if (sort === "first") {
            temp.sort((a, b) => a.last_name.localeCompare(b.first_name));
        } else if (sort === "age") {
            temp.sort((a, b) => compareDesc(a.birthdate.toDate(), b.birthdate.toDate()));
        } else if (sort === "deletion") {
            temp.sort((a, b) =>
                a.time_to_live !== null && b.time_to_live !== null ?
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
                    profile.birthdate.toDate().toDateString()
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
                    <option value="deletion">Deletion age</option>
                </select>

                <input
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="p-2 rounded-md border border-gray-300 text-sm"
                />
            </div>
            <DeletedProfileList<Volunteer>
                ProfileCard={DeletedVolunteerCard}
                handleRestore={handleRestore}
                loading={loading}
                profiles={modifiedList}
            />
        </div>
    )
}

function DeletedVolunteerCard({ profile, onRestore }:
    { profile: Volunteer, onRestore: (profile: Volunteer) => void }) {
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
                        {`${first_name.toUpperCase()} ${last_name}`}
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