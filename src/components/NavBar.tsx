import "../css/styles.css";
import { NavLink } from "react-router";
import { auth } from "../firebase/firebaseConfig";
import { useContext } from "react";
import { UserContext } from "../assets/userContext";
import { useEffect } from "react";

function NavBar(){
    const user = useContext(UserContext)
    const urlssss = [
        {  name: "Admin",  pldt: "/ProfileCreation" },
        {  name: "Beneficiaries", pldt: "/ProfileList" },
        {  name: "You", pldt: "/ProfileDetails" },
        {  name: "Events", pldt: "/Events"},
        {  name: "Calendar", pldt: "/Calendar" }
    ];

    return(
        <>
            { user && (
            <div className="flex flex-row items-center justify-around p-4 sticky bottom-0  bg-[#254151] font-[Montserrat] font-bold text-white w-full shadow-[0px_-3px_20px] shadow-gray-500">
                { urlssss.map ((ur) => (
                    <NavLink to={ur.pldt}
                    className={({ isActive, isPending }) =>
                                    (isPending ? "pending " : 
                                    isActive ? "text-amber-300 " : "")
                                + "flex duration-100 hover:translate-y-[-5px] text-sm"}> {ur.name}</NavLink>
                    ))
                }
            </div>)
            }
        </>
    )
}

function fuckery(){

}

export default NavBar;