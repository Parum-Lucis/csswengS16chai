import "../css/styles.css";
import { NavLink, useNavigate } from "react-router";
import { useContext, useEffect } from "react";
import { UserContext } from "../util/userContext.ts";


function Admin() {
    const navigate = useNavigate()
    const user = useContext(UserContext)

    const urls = [
        { name: "Create Beneficiary Profile", pldt: "/create-beneficiary-profile" },
        { name: "Deleted Beneficiaries", pldt: "deleted-beneficiaries" },
        { name: "View Volunteers", pldt: "volunteer/" },
        { name: "Create Volunteer Profile", pldt: "volunteer/new" },
        { name: "Deleted Volunteers", pldt: "volunteer/deleted" },
        { name: "Create Event", pldt: "/create-event" },
    ];

    useEffect(() => {
        // If there is no user logged in, skip this page and redirect to login page.
        if (user === null) {
            navigate("/");
        }
    }, [user, navigate]);

    return (
        <div className="w-full min-h-screen flex bg-secondary items-start justify-center">
            <div className="grid md:grid md:grid-cols-3 auto-rows-fr wrap-anywhere p-9 gap-4 font-sans font-bold w-full max-w-5xl text-white">
                {urls.map((ur) => (
                    <NavLink to={ur.pldt} key={ur.name}
                        className="flex justify-center items-center duration-100 bg-primary rounded-md text-2xl text-center p-6 hover:bg-onhover"> {ur.name}</NavLink>
                ))
                }
            </div>
        </div>
    )
}

export default Admin;