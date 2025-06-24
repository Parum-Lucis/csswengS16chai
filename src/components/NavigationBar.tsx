import "../css/styles.css";
import { NavLink } from "react-router";
import { useContext } from "react";
import { UserContext } from "../context/userContext.ts";


function NavigationBar(){
    const user = useContext(UserContext)
    const urls = [
        {  name: "Admin",  pldt: "/view-admin" },
        {  name: "Beneficiaries", pldt: "/view-profile-list"},
        {  name: "You", pldt: "/view-profile" },
        {  name: "Events", pldt: "/view-event-list"},
        {  name: "Calendar", pldt: "/view-calendar" }
    ];

    return(
        <>
            { user && (
            <div className="flex items-center justify-center p-4 sticky bottom-0  bg-[#254151] font-[Montserrat] font-bold text-white w-full border-t border-t-gray-400">
                <div className="flex flex-row gap-3 md:gap-10">
                    { urls.map ((ur) => (
                        <NavLink to={ur.pldt}
                        className={({ isActive, isPending }) =>
                                        (isPending ? "pending " : 
                                        isActive ? "text-amber-300 " : "")
                                    + "flex duration-100 hover:translate-y-[-5px] text-sm"}> {ur.name}</NavLink>
                        ))
                    }
                </div>
            </div>)
            }
        </>
    )
}

export default NavigationBar;