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

function Login() {
  const navigate = useNavigate();

  // if there is already a user logged in, just skip the login page.
  auth.onAuthStateChanged((user) => {
    if (user) {
      navigate("/profile");
    }
  });

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get("username") as string; // coerce them to strings cause form doesn't know what datatype these guys are.
    const password = formData.get("pw") as string;
    const rememberMe = !!formData.get("cbox"); // !! tocoerce to true/false, trust me bro
    console.log(rememberMe);

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
      navigate("/profile");
    } catch (error) {
      // see https://firebase.google.com/docs/auth/admin/errors for other auth/error-codes
      if (error instanceof FirebaseError) {
        if (error.code === "auth/invalid-credential") {
          // Firebase has email enumeration protection. So we can't know if their email is valid or not.
          // This is the best we can do.
          toast.error("Something is wrong with your email or password.");
        }
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <>
      <img
        src={CHAI}
        alt="Logo"
        className="w-45 h-45 p-1 mt-10 mb-10 m-auto rounded-full border-3 border-solid border-[#E3E3E3]"
      />
      <h2 className=" font-[Montserrat] font-bold text-2xl flex justify-center">
        Management and Events Tracker
      </h2>
      <div className="m-auto w-[60vh] p-10">
        <form className="flex flex-col" onSubmit={login}>
          <label htmlFor="username" className="font-[Montserrat] font-semibold">
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
            className="font-[Montserrat] font-semibold mt-5"
          >
            Password
          </label>
          <input
            id="pw"
            name="pw"
            type="password"
            className=" border-solid border-3 rounded-[5px] p-1.5"
          />
          <div className="flex justify-between mt-1.5">
            <label className="font-[Montserrat] text-[1.1rem]">
              <input
                id="cbox"
                name="cbox"
                type="checkbox"
                className="mr-2 h-4 w-4"
              />
              Remember Me
            </label>
            <a
              href="http://google.com"
              target="_blank"
              className="font-[Montserrat] text-[1.1rem] text-[#45B29D] hover:underline"
            >
              Forgot Password?
            </a>
          </div>
          <button
            type="submit"
            className="bg-[#45B29D] text-white mt-10 p-1.5 rounded-[5px] w-90 m-auto font-semibold cursor-pointer
            hover:opacity-50 focus:opacity-50"
          >
            Log in
          </button>
        </form>
      </div>
    </>
  );
}

export default Login;
