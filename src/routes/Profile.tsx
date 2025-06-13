import { useNavigate } from "react-router";
import { auth } from "../firebase/firebaseConfig";

export default function Profile() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => {
        auth.signOut();
        navigate("/");
      }}
    >
      Sign out
    </button>
  );
}
