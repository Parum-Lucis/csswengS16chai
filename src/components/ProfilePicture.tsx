import { type ChangeEvent } from "react"

export function ProfilePictureInput(
    { readOnly = false, pfpFile, onPfpChange }
        :
        {
            pfpFile: File | null,
            readOnly?: boolean,
            onPfpChange?: (e: ChangeEvent<HTMLInputElement>) => void
        }
) {
    console.log(pfpFile?.size);
    return (
        <div className="absolute top-0 z-10 w-32 h-32 sm:w-36 sm:h-36 bg-gray-500 border-[10px] border-primary rounded-full flex items-center justify-center mb-1 mt-15 overflow-hidden">
            <label htmlFor="pfp" className={`h-full ${!readOnly ? "hover:opacity-80 cursor-pointer" : ""}`}>
                <input type="file" name="pfp" id="pfp" accept="image/*" disabled={readOnly} className="hidden" onChange={onPfpChange} />
                {
                    pfpFile && pfpFile.size > 0 ?
                        <img src={URL.createObjectURL(pfpFile)} alt="profile picture" className="h-full w-full" /> :
                        <i className="flex text-[8rem] sm:text-[8rem] text-gray-300 fi fi-ss-circle-user"></i>
                }
            </label>
        </div>
    )
}