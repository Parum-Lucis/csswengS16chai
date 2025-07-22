import Login from "./routes/Login";
import { Routes, Route } from "react-router";
import "./css/styles.css";
import { VolunteerProfileCreation, BeneficiaryProfileCreation } from "./routes/ProfileCreation";
import { YourProfile } from "./routes/YourProfile";
import { BeneficiaryProfile } from "./routes/BeneficiaryProfile";
import { VolunteerProfile } from "./routes/VolunteerProfile";
import { Calendar } from "./routes/Calendar";
import { useEffect, useState } from "react";
import { auth } from "./firebase/firebaseConfig";
import { UserContext, type UserStateType } from "./util/userContext";
import NavigationBar from "./components/NavigationBar";
import Temp from "./components/Temp";
import ForgetMeNot from "./routes/ForgetMeNot";
import Admin from "./routes/Admin"
import { VolunteerList, BeneficiaryList } from "./routes/ProfileList";
import EventList from "./routes/EventList";
import { EventPage } from "./routes/EventPage";
import EventCreation from "./routes/EventCreation"; import { AdminLayout } from "./layouts/AdminLayout.tsx";
import { DeletedBeneficiaryList } from "./routes/admin/DeletedBeneficiaryList.tsx";
import { DeletedVolunteerList } from "./routes/admin/DeletedVolunteerList.tsx";


function App() {
  const [user, setUser] = useState<UserStateType>(undefined);

  useEffect(() => {

    const listener = auth.onAuthStateChanged(async (currUser) => {
      if (!currUser) {
        setUser(currUser);
        return;
      } else {
        const token = await currUser?.getIdTokenResult();
        if (!token)
          setUser({ ...currUser, is_admin: false })
        else
          setUser({ ...currUser, is_admin: token.claims.is_admin as boolean })
      }



    });

    return listener;
  }, [])

  return (
    <UserContext value={user}>
      <Routes>
        <Route path="admin" element={<AdminLayout />} >
          <Route index element={<Admin />} />
          <Route path="deleted-beneficiaries" element={<DeletedBeneficiaryList />} />
          <Route path="volunteer" >
            <Route index element={<VolunteerList />} />
            <Route path="deleted" element={<DeletedVolunteerList />} />
            <Route path="new" element={<VolunteerProfileCreation />} />
          </Route>
        </Route>
        <Route path="/" element={<Login />} />
        <Route path="/forget-password" element={<ForgetMeNot />} />
        {/* <Route path="/view-admin" element={<Admin />} /> */}
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
      </Routes>
      <NavigationBar />
    </UserContext>
  );
}

export default App;
