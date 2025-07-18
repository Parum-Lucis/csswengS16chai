function EventCard({date, event, time}: {date: String; event: string; time: string }) {
  const dateString = date.split(' ')
  return (
    <div className="flex flex-row items-center mt-2 h-15 d mr-2 d bg-secondary p-2 text-white rounded-sm font-semibold">
      <div className="flex flex-col justify-center items-center border-r mr-2 text-white p-3 font-semibold">
        <h4 className="text-gray-100 text-sm font-medium">{dateString[0] + ' ' + dateString[1] + ', ' + dateString[2]}</h4>
        <h4>{time.padStart(2,'0')}</h4>
      </div>
      <h3 className="flex">{event}</h3>
    </div>
  );
}

export default EventCard;
