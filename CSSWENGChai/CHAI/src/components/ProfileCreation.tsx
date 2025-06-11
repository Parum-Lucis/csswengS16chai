import CHAI from '../assets/CHAI.jpg'
import { useNavigate } from "react-router";
import '../css/styles.css'

function ProfileCreation(){

    return (
        <div className='flex items-center justify-center h-[100vh]'>
            <div className='flex items-end justify-center w-[65vh] h-[90vh] bg-[#254151] rounded-[5px] pb-[15px]'>
                <div className='w-[61vh] h-[70vh]  bg-[#45B29D] rounded-[5px] p-[9px] '>
                    <form className='flex flex-col'>
                        <label htmlFor='dropdown' className='text-white font-[Montserrat] font-semibold '>Role</label>
                        <select name='dropdown' className='rounded-[5px] appearance-none p-1.5 dark:text-white h-12 font-[Montserrat] border-solid border-3 border-[#254151]'>
                            <option value='Admin' >Admin</option>
                            <option value='Admin' >Volunteer</option>
                        </select>
                        <label htmlFor='username' className='text-white font-[Montserrat] font-semibold mt-5'>Username</label>
                        <input 
                            id='username'
                            name='username'  
                            type='text'
                            className='font-[Montserrat] text-white border-solid border-1 border-[#254151] bg-[#3EA08D] rounded-[5px] p-1.5'
                        />
                        <label htmlFor='email' className='text-white font-[Montserrat] font-semibold mt-5'>Email</label>
                        <input 
                            id='email'
                            name='email'
                            type='email'
                            className='font-[Montserrat] text-white border-solid border-1 border-[#254151] bg-[#3EA08D] rounded-[5px] p-1.5'
                        />
                        <div className='flex flex-row justify-between mt-5'>
                            <div className='flex flex-col w-61'>
                                <label htmlFor='fName' className='text-white flex flex-col font-[Montserrat] font-semibold'>First Name</label>
                                <input 
                                    id='fName'
                                    name='fName'
                                    type='text'
                                    className='font-[Montserrat] text-white border-solid border-1 border-[#254151] bg-[#3EA08D] rounded-[5px] p-1.5'
                                />
                            </div>
                            <div className='flex flex-col w-61'>
                                <label htmlFor='lName' className='text-white font-[Montserrat] font-semibold'>Last Name</label>
                                <input 
                                    id='lName'
                                    name='lName'
                                    type='text'
                                    className='font-[Montserrat] text-white border-solid border-1 border-[#254151] bg-[#3EA08D] rounded-[5px] p-1.5'
                                />
                            </div>
                        </div>
                        <label htmlFor='address' className='text-white font-[Montserrat] font-semibold mt-5'>Address</label>
                        <input 
                            id='address'
                            name='address'
                            type='text'
                            className='font-[Montserrat] text-white border-solid border-1 border-[#254151] bg-[#3EA08D] rounded-[5px] p-1.5'
                        />
                        <label htmlFor='cNum' className='text-white font-[Montserrat] font-semibold mt-5'>Contact No.</label>
                        <input 
                            id='cNum'
                            name='cNum'
                            type='number'
                            className='font-[Montserrat] text-white border-solid border-1 border-[#254151] bg-[#3EA08D] rounded-[5px] p-1.5'
                        />
                        <button type='submit' className='bg-[#254151] text-white mt-10 p-1.5 rounded-[5px] w-60 m-auto font-semibold'> Create Account </button>
                    </form>
                </div>
            </div>
        </div>
    )
}


export default ProfileCreation