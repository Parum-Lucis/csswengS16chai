import Login from "./routes/Login";
import { Routes, Route } from "react-router";
import "./css/styles.css";
import Profile from "./routes/Profile";
import ProfileCreation from "./components/ProfileCreation";
import ProfileDetails from "./components/ProfileDetails";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/ProfileCreation" element={<ProfileCreation />} />
      <Route path="/ProfileDetails" element={<ProfileDetails />} />
    </Routes>
  );
}

export default App;
