import CHAI from '../assets/CHAI.jpg'
import '../css/styles.css'

function Login(){
    return (
        <>
            <img src= {CHAI} alt="Logo" className='w-45 h-45 p-1 mt-10 mb-10 m-auto rounded-full border-3 border-solid border-[#E3E3E3]'/>
            <h2 className=' font-[Montserrat] font-bold text-2xl flex justify-center'>Management and Events Tracker (MET)</h2>
            <div className='m-auto w-[60vh] p-10'>
                <form className='flex flex-col'>
                    <label htmlFor='username' className='font-[Montserrat] font-semibold'>Username</label>
                    <input 
                        id='username' 
                        type='text'
                        className='border-solid border-3 rounded-[5px] p-1.5'
                    />
                    <label htmlFor='password' className='font-[Montserrat] font-semibold mt-5'>Password</label>
                    <input 
                        id='password'
                        type='password'
                        className=' border-solid border-3 rounded-[5px] p-1.5'
                    />
                    <div className='flex justify-between mt-1.5'>
                        <label className="font-[Montserrat] text-[1.1rem]">
                            <input type="checkbox" className='mr-2 h-4 w-4'/>
                            Remember Me
                        </label>
                        <a href='http://google.com' target='_blank' className='font-[Montserrat] text-[1.1rem] text-[#45B29D] hover:underline'>Forgot Password?</a>
                    </div>
                    <button type='submit' className='bg-[#45B29D] text-white mt-10 p-1.5 rounded-[5px] w-90 m-auto font-semibold'> Log in </button>
                </form>
            </div>
        </>
    )
}

export default Login