import type { User } from "firebase/auth";
import { createContext, useContext } from "react";

/**
 * the data type for UserContext.
 * undefined = Firebase has not confirmed if user is logged in or not.
 * null = The user is NOT logged in.
 * User = that's the User!
 */
export type UserStateType = User & { is_admin: boolean } | null | undefined;


export const UserContext = createContext<UserStateType>(null);

export const useAuth = () => useContext(UserContext);