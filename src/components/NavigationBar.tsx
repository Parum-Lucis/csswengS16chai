import "../css/styles.css";
import { NavLink } from "react-router";
import { useContext } from "react";
import { UserContext } from "../context/userContext.ts";


function NavigationBar(){
    const user = useContext(UserContext)
    const urls = [
        {  name: "Admin",  pldt: "/create-profile" },
        {  name: "Beneficiaries", pldt: "/view-beneficiary-list"},
        {  name: "You", pldt: "/view-profile" },
        {  name: "Events", pldt: "/view-event-list"},
        {  name: "Calendar", pldt: "/view-calendar" }
    ];

    return(
        <>
            { user && (
            <div className="flex flex-row items-center justify-around p-4 fixed bottom-0 left-0  bg-[#254151] font-[Montserrat] font-bold text-white w-full shadow-[0px_-3px_20px] shadow-gray-500">
                { urls.map ((ur) => (
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

export default NavigationBar;