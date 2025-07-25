import { useState, useEffect } from "react";
import { callGetSMSCredits } from "../firebase/cloudFunctions";
import { toast } from "react-toastify";
import { LoaderPinwheel } from "lucide-react";
import { Link } from "react-router";


export function SMSCreditView() {
    const [credits, setCredits] = useState(0);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {

        let ignore = false;
        async function fetchCredits() {
            setIsFetching(true);
            const res = await callGetSMSCredits();
            if (!ignore) {
                if (res.data.success && res.data.credits !== null) {
                    console.log(res.data)
                    setCredits(res.data.credits);
                } else {
                    toast.error("Couldn't load credits.")
                }
            }
            setIsFetching(false);
        }
        fetchCredits();
        return () => { ignore = true }
    }, [])

    return (
        <div className="w-full h-svh flex justify-center items-center flex-col gap-8">
            <div className="flex justify-center items-center flex-col">
                {isFetching ?
                    <LoaderPinwheel size={48} className="animate-spin" />
                    :
                    <h1 className="text-6xl">{credits}</h1>
                }
                <p className="text-2xl">Credits Left.</p>
            </div>
            <div className="w-full max-w-sm px-4">
                Each 160 characters sent is equal to 1 credit. To top up on credits, please visit{" "}
                <Link to="https://sms.iprogtech.com/" className="underline hover:opacity-80 focus:opacity-50">https://sms.iprogtech.com/</Link>.
            </div>

        </div>
    )
}