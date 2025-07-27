import CHAI from "../assets/CHAI.jpg";
import "../css/styles.css";
import { useNavigate } from "react-router";
import { auth } from "../firebase/firebaseConfig";
import { toast } from "react-toastify";
import { sendPasswordResetEmail } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useState, useRef } from "react";
import { emailRegex } from "../util/emailRegex";

function ForgetMeNot() {
    const [formState, setForm] = useState(1);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [disableButton, setDisableButton] = useState(false);
    const navigate = useNavigate();

    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        setDisableButton(true)
        const formData = new FormData(e.target as HTMLFormElement);
        const email = formData.get("username") as string;
        
        if (!emailRegex.test(email)) {
            toast.error("Please input a proper email.");
            setDisableButton(false)
            if (buttonRef.current){
                buttonRef.current.blur()
            }
              return;
        }
        if (formState < 3){
            if (formState === 1){
                
                sendPasswordResetEmail(auth, email ,{
                    url: "https://chai-met.firebaseapp.com/"
                })
                .then(() => {
                    console.log("Password reset email sent")
                    toast.success("Password reset email sent")
                })
                .catch((error: FirebaseError) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log (errorCode);
                    console.log(errorMessage);
                })
            }
            setForm(formState + 1)
        } else {
            console.log("HIII")
        }
    }

    return (
        <div className="transition-all duration-500 ease-in-out w-full max-w-lg mx-auto h-[90vh] flex flex-col items-center justify-center">
        <img
            src={CHAI}
            alt="Logo"
            className="w-24 h-24 sm:w-32 sm:h-32 p-1 mt-10 mb-6 rounded-full border-2 border-solid border-[#E3E3E3]"
        />
        <h2 className="font-sans text-center font-bold text-[1.2rem] sm:text-[1.3rem]">
            Forgot Password
        </h2>
            <div className="w-full max-w-md flex justify-center items-center mb-6 mt-4">
                <form onSubmit={handleSubmit} className="transition-all duration-500 ease-in-out w-full flex flex-col gap-2 p-4 sm:p-6">
                    <div
                        className="flex flex-col transition-all duration-500 ease-in-out"
                    >
                        <label htmlFor="username" className="font-sans font-semibold">
                            Enter Email
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="email"
                            readOnly={formState >= 2 ? true : false}
                            className={`transition-all duration-500 border-solid border-3 rounded-[5px] p-1.5 ${
                                formState >=2
                                    ? "bg-gray-300"
                                    : "bg-transparent"
                            }`}
                        />
                    </div>
                    <button
                        type="submit"
                        ref={buttonRef}
                        disabled={disableButton}
                        className="bg-primary text-white mt-2 p-1.5 rounded-[5px] w-full m-auto font-semibold cursor-pointer duration-200 transition-all
                        hover:opacity-50 focus:opacity-50"
                    >
                        Submit Email
                    </button>
                    <a
                        onClick={() => {navigate("/")}}
                        className="text-center border-2 border-white text-white mt-2 p-1.5 rounded-[5px] w-full m-auto font-semibold duration-200 transition-all cursor-pointer
                        hover:opacity-50 focus:opacity-50"
                    >
                        Back to Login
                    </a>
                </form>
            </div>
        </div>
    );
}

export default ForgetMeNot;
