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
    <div>
      <h1 style={{fontWeight:"bold"}}>Profile List</h1>

      <div className="control-btns">

        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Filter By</option>
          <option value="student">Student</option>
          <option value="waitlist">Waitlist</option>
          <option value="volunteer">Volunteer</option>
        </select>

        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="">Sort by</option>
          <option value="lastName">Sort by Last Name</option>
          <option value="firstName">Sort by First Name</option>
          <option value="age">Sort by Age</option>
        </select>
        
        <input
          type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="profile-list">
        {filteredprofiles.map((profile, index) => (
            <div className="profile" key={index} style={{ border:"1px solid black", marginBottom:"10px" }} onClick={() => {
              console.log(`Profile clicked: ${profile.firstName} ${profile.lastName}`);
              navigate(`/view-profile`); // TODO navigate to specific profile
              }}>

              <span style={{ fontWeight:"bold" }}> {profile.lastName.toUpperCase()}, {profile.firstName} </span> <br/>
              <span> Age: {profile.age}</span> <br/>
              <span> Sex: {profile.sex}</span>

            </div>
        ))}
      </div>
    </div>
  );
}

export default BeneficiaryList;
