import Login from "./routes/Login";
import { Routes, Route } from "react-router";
import "./css/styles.css";
import ProfileCreation from "./routes/ProfileCreation";
import ProfileDetails from "./routes/ProfileDetails";
import { useState } from "react";
import { auth } from "./firebase/firebaseConfig";
import { UserContext, type UserStateType } from "./context/userContext.ts";
import NavigationBar from "./components/NavigationBar.tsx";
import Temp from "./components/Temp.tsx";
import ForgetMeNot from "./routes/ForgetMeNot.tsx";
import BeneficiaryList from "./routes/BeneficiaryList.tsx";


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
        <Route path="/view-profile" element={<ProfileDetails />} />
        <Route path="/create-profile" element={<ProfileCreation />} />
        <Route path="/view-profile-list" element={<BeneficiaryList />} />
        <Route path="/view-calendar" element={<Temp />} />
        <Route path="/view-event-list" element={<Temp />} />
      </Routes>
      <NavigationBar/>
    </UserContext>
  );
}

export default App;
