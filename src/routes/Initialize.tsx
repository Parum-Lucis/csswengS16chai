import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { auth, func } from "../firebase/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router";

/**
 * Holds a button that populates the emulator with accounts and data.
 */
export function Initializer() {
    const [isRunning, setIsRunning] = useState(false);
    const navigate = useNavigate();
    async function handleClick() {
        console.log("hi")
        setIsRunning(true);

        await (httpsCallable(func, "initializeEmulator")());

        await signInWithEmailAndPassword(auth, "admin@chai.com", "firebase");
        navigate("/me");

        setIsRunning(false);
    }

    return (
        <button onClick={handleClick}
            className={"p-4 bg-primary " + (isRunning ? "cursor-not-allowed opacity-50" : "cursor-pointer")}
            disabled={isRunning}>Populate!</button>
    )
}