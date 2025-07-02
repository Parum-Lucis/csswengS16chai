import Login from "./routes/Login";
import { Routes, Route } from "react-router";
import "./css/styles.css";
import { useState } from "react";
import { auth } from "./firebase/firebaseConfig";
import { UserContext, type UserStateType } from "./context/userContext.ts";
import NavigationBar from "./components/NavigationBar.tsx";
import Temp from "./components/Temp.tsx";
import ForgetMeNot from "./routes/ForgetMeNot.tsx";
import { VolunteerList, BeneficiaryList } from "./routes/ProfileList.tsx";


function App() {
  const [user, setUser] = useState<UserStateType>(undefined);
  auth.onAuthStateChanged(currUser => {
    setUser(currUser);
  });

  return (
    <UserContext value={user}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forget-password" element={<ForgetMeNot />} />
        <Route path="/view-profile" element={<Temp />} /> {/*YourProfile*/}
        <Route path="/view-volunteer/:docId" element={<Temp />} /> {/*VolunteerProfile*/}
        <Route path="/view-beneficiary/:docId" element={<Temp />} /> {/*BeneficiaryProfile*/}
        <Route path="/create-beneficiary-profile" element={<Temp />} /> {/*BeneficiaryProfileCreation*/}
        <Route path="/create-volunteer-profile" element={<Temp />} /> {/*VolunteerProfileCreation*/}
        <Route path="/view-beneficiary-list" element={<BeneficiaryList />} />
        <Route path="/view-volunteer-list" element={<VolunteerList />} />
        <Route path="/view-calendar" element={<Temp />} />
        <Route path="/view-event-list" element={<Temp />} />
      </Routes>
      <NavigationBar/>
    </UserContext>
  );
}

export default App;
