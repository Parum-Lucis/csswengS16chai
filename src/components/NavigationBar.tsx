import "../css/styles.css";
import { NavLink } from "react-router";
import { useContext } from "react";
import { UserContext } from "../util/userContext.ts";


function NavigationBar() {
    const user = useContext(UserContext)
    const urls = [
        { name: "Admin", pldt: "/admin" },
        { name: "Search", pldt: "/view-profile-list" },
        { name: "Beneficiaries", pldt: "/view-beneficiary-list" },
        { name: "You", pldt: "/view-profile" },
        { name: "Events", pldt: "/view-event-list" },
        { name: "Calendar", pldt: "/view-calendar" }
    ];

    return (
        <>
            {user && (
                <div className="flex items-center justify-center p-4 fixed bottom-0 left-0  bg-[#254151] font-[Montserrat] font-bold text-white w-full border-t border-t-gray-400 shadow-[0px_-3px_20px] shadow-gray-500">
                    <div className="flex flex-row gap-3 md:gap-10">
                        {urls.map((ur) => (
                            <NavLink to={ur.pldt}
                                key={ur.pldt}
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