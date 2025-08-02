
import { startTransition, useEffect, useMemo, useOptimistic, useState } from "react";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { compareAsc, differenceInDays, formatDate } from "date-fns";
import { db } from "../../firebase/firebaseConfig";
import { toast } from "react-toastify";
import { eventConverter } from "../../util/converters";
import type { Event } from "@models/eventType";


export function DeletedEventList() {

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [oEvents, removeOEvents] = useOptimistic<Event[], string>(
        events,
        (prev, removedId) => prev.filter((val) => val.docID !== removedId)
    )

    useEffect(() => {
        async function run() {
            try {
                const q = query(collection(db, "events"), where("time_to_live", "!=", null)).withConverter(eventConverter);
                const res = await getDocs(q);
                setEvents(res.docs.map(doc => doc.data()));
            } catch (error) {
                toast.error("Couldn't load volunteers.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        run();
    }, [])

    function handleRestore(event: Event) {
        const { docID } = event;
        const name = event.name;

        if (docID === undefined) {
            toast.error("couldn't restore " + name);
            return;
        }

        startTransition(async () => {
            try {
                removeOEvents(docID);

                updateDoc(doc(db, "events", docID), {
                    time_to_live: null
                })
                toast.success("successfully restored " + name);
                setEvents(b => b.filter(v => v.docID !== docID));
            } catch (error) {
                console.log(error);
                toast.error("couldn't restored " + name);
            }
        })
    }


    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const modifiedList = useMemo<Event[]>(() => {
        // Filter profiles based on filter val
        const now = new Date();
        let filteredprofiles = [...oEvents];
        if (filter === "ongoing") {
            filteredprofiles = filteredprofiles.filter(e => e.start_date.toDate() < now && now < e.end_date.toDate())
        } else if (filter === "done") {
            filteredprofiles = filteredprofiles.filter(e => e.end_date.toDate() < now)
        } else if (filter === "pending") {
            filteredprofiles = filteredprofiles.filter(e => e.start_date.toDate() > now)
        }

        // Sort profiles based on selected sort val
        if (sort === "name") {
            filteredprofiles.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === "latest") {
            filteredprofiles.sort((a, b) => compareAsc(a.start_date.toDate(), b.start_date.toDate()))
        } else if (sort === "oldest") {
            filteredprofiles.sort((a, b) => compareAsc(b.start_date.toDate(), a.start_date.toDate()))
        }

        // Search filter (partial or exact matches on name and age)
        if (search.trim() !== "") {
            const searchLower = search.trim().toLowerCase();
            const terms = searchLower.split(/[\s,]+/).filter(Boolean);

            filteredprofiles = filteredprofiles.filter(event => {
                const values = [
                    event.name.toLowerCase(),
                    event.description.toLowerCase(),
                    event.location
                ];
                return terms.every(term =>
                    values.some(value => value.includes(term))
                );
            });
        }
        return filteredprofiles
    }, [oEvents, filter, sort, search])


    return (
        <div className="w-full max-w-md mx-auto mt-6 p-4">
            <h1 className="text-center text-5xl font-bold text-primary mb-4 font-[Montserrat]">Deleted List</h1>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="appearance-none p-2 rounded-md border border-gray-300 text-sm w-full sm:w-3/10"
                >
                    <option className="bg-secondary text-white" value="">Filter By</option>
                    <option className="bg-secondary text-white" value="ongoing">Ongoing</option>
                    <option className="bg-secondary text-white" value="done">Done</option>
                    <option className="bg-secondary text-white" value="pending">Pending</option>
                </select>

                <select
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    className="appearance-none p-2 rounded-md border border-gray-300 text-sm w-full sm:w-3/10"
                >
                    <option className="bg-secondary text-white" value="">Sort by</option>
                    <option className="bg-secondary text-white" value="name">A - Z</option>
                    <option className="bg-secondary text-white" value="latest">Latest Event</option>
                    <option className="bg-secondary text-white" value="oldest">Oldest Event</option>
                </select>

                <input
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="p-2 rounded-md border border-gray-300 text-sm w-full sm:w-5/10"
                />
            </div>
            <div className="bg-primary p-4 rounded-xl shadow-lg">
                <div className="flex flex-col gap-4">
                    {loading ? (
                        // display loading while fetching from database.
                        <div className="text-center text-white py-8">Fetching...</div>
                    ) : modifiedList.length === 0 ? (
                        <div className="text-center text-white py-8">No profiles to show.</div>
                    ) : (
                        // non-empty profiles
                        modifiedList.map((profile, index) => (

                            <EventCard
                                key={`${index}${profile.docID}`}
                                onRestore={handleRestore}
                                event={profile}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

function EventCard(
    { event, onRestore }: { event: Event, onRestore: (e: Event) => void }
) {

    const { name, start_date, location, description, time_to_live } = event;

    return (
        <div
            className="flex items-center bg-tertiary text-white rounded-xl p-4 shadow-md cursor-pointer hover:opacity-90 transition"
        >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 shrink-0">
                <svg
                    className="w-6 h-6 text-primary"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
                </svg>
            </div>
            <div className="grow min-w-0">
                <div className="text-base font-bold">
                    {`${name}, ${name}`.length > 10
                            ? `${name}, ${name}`.slice(0, 10) + "..."
                            : `${name}, ${name}`}
                </div>
                <div className="text-sm truncate">
                    <span className="">
                        {`${description}, ${description}`.length > 10
                            ? `${description}, ${description}`.slice(0, 10) + "..."
                            : `${description}, ${description}`}
                    </span>
                </div>
                <div className="h-1" />
                <div className="text-sm">Date: {formatDate(start_date.toDate(), "MMMM d, yyyy")}</div>
                <div className="text-sm">Location: 
                         {`${location}, ${location}`.length > 10
                            ? `${location}, ${location}`.slice(0, 10) + "..."
                            : `${location}, ${location}`}
                </div>
                <span>Days Left: <span className="text-red-500 font-bold">{time_to_live ? differenceInDays(time_to_live.toDate(), new Date()) : "?"}</span></span>
            </div>
            <button onClick={() => onRestore(event)} className="cursor-pointer h-full">
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
    )
}