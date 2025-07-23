import { useContext, useEffect } from "react";
import { UserContext } from "../util/userContext";
import { Outlet, useNavigate } from "react-router";
import { toast } from "react-toastify";

export function AdminLayout() {

    const user = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        function check() {
            if (user === undefined) {
                return;
            }
            else if (user === null) {
                navigate("/");
                return
            }
            else if (!user.is_admin) {
                navigate("/me");
                toast.warn("You are not an admin!");
            }
        }
        check();
    }, [user, navigate])

    if (user && user.is_admin) {
        return <Outlet />
    } else {
        return <></>
    }
}