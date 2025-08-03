import { Link } from "react-router";

function EventCard({ uid, date, event, time }: { date: string; event: string; time: string, uid: string }) {
  const dateString = date.split(' ')
  return (
    <Link to={`/event/${uid}`}
      className="flex flex-row items-center mt-2 h-15 d mr-2 d border-primary border-solid border-2  text-white rounded-sm font-semibold">
      <div className="flex flex-col justify-center items-center border-r-2 border-primary px-2 h-full text-white font-semibold">
        <h4 className="text-gray-100 text-sm font-medium">{dateString[0] + ' ' + dateString[1] + ', ' + dateString[2]}</h4>
        <h4>{time.padStart(2, '0')}</h4>
      </div>
      <div className="grow bg-primary h-full flex items-center">
        <h3 className="block truncate w-50 sm:w-100 p-2">{event}</h3>
      </div>
    </Link>
  );
}

export default EventCard;
