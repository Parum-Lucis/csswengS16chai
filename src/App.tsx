import Login from "./routes/Login";
import { Routes, Route } from "react-router";
import "./css/styles.css";
import { VolunteerProfileCreation, BeneficiaryProfileCreation } from "./routes/ProfileCreation";
import { YourProfile } from "./routes/YourProfile.tsx";
import { BeneficiaryProfile } from "./routes/BeneficiaryProfile.tsx";
import { VolunteerProfile } from "./routes/VolunteerProfile.tsx";
import { useState } from "react";
import { auth } from "./firebase/firebaseConfig";
import { UserContext, type UserStateType } from "./context/userContext.ts";
import NavigationBar from "./components/NavigationBar.tsx";
import Temp from "./components/Temp.tsx";
import ForgetMeNot from "./routes/ForgetMeNot.tsx";
import Admin from "./routes/Admin.tsx"


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
        <Route path="/view-admin" element={<Admin />} />
        <Route path="/view-profile" element={<YourProfile />} />
        <Route path="/view-beneficiary" element={<BeneficiaryProfile />} />
        <Route path="/view-volunteer" element={<VolunteerProfile />} />
        <Route path="/create-volunteer-profile" element={<VolunteerProfileCreation />} />
        <Route path="/create-beneficiary-profile" element={<BeneficiaryProfileCreation />} />
        <Route path="/view-profile-list" element={<Temp />} />
        <Route path="/view-calendar" element={<Temp />} />
        <Route path="/view-event-list" element={<Temp />} />
      </Routes>
      <NavigationBar/>
    </UserContext>
  );
}

export default App;
