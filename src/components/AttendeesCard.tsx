function AttendeesCard({name, who_attended, attendance, handleToggle}: {name: string; who_attended: string; attendance: boolean, handleToggle: () => void}) {
    return ( // Add the return statement here
        <div className="w-full max-w-2xl flex flex-row items-center mt-2 h-[6vh] text-[1rem] mr-2 font-sans bg-primary text-white p-1.5 rounded-[5px] font-semibold mb-2">
          <div className="flex justify-center items-center bg-secondary mr-2 text-white p-2 rounded-[5px] w-[15vh] h-[4vh] font-semibold">
            <h3 className="flex">{who_attended}</h3>
          </div>
          <h4 className="text-start text-[15px] sm:text-[1em]">{name}</h4>
          <div className="flex items-center justify-end ml-auto">
            <h4 className="text-[15px] sm:text-[1em] mr-2">
              Attendance: {attendance ? "Absent" : "Present"}
            </h4>
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 rounded text-white bg-white border-white checked:accent-secondary checked:border-white ml-auto mr-3"
              onChange={handleToggle}
            />
          </div>
        </div>
    );
}

export default AttendeesCard;