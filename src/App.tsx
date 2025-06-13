import Login from "./routes/Login";
import { Routes, Route } from "react-router";
import "./css/styles.css";
import ProfileCreation from "./routes/ProfileCreation";
import ProfileDetails from "./routes/ProfileDetails";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/ProfileDetails" element={<ProfileDetails />} />
      <Route path="/ProfileCreation" element={<ProfileCreation />} />
    </Routes>
  );
}

export default App;
