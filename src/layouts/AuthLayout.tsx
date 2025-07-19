import { useContext } from "react";
import { UserContext } from "../util/userContext";
import { Outlet, useNavigate } from "react-router";
import NavigationBar from "../components/NavigationBar";

export function AuthLayout() {

    const user = useContext(UserContext);

    const navigate = useNavigate();
    if (user === undefined)
        return <></>

    if (user === null) {
        navigate("/");
        return <></>
    }


    return (
        <>
            <Outlet />
            <NavigationBar />
        </>
    )
}