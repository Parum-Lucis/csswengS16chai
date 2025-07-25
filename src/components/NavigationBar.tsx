import "../css/styles.css";
import { NavLink } from "react-router-dom";
import {
    User,
    Settings,
    Users,
    SquareChartGantt,
    Calendar
} from 'lucide-react';
import { useAuth } from "../util/userContext";

function NavigationBar() {
    const user = useAuth();
    const urls = [
        { name: "You", pldt: "/me", icon: User },
        { name: "Beneficiaries", pldt: "/beneficiary", icon: Users },
        { name: "Events", pldt: "/event", icon: SquareChartGantt },
        { name: "Calendar", pldt: "/calendar", icon: Calendar }
    ];

    if (user && user.is_admin) {
        urls.splice(1, 0, { name: "Admin", pldt: "/admin", icon: Settings })
    }

    return (
        <>
            <div className="flex items-center justify-center p-4 fixed bottom-0 left-0 bg-secondary font-sans font-bold text-white w-full border-t border-t-gray-400 shadow-[0px_-3px_20px] shadow-gray-500 z-50">
                {/* Changed from flex to grid */}
                <div className="flex justify-between w-full max-w-2xl">
                    {urls.map((ur) => (
                        <NavLink
                            to={ur.pldt}
                            key={ur.pldt}
                            className={({ isActive, isPending }) =>
                                (isPending ? "pending " : isActive ? "text-amber-300 " : "") +
                                "flex flex-col items-center justify-center duration-100 hover:translate-y-[-5px] text-xs sm:text-sm"
                            }
                        >
                            <ur.icon className="w-6 h-6 mb-1" />
                            <span className="hidden sm:inline whitespace-nowrap">{ur.name}</span>
                        </NavLink>
                    ))}
                </div>
            </div>
        </>
    );
}

export default NavigationBar;