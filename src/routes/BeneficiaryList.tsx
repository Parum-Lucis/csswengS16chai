import { useNavigate } from "react-router";
import "../css/styles.css";
import { UserContext } from "../context/userContext.ts";
import { useContext, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig"; 


function BeneficiaryList() {
  const navigate = useNavigate();
  const usertest = useContext(UserContext);
  
  useEffect(() => {
    if (usertest === null) {
      navigate("/");
    }
  }, [usertest, navigate]);
  
  const [filter, setFilter] = useState<string>("");
  const [sort, setSort] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  
  // Test data
  const [profileTest, setProfileTest] = useState<any[]>([]);
  const useTestProfiles = true; // false if db query - delete later
  
  useEffect(() => {
    if (useTestProfiles) {
      setProfileTest([
        { firstName: "Juan", lastName: "Dela Cruz", age: 12, sex: "M", type: "student" },
        { firstName: "Maria", lastName: "Clara", age: 10, sex: "F", type: "student" },
        { firstName: "Jose", lastName: "Rizal", age: 13, sex: "M", type: "student" },
        { firstName: "Melchora", lastName: "Aquino", age: 9, sex: "F", type: "student" },
        { firstName: "Gabriela", lastName: "Silang", age: 7, sex: "F", type: "waitlist" },
        { firstName: "Maria", lastName: "Elena", age: 11, sex: "F", type: "waitlist" },
        { firstName: "Apolinario", lastName: "Mabini", age: 8, sex: "M", type: "waitlist" },
        { firstName: "Juan", lastName: "Tamad", age: 20, sex: "M", type: "volunteer" },
        { firstName: "Jane", lastName: "Doe", age: 21, sex: "M", type: "volunteer" },
        { firstName: "Wanda", lastName: "Hoi", age: 22, sex: "F", type: "volunteer" },
      ]);
    } else {
      const fetchBeneficiaries = async () => {
        const querySnapshot = await getDocs(collection(db, "beneficiaries"));
        const profiles: any[] = [];
        querySnapshot.forEach((doc) => {
          profiles.push(doc.data());
        });
        setProfileTest(profiles);
      };
      fetchBeneficiaries();
    }
  }, []);

  // Filter profiles based on filter val
  let filteredprofiles = filter ? profileTest.filter(profile => profile.type === filter) : profileTest;

  // Sort profiles based on selected sort val
  if (sort === "lastName") {
    filteredprofiles = [...filteredprofiles].sort((a, b) => a.lastName.localeCompare(b.lastName));
  } else if (sort === "firstName") {
    filteredprofiles = [...filteredprofiles].sort((a, b) => a.firstName.localeCompare(b.firstName));
  } else if (sort === "age") {
    filteredprofiles = [...filteredprofiles].sort((a, b) => a.age - b.age);
  }
  
  // Search filter (partial or exact matches on name and age)
  if (search.trim() !== "") {
    const searchLower = search.trim().toLowerCase();
    filteredprofiles = filteredprofiles.filter(
      profile =>
      profile.firstName.toLowerCase().includes(searchLower) ||
      profile.lastName.toLowerCase().includes(searchLower) ||
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
          <option value="lastName">Last Name</option>
          <option value="firstName">First Name</option>
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
        {filteredprofiles.map((profile, index) => (
          <div
            key={index}
            onClick={() => {
              console.log(`Profile clicked: ${profile.firstName} ${profile.lastName}`);
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

            <div className="flex flex-col text-sm">
              <span className="font-bold text-base font-[Montserrat]">
                {profile.lastName.toUpperCase()}, {profile.firstName}
              </span>
              <span>Age: {profile.age}</span>
              <span>Sex: {profile.sex}</span>
            </div>
        </div>
        ))}
      </div>
    </div>
  </div>
);
}

export default BeneficiaryList;
