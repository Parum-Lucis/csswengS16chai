import { Link } from "react-router";
import "../css/styles.css";
import ProfileCard from "../components/ProfileCard";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { compareAsc, compareDesc, differenceInYears } from "date-fns";
import { toast } from "react-toastify";
import { EllipsisVertical} from 'lucide-react';
import { callExportBeneficiaries, callExportVolunteers } from '../firebase/cloudFunctions';
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
  const [exporting, setExporting] = useState(false);

  // Profiles and test profiles flag
  const [profiles, setProfiles] = useState<Beneficiary[]>([]);

  // Dropdown export
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetching profiles 
  // RUNS TWICE while in development because of React's strict mode
  // https://www.reddit.com/r/reactjs/comments/1epir3s/why_is_my_useeffect_being_called_twice_even/
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true); // display "fetching..."
      const q = query(collection(db, "beneficiaries"), where("time_to_live", "==", null));
      try {
        const beneficiarySnap = await getDocs(q.withConverter(beneficiaryConverter));
        const profilesData: Beneficiary[] = [];
        let didFail = false;

        beneficiarySnap.docs.forEach(doc => {
          const data = doc.data();
          // Check if essential data exists before adding it to the list
          if (data.first_name && data.last_name) {
            profilesData.push(data);
          } else {
            didFail = true;
            console.error(`Error fetching beneficiary: ${doc.id}`, 'Missing name fields');
          }
        });

        setProfiles(profilesData);

        if (didFail) {
          toast.warn('One or more profiles failed to load.');
        }

      } catch (error) {
        console.error(error);
        toast.error("Failed to load beneficiaries.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();

  }, []);
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

  // Export handler for beneficiaries
  const handleExport = async () => {
    console.log("Export clicked!")
    setExporting(true);
    try {
      // create date and time string for filename
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const dateStr = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${now.getFullYear()}`;
      const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      const filename = `beneficiaries-${dateStr}-${timeStr}.csv`;

      // call cloud function, return csv string
      const result = await callExportBeneficiaries();
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

      toast.success("Exported beneficiaries to csv file.");
    } catch (error) {
      toast.error("Failed to export beneficiaries.");
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };
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
  const filteredProfiles = useMemo(() => {
    // Filter profiles based on filter val
    let temp = [...profiles];
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
  }, [filter, sort, search, profiles]);

  return (
    <div className="w-full max-w-md mx-auto mt-6 p-4">
      <h1 className="text-center text-5xl font-bold text-primary mb-4 font-sans">Beneficiary List</h1>

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

        <div className="flex items-center gap-2 w-full sm:w-5/10">
          <input
            type="text"
            placeholder="Search (Name or ID)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="p-2 rounded-md border border-gray-300 text-sm w-full sm:w-9/10"
          />

          <div className="relative w-2/10">
            <button
              type="submit"
              className="font-sans font-semibold text-white bg-primary rounded-md h-[37px] w-full shadow-lg cursor-pointer hover:opacity-90 transition flex items-center justify-center"
              onClick={() => {setShowDropdown(!showDropdown);
              }}
              data-dropdown-toggle="dropdownSearch"
            >
              <EllipsisVertical className="w-5 h-5"/>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-0 w-48 bg-white rounded-md shadow-lg z-10" id="dropdownSearch">
                <ul className="py-1">
                  <li className={`font-extraboldsans px-4 py-2 text-gray-700 ${exporting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
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
          filteredProfiles.map((profile) => (
            <ProfileCard profile={profile} sort={sort} />
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
  const [exporting, setExporting] = useState(false);

  // Profiles and test profiles flag
  const [profiles, setProfiles] = useState<Volunteer[]>([]);

  // Dropdown export
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetching profiles 
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true); // display "fetching..."
      const q = query(collection(db, "volunteers"), where("time_to_live", "==", null));

      try {
        const volunteerSnap = await getDocs(q.withConverter(volunteerConverter));
        const profilesData: Volunteer[] = [];
        let didFail = false;

        volunteerSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.first_name && data.last_name) {
            profilesData.push(data);
            // {...data, accredited_id: null}
          } else {
            didFail = true;
            console.error(`Error fetching volunteer: ${doc.id}`, 'Missing name fields');
          }
        });

        setProfiles(profilesData);

        if (didFail) {
          toast.warn('One or more profiles failed to load.');
        }

      } catch (error) {
        console.error(error);
        toast.error("failed to load volunteers");
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();

  }, []);

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

  // Filter profiles based on filter val
  let filteredprofiles = filter ? profiles.filter(profile => profile.role.toLocaleLowerCase() === filter.toLocaleLowerCase()) : profiles;

  // Sort profiles based on selected sort val
  if (sort === "last") {
    filteredprofiles = [...filteredprofiles].sort((a, b) => a.last_name.localeCompare(b.last_name));
  } else if (sort === "first") {
    filteredprofiles = [...filteredprofiles].sort((a, b) => a.first_name.localeCompare(b.first_name));
  } else if (sort === "age") {
    filteredprofiles = [...filteredprofiles].sort((a, b) => compareDesc(a.birthdate.toDate(), b.birthdate.toDate()));
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

  // Export handler for volunteers
  const handleExport = async () => {
    console.log("Export clicked!")
    setExporting(true);
    try {
      // create date and time string for filename
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const dateStr = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${now.getFullYear()}`;
      const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      const filename = `volunteers-${dateStr}-${timeStr}.csv`;

      // call cloud function, return csv string
      const result = await callExportVolunteers();
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

      toast.success("Exported volunteers to csv file.");
    } catch (error) {
      toast.error("Failed to export volunteers.");
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-6 p-4">
      <h1 className="text-center text-5xl font-bold text-primary mb-4 font-sans">Volunteer List</h1>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="appearance-none p-2 rounded-md border border-gray-300 text-sm w-full sm:w-3/10"
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
          className="appearance-none p-2 rounded-md border border-gray-300 text-sm w-full sm:w-3/10"
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

        <div className="flex items-center gap-2 w-full sm:w-5/10">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="p-2 rounded-md border border-gray-300 text-sm w-full sm:w-9/10"
          />

          <div className="relative w-2/10">
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
                  <li className={`font-extraboldsans px-4 py-2 text-gray-700 ${exporting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
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
      <div className="flex flex-col gap-4">
        {loading ? (
          // display loading while fetching from database.
          <div className="text-center text-white py-8">Fetching...</div>
        ) : filteredprofiles.length === 0 ? (
          <div className="text-center text-white py-8">No profiles to show.</div>
        ) : (
          // non-empty profiles
          filteredprofiles.map((profile) => (
            <ProfileCard profile={profile} sort={sort} key={profile.docID} />
          ))
        )}
      </div>
    </div>
  );
}

