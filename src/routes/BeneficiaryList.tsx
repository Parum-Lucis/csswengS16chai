import { useNavigate } from "react-router";
import "../css/styles.css";
import ProfileCard from "../components/ProfileCard.tsx";
import { UserContext } from "../context/userContext.ts";
import { useContext, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { differenceInYears } from "date-fns";

function BeneficiaryList() {
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

  // Test data and profile test state
  const [profileTest, setProfileTest] = useState<any[]>([]);
  const useTestProfiles = false; // false if db query


  useEffect(() => {
    if (useTestProfiles) {
      setProfileTest([
        { first_name: "Juan", last_name: "Dela Cruz", age: 12, sex: "M", type: "student" },
        { first_name: "Maria", last_name: "Clara", age: 10, sex: "F", type: "student" },
        { first_name: "Jose", last_name: "Rizal", age: 13, sex: "M", type: "student" },
        { first_name: "Melchora", last_name: "Aquino", age: 9, sex: "F", type: "student" },
        { first_name: "Gabriela", last_name: "Silang", age: 7, sex: "F", type: "waitlist" },
        { first_name: "Maria", last_name: "Elena", age: 11, sex: "F", type: "waitlist" },
        { first_name: "Apolinario", last_name: "Mabini", age: 8, sex: "M", type: "waitlist" },
        { first_name: "Juan", last_name: "Tamad", age: 20, sex: "M", type: "volunteer" },
        { first_name: "Jane", last_name: "Doe", age: 21, sex: "M", type: "volunteer" },
        { first_name: "Wanda", last_name: "Hoi", age: 22, sex: "F", type: "volunteer" },
      ]);
      setLoading(false);
    } else {
      const fetchProfiles = async () => {
        setLoading(true); // display "fetching..."
        const beneficiarySnap = await getDocs(collection(db, "beneficiaries"));
        const volunteerSnap = await getDocs(collection(db, "volunteers"));
        const profiles: any[] = [];

        // TODO: update fields here, initially worked on an older branch

        beneficiarySnap.docs.forEach(doc => {
          const data = doc.data();
            const birthDate = data.birthdate?.toDate ? data.birthdate.toDate() : null;
            const age = birthDate ? differenceInYears(new Date(), birthDate) : 0;
            const type = data.accredited_id == null ? "waitlist" : "student";

            profiles.push({
              id: data.id,
              ...data,
              age: age,
              type: type
            });
        });

        volunteerSnap.docs.forEach(doc => {
          const data = doc.data();
          const birthDate = data.birthdate?.toDate ? data.birthDate.toDate() : null;
          const age = birthDate ? differenceInYears(new Date(), birthDate) : 0;
          const sex = data.sex ? data.sex : "N/A"

          profiles.push({
            id: data.id,
            ...data,
            age: age,
            sex: sex,
            type: "volunteer"
          });
        });
        console.log(profiles)
        setProfileTest(profiles);
        setLoading(false);
      };
      fetchProfiles();
    }
  }, []);




  // Filter profiles based on filter val
  let filteredprofiles = filter ? profileTest.filter(profile => profile.type === filter) : profileTest;

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
    filteredprofiles = filteredprofiles.filter(
      profile =>
        profile.first_name.toLowerCase().includes(searchLower) ||
        profile.last_name.toLowerCase().includes(searchLower) ||
        profile.age.toString().includes(searchLower)
    );
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
          <option value="student">Student</option>
          <option value="waitlist">Waitlist</option>
          <option value="volunteer">Volunteer</option>
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
                  console.log(`Profile clicked: ${profile.first_name} ${profile.last_name}`);
                  // TODO: navigate to actual profile
                  navigate(`/view-profile`);
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

export default BeneficiaryList;
