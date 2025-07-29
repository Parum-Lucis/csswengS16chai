import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import type { Event } from "@models/eventType";
import { collection, getDocs, QueryDocumentSnapshot, type FirestoreDataConverter, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { toast } from "react-toastify";
import { compareAsc, formatDate } from "date-fns";
import { EllipsisVertical } from 'lucide-react';
import { callExportEvents } from "../firebase/cloudFunctions";

const converter: FirestoreDataConverter<Event> = {
  toFirestore: (event) => event,
  fromFirestore: (snapshot: QueryDocumentSnapshot<Event>, options) => {
    const data = snapshot.data(options);
    return {
      ...data,
      docID: snapshot.id
    }

  }
}

export function EventList() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [exporting, setExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Dropdown export
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const dropdown = document.getElementById("dropdownSearch");
      if (dropdown && !dropdown.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setIsLoading(true)
        const q = query(collection(db, "events"), where("time_to_live", "==", null));
        const snapshot = await getDocs(q.withConverter((converter)));
        setEvents(snapshot.docs.map(e => e.data()).sort((a, b) => compareAsc(a.start_date.toDate(), b.start_date.toDate())))
      } catch (error) {
        toast.error("Couldn't retrieve events")
        console.log(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, []);

  const [filter, setFilter] = useState<string>("");
  const [sort, setSort] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const modifiedList = useMemo<Event[]>(() => {
    // Filter profiles based on filter val
    const now = new Date();
    let filteredprofiles = [...events];
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
  }, [events, filter, sort, search])

  const handleExport = async () => {
    console.log("Export clicked!")
    setExporting(true);
    try {
      // create date and time string for filename
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const dateStr = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${now.getFullYear()}`;
      const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      const filename = `events-${dateStr}-${timeStr}.csv`;

      // call cloud function, return csv string
      const result = await callExportEvents();
      const csvString = result.data as string;

      // create csv file to send
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Exported events to csv file.");
    } catch (error) {
      toast.error("Failed to export events.");
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-6 p-4">
      <h1 className="text-center text-5xl font-bold text-primary mb-4 font-sans">Event List</h1>

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

        <div className="flex items-center gap-2 w-full sm:w-5/10">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="p-2 rounded-md border border-gray-300 text-sm w-full sm:w-9/10"
          />

          <div className="relative w-1/10">
            <button
              type="submit"
              className="font-sans font-semibold text-white bg-primary rounded-md h-[37px] w-full shadow-lg cursor-pointer hover:opacity-90 transition flex items-center justify-center"
              onClick={() => {
                setShowDropdown(!showDropdown);
              }}
              data-dropdown-toggle="dropdownSearch"
            >
              <EllipsisVertical className="w-5 h-5" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-0 w-48 bg-white rounded-md shadow-lg z-10" id="dropdownSearch">
                <ul className="py-1">
                  <li
                    className={`font-extraboldsans px-4 py-2 text-gray-700 ${exporting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    onClick={exporting ? undefined : handleExport}
                  >
                    {exporting ? "Exporting..." : "Export"}
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center text-white mt-8">
          <h2 className="text-lg">Fetching...</h2>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {modifiedList.length > 0 ? (
            modifiedList.map((event, i) => (
              <EventCard event={event} key={`${i}${event.docID}`} />
            ))
          ) : (
            <div className="text-center text-white mt-8">
              <h2 className="text-lg">No events to show.</h2>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard(
  { event }: { event: Event }
) {

  const { docID, name, start_date, location, description } = event;

  return (
    <Link
      to={`/event/${docID}`}
      className="flex items-center bg-primary text-white rounded-xl p-4 shadow-md cursor-pointer hover:opacity-90 transition"
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
        <div className="text-base font-bold">{name}</div>
        <div className="text-sm truncate">
          <span className="">{description}</span>
        </div>
        <div className="h-1" />
        <div className="text-sm">Date: {formatDate(start_date.toDate(), "MMMM d, yyyy")}</div>
        <div className="text-sm">Location: {location}</div>
      </div>
    </Link>
  )
}
export default EventList;