import { Link } from "react-router";
import "../css/styles.css";
import ProfileCard from "../components/ProfileCard";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { compareAsc, differenceInYears } from "date-fns";
import { toast } from "react-toastify";
import { PlusCircle } from "lucide-react";
import type { Beneficiary } from "@models/beneficiaryType";
import { beneficiaryConverter, volunteerConverter } from "../util/converters";
import type { Volunteer } from "@models/volunteerType";

export function BeneficiaryList() {
  // List control states
  const [filter, setFilter] = useState<string>("");
  const [sort, setSort] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Loading prompt state
  const [loading, setLoading] = useState(true);

  // Profiles and test profiles flag
  const [profiles, setProfiles] = useState<Beneficiary[]>([]);

  // Fetching profiles 
  // RUNS TWICE while in development because of React's strict mode
  // https://www.reddit.com/r/reactjs/comments/1epir3s/why_is_my_useeffect_being_called_twice_even/
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true); // display "fetching..."
      const q = query(collection(db, "beneficiaries"), where("time_to_live", "==", null));
      try {
        const beneficiarySnap = await getDocs(q.withConverter(beneficiaryConverter));
        setProfiles(beneficiarySnap.docs.map(beneficiary => beneficiary.data()))
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }


    };
    fetchProfiles();

  }, []);

  const filteredProfiles = useMemo(() => {
    // Filter profiles based on filter val
    let temp = [...profiles];
    if (filter === "waitlisted") {
      temp = temp.filter(profile => profile.accredited_id === null);
    } else if (filter === "student") {
      temp = temp.filter(profile => profile.accredited_id !== null);
    }

    // Sort profiles based on selected sort val
    if (sort === "last") {
      temp.sort((a, b) => a.last_name.localeCompare(b.last_name));
    } else if (sort === "first") {
      temp.sort((a, b) => a.first_name.localeCompare(b.first_name));
    } else if (sort === "age") {
      temp.sort((a, b) => compareAsc(a.birthdate.toDate(), b.birthdate.toDate()));
    }

    // Search filter (partial or exact matches on name and age)
    if (search.trim() !== "") {
      const searchLower = search.trim().toLowerCase();
      const terms = searchLower.split(/[\s,]+/).filter(Boolean);

      temp = temp.filter(profile => {
        const values = [
          profile.first_name.toLowerCase(),
          profile.last_name.toLowerCase(),
          profile.birthdate.toString(),
          differenceInYears(new Date(), profile.birthdate.toDate()).toString()
        ];
        return terms.every(term =>
          values.some(value => value.includes(term))
        );
      });
    }
    return temp;
  }, [filter, sort, search, profiles])

  return (
    <div className="w-full max-w-md mx-auto mt-6 p-4">
      <h1 className="text-center text-5xl font-bold text-primary mb-4 font-sans">Beneficiary List</h1>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="p-2 rounded-md border border-gray-300 text-sm w-full sm:w-1/4"
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
          className="p-2 rounded-md border border-gray-300 text-sm w-full sm:w-1/4"
        >
          <option className="bg-secondary text-white" value="">Sort by</option>
          <option className="bg-secondary text-white" value="last">
            Last Name
          </option>
          <option className="bg-secondary text-white" value="first">
            First Name
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
          className="p-2 rounded-md border border-gray-300 text-sm w-full sm:w-1/2"
        />
      </div>

      <div className="flex flex-col gap-4">
        <Link to="new" className="flex p-4 gap-2 bg-primary mb-4 rounded-xl">
          <PlusCircle />
          Create New Profile
        </Link>
        {loading ? (
          // display loading while fetching from database.
          <div className="text-center text-white py-8">Fetching...</div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center text-white py-8">No profiles to show.</div>
        ) : (
          // non-empty profiles
          filteredProfiles.map((profile, index) => (

            <Link
              key={`${sort}-${index}`}
              to={profile.docID}
              className="w-full flex items-center bg-primary text-white rounded-xl p-4 shadow-lg cursor-pointer hover:opacity-90 transition"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
                  />
                </svg>
              </div>
              <ProfileCard key={`${sort}-${index}`} firstName={profile.first_name} lastName={profile.last_name} age={differenceInYears(new Date(), profile.birthdate.toDate())} sex={profile.sex} sort={sort} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export function VolunteerList() {

  // List control states
  const [filter, setFilter] = useState<string>("");
  const [sort, setSort] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Loading prompt state
  const [loading, setLoading] = useState(true);

  // Profiles and test profiles flag
  const [profiles, setProfiles] = useState<Volunteer[]>([]);

  // Fetching profiles 
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true); // display "fetching..."
      const q = query(collection(db, "volunteers"), where("time_to_live", "==", null));

      try {
        const volunteerSnap = await getDocs(q.withConverter(volunteerConverter));
        setProfiles(volunteerSnap.docs.map(profile => profile.data()))
      } catch (error) {
        console.error(error);
        toast.error("failed to load volunteers");
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();

  }, []);


  // Filter profiles based on filter val
  let filteredprofiles = filter ? profiles.filter(profile => profile.role.toLocaleLowerCase() === filter.toLocaleLowerCase()) : profiles;

  // Sort profiles based on selected sort val
  if (sort === "last") {
    filteredprofiles = [...filteredprofiles].sort((a, b) => a.last_name.localeCompare(b.last_name));
  } else if (sort === "first") {
    filteredprofiles = [...filteredprofiles].sort((a, b) => a.first_name.localeCompare(b.first_name));
  } else if (sort === "age") {
    filteredprofiles = [...filteredprofiles].sort((a, b) => compareAsc(a.birthdate.toDate(), b.birthdate.toDate()));
  }

  // Search filter (partial or exact matches on name and age)
  if (search.trim() !== "") {
    const searchLower = search.trim().toLowerCase();
    const terms = searchLower.split(/[\s,]+/).filter(Boolean);

    filteredprofiles = filteredprofiles.filter(profile => {
      const values = [
        profile.first_name.toLowerCase(),
        profile.last_name.toLowerCase(),
        profile.birthdate.toString(),
        differenceInYears(new Date(), profile.birthdate.toDate()).toString()
      ];
      return terms.every(term =>
        values.some(value => value.includes(term))
      );
    });
  }

  return (
    <div className="w-full max-w-md mx-auto mt-6 p-4">
      <h1 className="text-center text-5xl font-bold text-primary mb-4 font-sans">Volunteer List</h1>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="p-2 rounded-md border border-gray-300 text-sm w-full sm:w-1/4"
        >
          <option className="bg-secondary text-white" value="">Filter By</option>
          <option className="bg-secondary text-white" value="volunteer">
            Volunteers
          </option>
          <option className="bg-secondary text-white" value="admin">
            Admins
          </option>
        </select>

        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="p-2 rounded-md border border-gray-300 text-sm w-full sm:w-1/4"
        >
          <option className="bg-secondary text-white" value="">Sort by</option>
          <option className="bg-secondary text-white" value="last">
            Last Name
          </option>
          <option className="bg-secondary text-white" value="first">
            First Name
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
          className="p-2 rounded-md border border-gray-300 text-sm w-full sm:w-1/2"
        />
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          // display loading while fetching from database.
          <div className="text-center text-white py-8">Fetching...</div>
        ) : filteredprofiles.length === 0 ? (
          <div className="text-center text-white py-8">No profiles to show.</div>
        ) : (
          // non-empty profiles
          filteredprofiles.map((profile, index) => (

            <Link
              key={`${sort}-${index}`}
              to={profile.docID}
              className="w-full flex items-center bg-primary text-white rounded-xl p-4 shadow-lg cursor-pointer hover:opacity-90 transition"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
                  />
                </svg>
              </div>
              <ProfileCard key={`${sort}-${index}`} firstName={profile.first_name} lastName={profile.last_name} age={differenceInYears(new Date(), profile.birthdate.toDate())} sex={profile.sex} sort={sort} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

