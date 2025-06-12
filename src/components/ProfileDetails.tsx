import { toast } from "react-toastify";
import EventCard from "./EventCard"
import '../css/styles.css'

function ProfileDetails(){
    const isEditable = false;
    let isID = false;
    const user = {
        role:"Student",
        fName: "Juan",
        lName: "DELA CRUZ",
        birthday: "2000-04-11",
        id: 12341991,
        gLevel: "2",
        sex: "M",
        contact: "09171111111",
        address: "Earth"
    }
    const eventsTest = [
        {"id": 0, "name": "Donation", "date": "12/2/1902"},
        {"id": 1, "name": "Class", "date": "12/2/2002"},
        {"id": 2, "name": "Church", "date": "12/2/2004"},
    ]

    if (user.id) {
        isID = true;
    }

    return (
        <div className='flex items-center justify-center h-[100vh]'>
            <div className='flex items-center justify-center w-[65vh] h-[90vh] bg-[#254151] rounded-[5px] pb-[15px]'>
                <div className='z-1 overflow-hidden bg-gray-500 w-[20vh] h-[20vh] absolute top-[9%] border-5 border-[#45B29D] rounded-full '>
                    <i className="relative right-0.5 bottom-6 text-[20vh] text-gray-300 fi fi-ss-circle-user"></i>
                </div>
                <div className='z-0 flex flex-col relative top-[7%]'>
                    <div className='flex flex-col w-[61vh] h-[50%]  overflow-hidden bg-[#45B29D] rounded-[5px] p-[9px] pt-20 '>
                        <h3 className="text-[#254151] mt-6 flex text-3xl justify-center font-[Montserrat] font-bold">{user.lName}, {user.fName}</h3>
                        {isID && <h3 className="flex text-[#254151] justify-center font-[Montserrat] font-regular">id: {user.id} </h3>} 
                        <div className="flex flex-col p-3">
                            <div className="flex flex-row justify-between items-center mt-2">
                                <div className="flex flex-row items-center">
                                    <label htmlFor="bDate" className="h-[4vh] text-[1rem] mr-2 flex font-[Montserrat] h-[4vh] justify-center items-center bg-[#254151] text-white p-1.5 rounded-[5px] font-semibold">Birth Date:</label>
                                    <input type="date" name="bDate" className="text-white input-text flex h-[4vh] w-[30vh]" readOnly={!isEditable} value={user.birthday}/>
                                </div>
                                <div className="flex flex-row items-center">
                                    <label htmlFor="Sex" className="h-[4vh] text-[1rem] flex mr-2 font-[Montserrat] justify-center items-center bg-[#254151] text-white p-1 rounded-[5px] font-semibold">Sex:</label>
                                    <input type="text" name="Sex" className="input-text flex h-[4vh] w-[5vh]" readOnly={!isEditable} value={user.sex}/>
                                </div>
                            </div>
                            <div className="flex flex-row items-center mt-2">
                                <label htmlFor="gLevel" className="h-[4vh] text-[1rem] flex mr-2 font-[Montserrat] justify-center items-center bg-[#254151] text-white p-1.5 rounded-[5px] font-semibold w-[27%]">Grade Level:</label>
                                <input type="text" name="gLevel" className="input-text flex h-[4vh] w-[77%]" readOnly={!isEditable} value={user.gLevel}/>
                            </div>
                            <div className="flex flex-row items-center mt-2">
                                <label htmlFor="cNum" className="h-[4vh] text-[1rem] flex mr-2 font-[Montserrat] justify-center items-center bg-[#254151] text-white p-1.5 rounded-[5px] font-semibold w-[25%]">Contact No:</label>
                                <input type="number" name="cNum" className="input-text flex h-[4vh] w-[75%]" readOnly={!isEditable} value={user.contact}/>
                            </div>
                            <div className="flex flex-row items-center mt-2">
                                <label htmlFor="Address" className="h-[4vh] text-[1rem] flex mr-2 font-[Montserrat] justify-center items-center bg-[#254151] text-white p-1.5 rounded-[5px] font-semibold">Address:</label>
                                <input type="text" name="Address" className="input-text flex h-[4vh] w-[100%]" readOnly={!isEditable} value={user.address} />
                            </div>
                            <button type='submit' className='flex mt-3 h-[4vh] justify-center items-center bg-[#254151] text-white p-1.5 rounded-[5px] w-[20vh] m-auto font-semibold' disabled={!isEditable}> Edit </button>
                        </div>
                    </div>
                    <div className='flex flex-col align-center w-[61vh] h-[27vh] p-4'>
                        <h3 className="text-[#45B29D] mt-2 flex text-3xl justify-center font-[Montserrat] font-bold">Attended Events</h3>
                        {eventsTest.map(event => <EventCard date={event.date} event={event.name}/>)}
                    </div>
                </div>
            </div>
        </div>
    )
}


export default ProfileDetails