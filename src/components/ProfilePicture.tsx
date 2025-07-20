import { useState, type ChangeEvent } from "react"

export function ProfilePictureInput() {
    const [profilePicture, setProfilePicture] = useState<File | null>(null);

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files) {
            setProfilePicture(e.target.files[0]);
        }
    }
    return (
        <div className="absolute top-0 z-10 w-32 h-32 sm:w-36 sm:h-36 bg-gray-500 border-[10px] border-primary rounded-full flex items-center justify-center mb-1 mt-15 overflow-hidden">
            <label htmlFor="pfp" className="hover:opacity-80 cursor-pointer h-full">
                <input type="file" name="pfp" id="pfp" accept="image/*" className="hidden" onChange={handleChange} />
                {
                    profilePicture ?
                        <img src={URL.createObjectURL(profilePicture)} alt="profile picture" className="h-full w-full" /> :
                        <i className="flex text-[6rem] sm:text-[8rem] text-gray-300 fi fi-ss-circle-user"></i>
                }
            </label>
        </div>
    )
}