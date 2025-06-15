import type { User } from "firebase/auth";
import { createContext } from "react";

/**
 * the data type for UserContext.
 * undefined = Firebase has not confirmed if user is logged in or not.
 * null = The user is NOT logged in.
 * User = that's the User!
 */
export type UserStateType = User | null | undefined;


export const UserContext = createContext<UserStateType>(null);