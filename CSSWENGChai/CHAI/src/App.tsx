import Login from './components/Login';
import ProfileCreation from './components/ProfileCreation';
import { Routes, Route} from "react-router";
import './css/styles.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login/>} />
      <Route path="/ProfileCreation" element={<ProfileCreation/>} />
    </Routes>
  )
}

export default App
