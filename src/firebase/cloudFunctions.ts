import { httpsCallable } from "firebase/functions";
import { func } from "./firebaseConfig";

export const callTest = httpsCallable(func, 'test')