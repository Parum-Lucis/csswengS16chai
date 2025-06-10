import Login from './components/Login';
import { Routes, Route} from "react-router";
import './css/styles.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login/>} />
    </Routes>
  )
}

export default App
