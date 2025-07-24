import { httpsCallable } from "firebase/functions";
import { func } from "../firebase/firebaseConfig";
import { toast } from "react-toastify";

function Temp() {

    return (
        <div className="flex items-center justify-center min-h-screen p-5">
            <div
                className="relative flex items-end justify-center w-full max-w-4xl min-h-[500px] bg-white rounded-[10px] p-10">
            </div>
            <button className="bg-primary p-6 cursor-pointer" onClick={async () => {
                const res = await (httpsCallable(func, 'promoteMetoAdmin'))()
                if (res.data) toast.success("you are now an admin!");
            }}>Promote me to Admin (temporary quick fix!)</button>
        </div>
    );
}

export default Temp;