import Login from "./routes/Login";
import { Routes, Route } from "react-router";
import "./css/styles.css";
import Profile from "./routes/Profile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;
