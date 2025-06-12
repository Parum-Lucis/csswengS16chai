import Login from './components/Login';
import ProfileCreation from './components/ProfileCreation';
import { Routes, Route} from "react-router";
import './css/styles.css';
import ProfileDetails from './components/ProfileDetails';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login/>} />
      <Route path="/ProfileCreation" element={<ProfileCreation/>} />
      <Route path="/ProfileDetails" element={<ProfileDetails/>} />
    </Routes>
  )
}

export default App
