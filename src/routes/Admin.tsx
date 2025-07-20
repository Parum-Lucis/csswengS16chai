import "../css/styles.css";
import { NavLink, useNavigate } from "react-router";
import { useContext, useEffect } from "react";
import { UserContext } from "../context/userContext.ts";


function Admin(){
    const navigate = useNavigate()
    const user = useContext(UserContext)

    const urls = [
        {  name: "Create Beneficiary Profile", pldt: "/create-beneficiary-profile" },
        {  name: "Import Beneficiary", pldt: "/import-csv" },
        {  name: "Create Volunteer Profile",  pldt: "/create-volunteer-profile" },  
        {  name: "Import Volunteer", pldt: "/import-csv" },
        {  name: "Create Event", pldt: "/create-event" },
        {  name: "Import Event", pldt: "/import-csv" }
    ];

    useEffect(() => {
        // If there is no user logged in, skip this page and redirect to login page.
        if (user === null) {
          navigate("/");
        }
      }, [user, navigate]);

    return (
        <div className="w-full bg-secondary flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8 relative mt-20">
            <div className="relative w-full max-w-2xl flex flex-col items-center px-4 sm:px-6 overflow-hidden">
            <h1 className="text-center text-5xl font-bold text-primary mb-8 font-sans">Admin Dashboard</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {urls.map((ur) => (
                <NavLink
                    key={ur.name}
                    to={ur.pldt}
                    className="font-sans font-semibold text-white text-center bg-primary px-5 py-5 rounded-md flex items-center justify-center shadow-lg cursor-pointer hover:opacity-90 transition"
                >
                    {ur.name}
                </NavLink>
                ))}
            </div>
            </div>  
        </div>
    );
}

export default Admin;