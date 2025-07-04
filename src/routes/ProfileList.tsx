import { useNavigate } from "react-router";
import "../css/styles.css";
import ProfileCard from "../components/ProfileCard";
import { UserContext } from "../context/userContext";
import { useContext, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { differenceInYears } from "date-fns";
import { toast } from "react-toastify";

export function BeneficiaryList() {
  const navigate = useNavigate();
  const usertest = useContext(UserContext);

  useEffect(() => {
    if (usertest === null) {
      navigate("/");
    }
  }, [usertest, navigate]);

  // List control states
  const [filter, setFilter] = useState<string>("");
  const [sort, setSort] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Loading prompt state
  const [loading, setLoading] = useState(true);

  // Profiles and test profiles flag
  const [profiles, setProfiles] = useState<any[]>([]);
  const useTestProfiles = false; // false if db query

  // Fetching profiles 
  // RUNS TWICE while in development because of React's strict mode
  // https://www.reddit.com/r/reactjs/comments/1epir3s/why_is_my_useeffect_being_called_twice_even/
  useEffect(() => {
    if (useTestProfiles) {
      setProfiles([
        { first_name: "Juan", last_name: "Dela Cruz", age: 12, sex: "M", type: "student" },
        { first_name: "Maria", last_name: "Clara", age: 10, sex: "F", type: "student" },
        { first_name: "Jose", last_name: "Rizal", age: 13, sex: "M", type: "student" },
        { first_name: "Melchora", last_name: "Aquino", age: 9, sex: "F", type: "student" },
        { first_name: "Gabriela", last_name: "Silang", age: 7, sex: "F", type: "waitlist" },
        { first_name: "Maria", last_name: "Elena", age: 11, sex: "F", type: "waitlist" },
        { first_name: "Apolinario", last_name: "Mabini", age: 8, sex: "M", type: "waitlist" },
      ]);
      setLoading(false);
    } else {
      const fetchProfiles = async () => {
        setLoading(true); // display "fetching..."
        const beneficiarySnap = await getDocs(collection(db, "beneficiaries"));
        const profiles: any[] = [];
        let flag: boolean = false;

        // TODO: use db models when pulled in main
        // validate doc fields (allow N/A for now)
        beneficiarySnap.docs.forEach(doc => {
          try {
            const data = doc.data();
            const birthDate = data.birthdate?.toDate ? data.birthdate.toDate() : null;
            const age = birthDate ? differenceInYears(new Date(), birthDate) : 0;
            const sex = data.sex === "M" || data.sex === "F" ? data.sex : "N/A";
            const type = data.accredited_id == null ? "waitlist" : "student";

            // Skip if name missing
            if (!data.first_name || !data.last_name) {
              flag = true;
              console.error("Error fetching beneficiary: " + doc.id, "Missing name fields");
              return;
            }

            profiles.push({
              docId: doc.id,
              first_name: data.first_name,
              last_name: data.last_name,
              sex: sex,
              age,
              type,
            });
          } catch (error) {
            flag = true;
            console.error("Error fetching beneficiary: " + doc.id, error);
            return;
          }
        });

        setProfiles(profiles);
        setLoading(false);

        // warn that one or more profiles were skipped
        if (flag) {
          toast.warn("One or more profiles failed to load.");
        }
      };
      fetchProfiles();
    }
  }, []);


  // Filter profiles based on filter val
  let filteredprofiles = filter ? profiles.filter(profile => profile.type === filter) : profiles;

  // Sort profiles based on selected sort val
  if (sort === "last") {
    filteredprofiles = [...filteredprofiles].sort((a, b) => a.last_name.localeCompare(b.last_name));
  } else if (sort === "first") {
    filteredprofiles = [...filteredprofiles].sort((a, b) => a.first_name.localeCompare(b.first_name));
  } else if (sort === "age") {
    filteredprofiles = [...filteredprofiles].sort((a, b) => a.age - b.age);
  }

  // Search filter (partial or exact matches on name and age)
  if (search.trim() !== "") {
    const searchLower = search.trim().toLowerCase();
    const terms = searchLower.split(/[\s,]+/).filter(Boolean);

    filteredprofiles = filteredprofiles.filter(profile => {
      const values = [
        profile.first_name.toLowerCase(),
        profile.last_name.toLowerCase(),
        profile.age.toString()
      ];
      return terms.every(term =>
        values.some(value => value.includes(term))
      );
    });
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
          <option value="student">Students</option>
          <option value="waitlist">Waitlisted</option>
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

      <div className="bg-[#0F4C5C] p-4 rounded-xl shadow-lg">
        <div className="flex flex-col gap-4">
          {loading ? (
            // display loading while fetching from database.
            <div className="text-center text-white py-8">Fetching...</div>
          ) : filteredprofiles.length === 0 ? (
            <div className="text-center text-white py-8">No profiles to show.</div>
          ) : (
            // non-empty profiles
            filteredprofiles.map((profile, index) => (

              <div
                key={`${sort}-${index}`}
                onClick={() => {
                  console.log(`Profile clicked: ${profile.first_name} ${profile.last_name} (${profile.docId})`);
                  navigate(`/view-beneficiary/${profile.docId}`);
                }}
                className="flex items-center bg-[#45B29D] text-white rounded-xl p-4 shadow-md cursor-pointer hover:opacity-90 transition"
              >
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
                <ProfileCard key={`${sort}-${index}`} firstName={profile.first_name} lastName={profile.last_name} age={profile.age} sex={profile.sex} sort={sort} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function VolunteerList() {
  const navigate = useNavigate();
  const usertest = useContext(UserContext);

  useEffect(() => {
    if (usertest === null) {
      navigate("/");
    }
  }, [usertest, navigate]);

  // List control states
  const [filter, setFilter] = useState<string>("");
  const [sort, setSort] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Loading prompt state
  const [loading, setLoading] = useState(true);

  // Profiles and test profiles flag
  const [profiles, setProfiles] = useState<any[]>([]);
  const useTestProfiles = false; // false if db query

  // Fetching profiles 
  useEffect(() => {
    if (useTestProfiles) {
      setProfiles([
        { first_name: "Juan", last_name: "Dela Cruz", age: 12, sex: "M", is_admin: true },
        { first_name: "Maria", last_name: "Clara", age: 10, sex: "F", is_admin: true },
        { first_name: "Jose", last_name: "Rizal", age: 13, sex: "M", is_admin: true },
        { first_name: "Melchora", last_name: "Aquino", age: 9, sex: "F", is_admin: true },
        { first_name: "Gabriela", last_name: "Silang", age: 7, sex: "F", is_admin: false },
        { first_name: "Maria", last_name: "Elena", age: 11, sex: "F", is_admin: false },
        { first_name: "Apolinario", last_name: "Mabini", age: 8, sex: "M", is_admin: false },
      ]);
      setLoading(false);
    } else {
      const fetchProfiles = async () => {
        setLoading(true); // display "fetching..."
        const volunteerSnap = await getDocs(collection(db, "volunteers"));
        const profiles: any[] = [];
        let flag: boolean = false;

        // TODO: use db models when pulled in main
        // validate doc fields (allow N/A for now)
        volunteerSnap.docs.forEach(doc => {
          try {
            const data = doc.data();
            const birthDate = data.birthdate?.toDate ? data.birthdate.toDate() : null;
            const age = birthDate ? differenceInYears(new Date(), birthDate) : "N/A";
            const sex = data.sex === "M" || data.sex === "F" ? data.sex : "N/A";
            const type = data.is_admin ? "admin" : "volunteer";
            
            // Skip if name missing
            if (!data.first_name || !data.last_name) {
              flag = true;
              console.error("Error fetching beneficiary: " + doc.id, "Missing name fields");
              return;
            }

            // TODO: handle routing to current user's profile differently

            profiles.push({
              docId: doc.id,
              first_name: data.first_name,
              last_name: data.last_name,
              sex: sex,
              age: age,
              type,
            });
          } catch (error) {
            flag = true;
            console.error("Error fetching volunteer: " + doc.id, error);
            return;
          }
        });

        setProfiles(profiles);
        setLoading(false);

        // warn that one or more profiles were skipped
        if (flag) {
          toast.warn("One or more profiles failed to load.");
        }
      };
      fetchProfiles();
    }
  }, []);


  // Filter profiles based on filter val
  let filteredprofiles = filter ? profiles.filter(profile => profile.type === filter) : profiles;

  // Sort profiles based on selected sort val
  if (sort === "last") {
    filteredprofiles = [...filteredprofiles].sort((a, b) => a.last_name.localeCompare(b.last_name));
  } else if (sort === "first") {
    filteredprofiles = [...filteredprofiles].sort((a, b) => a.first_name.localeCompare(b.first_name));
  } else if (sort === "age") {
    filteredprofiles = [...filteredprofiles].sort((a, b) => a.age - b.age);
  }

  // Search filter (partial or exact matches on name and age)
  if (search.trim() !== "") {
    const searchLower = search.trim().toLowerCase();
    const terms = searchLower.split(/[\s,]+/).filter(Boolean);

    filteredprofiles = filteredprofiles.filter(profile => {
      const values = [
        profile.first_name.toLowerCase(),
        profile.last_name.toLowerCase(),
        profile.age.toString()
      ];
      return terms.every(term =>
        values.some(value => value.includes(term))
      );
    });
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

      <div className="bg-[#0F4C5C] p-4 rounded-xl shadow-lg">
        <div className="flex flex-col gap-4">
          {loading ? (
            // display loading while fetching from database.
            <div className="text-center text-white py-8">Fetching...</div>
          ) : filteredprofiles.length === 0 ? (
            <div className="text-center text-white py-8">No profiles to show.</div>
          ) : (
            // non-empty profiles
            filteredprofiles.map((profile, index) => (

              <div
                key={`${sort}-${index}`}
                onClick={() => {
                  navigate(`/view-volunteer/${profile.docId}`);
                }}
                className="flex items-center bg-[#45B29D] text-white rounded-xl p-4 shadow-md cursor-pointer hover:opacity-90 transition"
              >
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
                <ProfileCard key={`${sort}-${index}`} firstName={profile.first_name} lastName={profile.last_name} age={profile.age} sex={profile.sex} sort={sort} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

