import { useContext } from "react";
import { UserContext } from "../util/userContext";
import { Outlet, useNavigate } from "react-router";
import { toast } from "react-toastify";

export function AdminLayout() {

    const user = useContext(UserContext);
    const navigate = useNavigate();
    if (user === undefined)
        return <></>

    if (user === null) {
        navigate("/");
        return <></>
    }

    if (!user.is_admin) {
        navigate("/view-profile");
        toast.warn("You are not authorized!");
        return <></>
    }

    return (
        <Outlet />
    )
}