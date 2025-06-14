import Login from "./routes/Login";
import { Routes, Route } from "react-router";
import "./css/styles.css";
import ProfileCreation from "./routes/ProfileCreation";
import ProfileDetails from "./routes/ProfileDetails";
import { useState } from "react";
import { auth } from "./firebase/firebaseConfig";
import { UserContext, type UserStateType } from "./assets/userContext";
import NavBar from "./components/NavBar";


function App() {
  const [user, setUser] = useState<UserStateType>(undefined);
  auth.onAuthStateChanged(currUser => {
    setUser(currUser);
  });

  return (
    <UserContext value={user}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/ProfileDetails" element={<ProfileDetails />} />
        <Route path="/ProfileCreation" element={<ProfileCreation />} />
      </Routes>
      <NavBar/>
    </UserContext>
  );
}

export default App;
