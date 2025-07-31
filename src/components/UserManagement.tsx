import CHAI from "../assets/CHAI.jpg";
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { verifyPasswordResetCode, applyActionCode, confirmPasswordReset } from "firebase/auth";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";


function UserManagement() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams()
    const [formState, setForm] = useState(1);
    const [showModal, setShowModal] = useState(false)
    const mode = searchParams.get("mode");
    const actionCode = searchParams.get("oobCode") || "";
    // const continueUrl = searchParams.get("continueUrl");

    useEffect(() => {
        if (!mode || !actionCode) {
            console.log("Invalid email action link.");
            return;
        }

        switch (mode) {
            case "verifyEmail":
                applyActionCode(auth, actionCode)
                    .then(() => {
                        console.log("Email verified successfully!")
                    })
                    .catch(() => {
                        console.log("Error verifying email.")
                    });
                break;

            case "resetPassword":
                verifyPasswordResetCode(auth, actionCode)
                    .then(() => {
                        console.log("Code Verified")
                    })
                    .catch(() => {
                        console.log("Invalid or expired reset code.")
                    });
                break;

            default:
                console.log('Unknown mode.');
        }
    }, [mode, actionCode]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (formState < 3) {
            if (formState === 1) {
                setForm(formState + 1)
                return
            }
            const formData = new FormData(e.target as HTMLFormElement);
            const password = formData.get("nPassword") as string;
            const rPassword = formData.get("rPassword") as string;

            if (password !== rPassword) {
                toast.warning("Different passwords inputted")
                return
            }

            confirmPasswordReset(auth, actionCode, password)
                .then(() => {
                    // Password reset has been confirmed and new password updated.
                    toast.success("Password Change Successful")
                    // TODO: If a continue URL is available, display a button which on
                    // click redirects the user back to the app via continueUrl with
                    // additional state determined from that URL's parameters.
                    setShowModal(true)
                    document.body.style.overflow = 'hidden'
                }).catch((error) => {
                    // Error occurred during confirmation. The code might have expired or the
                    // password is too weak.
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(errorCode);
                    console.log(errorMessage);
                });
            setForm(formState + 1)
        } else {
            console.log("HIII")
        }
    }

    return (
        <div className="transition-all duration-500 ease-in-out w-full max-w-lg mx-auto h-[90vh] flex flex-col items-center justify-center">
            {showModal && createPortal(
                <div className="fixed top-0 right-0 left-0 bottom-0 z-50 flex items-center justify-center bg-black/50 animate-fade">
                    <div className="bg-white rounded-sm p-6 w-full max-w-md">
                        <h2 className="text-lg font-bold text-secondary mb-4">Password Reset Successful</h2>
                        <p className="mb-6 text-secondary">Your password has been changed. You can now log in with your new credentials.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    document.body.style.overflow = 'unset'
                                    navigate("/")
                                }}
                                className="bg-gray-300 hover:bg-gray-400 text-secondary font-semibold px-4 py-2 rounded"
                            >
                                Return to Login Page
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
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
                        <label htmlFor="nPassword" className="font-sans font-semibold">
                            New Password
                        </label>
                        <input
                            id="nPassword"
                            name="nPassword"
                            type="password"
                            className={`transition-all duration-500 border-solid border-3 rounded-[5px] p-1.5`}
                        />
                    </div>
                    <div
                        className={`flex flex-col transition-all duration-500 ease-in-out ${formState >= 2
                                ? "opacity-100 translate-x-0 h-[8vh]"
                                : "opacity-0 -translate-x-5 pointer-events-none h-0"
                            }`}
                    >
                        <label htmlFor="rPassword" className="font-sans font-semibold">
                            Confirm Password
                        </label>
                        <input
                            id="rPassword"
                            name="rPassword"
                            type="password"
                            className="border-solid border-3 rounded-[5px] p-1.5"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={formState === 3 ? true : false}
                        className="bg-primary text-white mt-2 p-1.5 rounded-[5px] w-full m-auto font-semibold cursor-pointer duration-200 transition-all
                        hover:opacity-50 focus:opacity-50"
                    >
                        {formState >= 2 ? "Change Password" : "Continue"}
                    </button>
                    <a
                        onClick={() => { navigate("/") }}
                        className="text-center border-2 border-white text-white mt-2 p-1.5 rounded-[5px] w-full m-auto font-semibold duration-200 transition-all cursor-pointer
                        hover:opacity-50 focus:opacity-50"
                    >
                        Back to Login
                    </a>
                </form>
            </div>
        </div>
    )
}

export default UserManagement;