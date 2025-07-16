import Login from "./routes/Login";
import { Routes, Route } from "react-router";
import "./css/styles.css";
import { VolunteerProfileCreation, BeneficiaryProfileCreation } from "./routes/ProfileCreation";
import { YourProfile } from "./routes/YourProfile.tsx";
import { BeneficiaryProfile } from "./routes/BeneficiaryProfile.tsx";
import { VolunteerProfile } from "./routes/VolunteerProfile.tsx";
import { useEffect, useState } from "react";
import { auth } from "./firebase/firebaseConfig";
import { UserContext, type UserStateType } from "./util/userContext.ts";
import NavigationBar from "./components/NavigationBar.tsx";
import Temp from "./components/Temp.tsx";
import ForgetMeNot from "./routes/ForgetMeNot.tsx";
import Admin from "./routes/Admin.tsx"
import { VolunteerList, BeneficiaryList } from "./routes/ProfileList.tsx";
import { AdminLayout } from "./layouts/AdminLayout.tsx";
import { DeletedBeneficiaryList } from "./routes/admin/DeletedBeneficiaryList.tsx";


function App() {
  const [user, setUser] = useState<UserStateType>(undefined);

  useEffect(() => {

    const listener = auth.onAuthStateChanged(async (currUser) => {
      if (!currUser) {
        setUser(currUser);
        return;
      } else {
        setUser({ ...currUser, is_admin: false });
      }

      const token = await currUser?.getIdTokenResult();
      if (!token)
        return;
      else
        setUser({ ...currUser, is_admin: token.claims.is_admin as boolean })


    });

    return listener;
  }, [])

  return (
    <UserContext value={user}>
      <Routes>
        <Route path="admin/" element={<AdminLayout />} >
          <Route path="deleted-beneficiaries" element={<DeletedBeneficiaryList />} />
        </Route>
        <Route path="/" element={<Login />} />
        <Route path="/forget-password" element={<ForgetMeNot />} />
        <Route path="/view-admin" element={<Admin />} />
        <Route path="/view-profile" element={<YourProfile />} />
        <Route path="/view-beneficiary/:docId" element={<BeneficiaryProfile />} />
        <Route path="/view-volunteer/:docId" element={<VolunteerProfile />} />
        <Route path="/create-volunteer-profile" element={<VolunteerProfileCreation />} />
        <Route path="/create-beneficiary-profile" element={<BeneficiaryProfileCreation />} />
        <Route path="/view-profile-list" element={<Temp />} />
        <Route path="/view-beneficiary-list" element={<BeneficiaryList />} />
        <Route path="/view-volunteer-list" element={<VolunteerList />} />
        <Route path="/view-calendar" element={<Temp />} />
        <Route path="/view-event-list" element={<Temp />} />
      </Routes>
      <NavigationBar />
    </UserContext>
  );
}

export default App;
