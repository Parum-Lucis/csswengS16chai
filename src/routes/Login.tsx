import CHAI from "../assets/CHAI.jpg";
import "../css/styles.css";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { auth } from "../firebase/firebaseConfig";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useContext, useEffect } from "react";
import { UserContext } from "../util/userContext";

function Login() {
  const navigate = useNavigate();
  const user = useContext(UserContext);

  // if there is already a user logged in, just skip the login page.
  useEffect(() => {
    if (user) {
      navigate("/me");
    }
  }, [user, navigate]);

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get("username") as string; // coerce them to strings cause form doesn't know what datatype these guys are.
    const password = formData.get("pw") as string;
    const rememberMe = !!formData.get("cbox"); // !! to coerce to true/false, trust me bro

    if (!username || !password) {
      toast.error("Please input your username and password.");
      return;
    }

    try {
      const user = await signInWithEmailAndPassword(auth, username, password);
      await auth.setPersistence(
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
      console.log(user);
      navigate("/me");
    } catch (error) {
      // see https://firebase.google.com/docs/auth/admin/errors for other auth/error-codes
      if (error instanceof FirebaseError) {
        if (error.code === "auth/invalid-credential") {
          // Firebase has email enumeration protection. So we can't know if their email is valid or not.
          // This is the best we can do.
          toast.error("Something is wrong with your email or password.");
        } else if (error.code === "auth/wrong-password") {
          // will only happen in emulator
          toast.error("wrong password bro.");
        } else if (error.code === "auth/user-disabled") {
          toast.error("Cannot your account is currently disabled or deleted.")
        }
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className=" w-full max-w-lg mx-auto h-[90vh] flex flex-col items-center justify-center">
      <img
        src={CHAI}
        alt="Logo"
        className="w-24 h-24 sm:w-32 sm:h-32 p-1 mt-10 mb-6 rounded-full border-2 border-solid border-[#E3E3E3]"
      />
      <h2 className="font-sans text-center font-bold text-[1.2rem] sm:text-[1.3rem]">
        Management and Events Tracker
      </h2>
      <div className="w-full max-w-md flex justify-center items-center mb-6 mt-4">
        <form className="w-full flex flex-col gap-2 p-4 sm:p-6" onSubmit={login}>
          <label htmlFor="username" className="font-sans font-semibold">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            className="border-solid border-3 rounded-[5px] p-1.5"
          />
          <label
            htmlFor="password"
            className="font-sans font-semibold mt-5"
          >
            Password
          </label>
          <input
            id="pw"
            name="pw"
            type="password"
            className=" border-solid border-3 rounded-[5px] p-1.5"
          />
          <div className="flex justify-between items-center mt-2">
            <label className="font-sans text-sm">
              <input
                id="cbox"
                name="cbox"
                type="checkbox"
                className="cursor-pointer mr-2 h-3 w-3"
              />
              Remember Me
            </label>
            <a
              onClick={() => { navigate("/forget-password") }}
              className="font-sans text-sm text-primary hover:underline cursor-pointer"
            >
              Forgot Password?
            </a>
          </div>
          <button
            type="submit"
            className="bg-primary text-white mt-10 p-1.5 rounded-[5px] w-full m-auto font-semibold cursor-pointer
            hover:opacity-50 focus:opacity-50"
          >
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
