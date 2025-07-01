// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCyrZ7eC5Gf4KTEymBIBW1XlCpJF-wYcdA",
    authDomain: "chai-met.firebaseapp.com",
    projectId: "chai-met",
    storageBucket: "chai-met.firebasestorage.app",
    messagingSenderId: "508823509206",
    appId: "1:508823509206:web:c506b8cbe2d57646d91177",
    measurementId: "G-L9Y3L93Q7R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// only sync up with emulators if running in dev mode (npx vite) and VITE_OVERRIDE_EMULATOR (.env variable) is not "true"
if (import.meta.env.DEV && import.meta.env.VITE_OVERRIDE_EMULATOR !== "true") {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, 'localhost', 8080);
}

export { auth, db }