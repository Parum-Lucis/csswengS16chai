import { useContext, useEffect } from "react";
import { useNavigate } from "react-router";
import { UserContext } from "../context/userContext";

export function EventList() {
  const navigate = useNavigate();
  const usertest = useContext(UserContext);

  useEffect(() => {
    if (usertest === null) {
      navigate("/");
    }
  }, [usertest, navigate]);

  return (
    <div className="w-full max-w-md mx-auto mt-6 p-4">
      <h1 className="text-center text-6xl font-bold text-secondary mb-4 font-sans">
        Event List
      </h1>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <select
        //   value={filter}
        //   onChange={e => setSort(e.target.value)}
          className="p-2 rounded-md border border-gray-300 text-sm"
        >
          <option value="">Filter By</option>
          <option value="">Ongoing</option>
          <option value="">Archived</option>
        </select>

        <select
        //   value={sort}
        //   onChange={e => setSort(e.target.value)}
          className="p-2 rounded-md border border-gray-300 text-sm"
        >
          <option value="">Sort by</option>
          <option value="">A - Z</option>
          <option value="">Latest Event</option>
          <option value="">Oldest Event</option>
        </select>

        <input
          type="text"
          placeholder="Search"
        //   value={search}
        //   onChange={e => setSearch(e.target.value)}
          className="p-2 rounded-md border border-gray-300 text-sm"
        />
    </div>

      <div className="bg-secondary p-4 rounded-xl shadow-lg">
        <div className="flex flex-col gap-4">
          <div
            className="flex items-center bg-[#45B29D] text-white rounded-xl p-4 shadow-md cursor-pointer hover:opacity-90 transition"
            onClick={() => {
              console.log("Event clicked: Feeding Program");
              // navigate("/event/1");
            }}
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
              <svg
                className="w-6 h-6 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
              </svg>
            </div>
            <div onClick={() => navigate("/view-event/test-1" /* To Do for backend: fill in and import EventCard span here */)}> 
              <div className="text-base font-bold">Feeding Program</div>
              <div className="text-sm">Date: August 10, 2025</div>
              <div className="text-sm">Place: Brgy. San Isidro, Makati City</div>
            </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default EventList;