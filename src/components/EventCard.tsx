function EventCard({date, event }: {date: string; event: string }) {
  return (
    <div className="flex flex-row items-center mt-2 h-[6vh] text-[1rem] mr-2 font-sans bg-primary text-white p-1.5 rounded-[5px] font-semibold">
      <div className="flex justify-center items-center bg-secondary mr-2 text-white p-2 rounded-[5px] w-[15vh] h-[4vh] font-semibold">
        <h4>{date}</h4>
      </div>
      <h3 className="flex">{event}</h3>
    </div>
  );
}

export default EventCard;
