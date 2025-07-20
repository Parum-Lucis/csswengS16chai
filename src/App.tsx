import Login from "./routes/Login";
import { Routes, Route } from "react-router";
import "./css/styles.css";
import { VolunteerProfileCreation, BeneficiaryProfileCreation } from "./routes/ProfileCreation";
import { YourProfile } from "./routes/YourProfile";
import { BeneficiaryProfile } from "./routes/BeneficiaryProfile";
import { VolunteerProfile } from "./routes/VolunteerProfile";
import { Calendar } from "./routes/Calendar";
import { useState } from "react";
import { auth } from "./firebase/firebaseConfig";
import { UserContext, type UserStateType } from "./context/userContext";
import NavigationBar from "./components/NavigationBar";
import Temp from "./components/Temp";
import ForgetMeNot from "./routes/ForgetMeNot";
import Admin from "./routes/Admin"
import { VolunteerList, BeneficiaryList } from "./routes/ProfileList";
import EventList from "./routes/EventList";
import { EventPage } from "./routes/EventPage";
import EventCreation from "./routes/EventCreation";
import ImportCSV from "./routes/ImportCSV";

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
        <Route path="/view-beneficiary/:docId" element={<BeneficiaryProfile />} />
        <Route path="/view-volunteer/:docId" element={<VolunteerProfile />} />
        <Route path="/create-volunteer-profile" element={<VolunteerProfileCreation />} />
        <Route path="/create-beneficiary-profile" element={<BeneficiaryProfileCreation />} />
        <Route path="/create-event" element={<EventCreation />} />
        <Route path="/view-profile-list" element={<Temp />} />
        <Route path="/view-beneficiary-list" element={<BeneficiaryList />} /> 
        <Route path="/view-volunteer-list" element={<VolunteerList />} />
        <Route path="/view-calendar" element={<Calendar />} />
        <Route path="/view-event-list" element={<EventList />} />
        <Route path="/view-event/:docId" element={<EventPage />} />
        <Route path="/import-csv" element={<ImportCSV />} />
      </Routes>
      <NavigationBar />
    </UserContext>
  );
}

export default App;
