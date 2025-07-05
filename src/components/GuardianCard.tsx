import type { Guardian } from "../models/guardianType";

function GuardianCard(
    {formState=false, 
        index, 
        guardians, 
        setGuardians}: 
    {formState : (boolean | null),
        index: number,
        guardians: Guardian[],
        setGuardians: React.Dispatch<React.SetStateAction<Guardian[]>>
}){
    const changeField = (field: string, val: string) => {
        const upd = [...guardians]
        upd[index] = { ...upd[index], [field]: val }
        setGuardians(upd)
    }
    return (
        <>
        <div className="flex flex-row items-center w-full text-white border-x border-t rounded-t-sm border-[#254151] bg-[#3EA08D] px-3">
        <label htmlFor="ParentName" className="text-white font-[Montserrat] font-bold text-center">Name:</label>
        <input
            type="text"
            name="ParentName"
            id="ParentName"
            className="w-full bg-[#3e907f] text-white px-3 py-2 font-[Montserrat] border border-[#254151] m-1 rounded-sm"
            readOnly={formState ?? true}
            value={guardians[index].name}
            onChange={e => changeField('name', e.target.value)}
            />
        </div>
        <div className="flex flex-row items-center w-full text-white border-x border-[#254151] bg-[#3EA08D] px-3">
        <label htmlFor="Relation" className="text-white font-[Montserrat] font-bold text-center">Relation:</label>
        <input
            type="text"
            name="Relation"
            id="Relation"
            className="w-full bg-[#3e907f] text-white px-3 py-2 font-[Montserrat] border border-[#254151] m-1 rounded-sm"
            readOnly={formState ?? true}
            value={guardians[index].relation}
            onChange={e => changeField('relation', e.target.value)}
            />
        </div>
        <div className="flex flex-row items-center w-full text-white border-x border-[#254151] bg-[#3EA08D] px-3">
        <label htmlFor="email" className="text-white font-[Montserrat] font-bold text-center">Email:</label>
        <input
            type="text"
            name="email"
            id="email"
            className="w-full bg-[#3e907f] text-white px-3 py-2 font-[Montserrat] border border-[#254151] m-1 rounded-sm"
            readOnly={formState ?? true}
            value={guardians[index].email}
            onChange={e => changeField('email', e.target.value)}
            />
        </div>
        <div className="flex flex-row items-center w-full text-white border-b border-x rounded-b-sm border-[#254151] bg-[#3EA08D] px-3">
        <label htmlFor="ParentcNum" className="text-nowrap text-white font-[Montserrat] font-bold text-center">Contact Number:</label>
        <input
            type="text"
            name="ParentcNum"
            id="ParentcNum"
            className="w-full bg-[#3e907f] text-white px-3 py-2 font-[Montserrat] border border-[#254151] m-1 rounded-sm"
            readOnly={formState ?? true}
            value={guardians[index].contact_number}
            onChange={e => changeField('contact_number', e.target.value)}
            />
        </div>
        </>
    )
}

export default GuardianCard;