import { getBlob, ref } from "firebase/storage";
import { useEffect, useState, type ChangeEvent } from "react"
import { store } from "../firebase/firebaseConfig";

export function ProfilePictureInput(
    { readOnly, currentPicPath }
        :
        { readOnly: boolean, currentPicPath?: string }
) {
    const [profilePictureURL, setProfilePictureURL] = useState<string | null>(null);

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files) {
            setProfilePictureURL(URL.createObjectURL(e.target.files[0]));
        }
    }

    useEffect(() => {
        async function fetchCurrentPic() {
            if (!currentPicPath) return;
            const r = ref(store, currentPicPath);
            const blob = await getBlob(r);
            setProfilePictureURL(URL.createObjectURL(blob));
        }
        fetchCurrentPic();
    }, [currentPicPath])

    return (
        <div className="absolute top-0 z-10 w-32 h-32 sm:w-36 sm:h-36 bg-gray-500 border-[10px] border-primary rounded-full flex items-center justify-center mb-1 mt-15 overflow-hidden">
            <label htmlFor="pfp" className="hover:opacity-80 cursor-pointer h-full">
                <input type="file" name="pfp" id="pfp" accept="image/*" disabled={readOnly} className="hidden" onChange={handleChange} />
                {
                    profilePictureURL ?
                        <img src={profilePictureURL} alt="profile picture" className="h-full w-full" /> :
                        <i className="flex text-[6rem] sm:text-[8rem] text-gray-300 fi fi-ss-circle-user"></i>
                }
            </label>
        </div>
    )
}