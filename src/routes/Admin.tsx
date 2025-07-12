import "../css/styles.css";
import { NavLink, useNavigate } from "react-router";
import { useContext, useEffect } from "react";
import { UserContext } from "../context/userContext.ts";


function Admin(){
    const navigate = useNavigate()
    const user = useContext(UserContext)

    const urls = [
        {  name: "Create Volunteer Profile",  pldt: "/create-volunteer-profile" },
        {  name: "Create Beneficiary Profile", pldt: "/create-beneficiary-profile"},
    ];

    useEffect(() => {
        // If there is no user logged in, skip this page and redirect to login page.
        if (user === null) {
          navigate("/");
        }
      }, [user, navigate]);

    return (
        <div className="w-full min-h-screen flex bg-secondary items-start">
            {(
            <div className="flex wrap-anywhere p-9 gap-4 font-sans font-bold w-full max-w-5xl text-white">
                    { urls.map ((ur) => (
                        <NavLink to={ur.pldt}
                        className="flex duration-100 bg-primary rounded-md text-2xl text-center p-6 hover:bg-onhover"> {ur.name}</NavLink>
                        ))
                    }
            </div>)
            }
        </div>
    )
}

export default Admin;