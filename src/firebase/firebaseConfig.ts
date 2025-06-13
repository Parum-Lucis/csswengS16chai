// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCEWhBVxz2Ss-NMsVXa-lmh68BU08tUJK4",
  authDomain: "chai-taguig-c7886.firebaseapp.com",
  projectId: "chai-taguig-c7886",
  storageBucket: "chai-taguig-c7886.firebasestorage.app",
  messagingSenderId: "28332240319",
  appId: "1:28332240319:web:8b3786413622643dea450a",
  measurementId: "G-K5WQ7NZEVB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
