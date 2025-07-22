import type { AttendedEvents } from "@models/attendedEventsType";
import { formatDate } from "date-fns";

function EventCard({attEvent}: {attEvent: AttendedEvents}) {
  return (
    <div className="flex flex-row items-center mt-2 h-[6vh] text-[1rem] mr-2 font-sans bg-primary text-white p-1.5 rounded-[5px] font-semibold">
      <div className="flex justify-center items-center bg-secondary mr-2 text-white p-2 rounded-[5px] w-[15vh] h-[4vh] font-semibold">
        <h4>{formatDate(new Date((attEvent.event_start.seconds ?? 0)*1000), "MMMM d, yyyy h:m aa")}</h4>
      </div>
      <h3 className="flex">{attEvent.event_name}</h3>
      <p className="flex">Attended: {String(attEvent.attended ?? "Upcoming")}</p>
      <p className="flex">Who Attended: {attEvent.who_attended}</p>
    </div>
  );
}

export default EventCard;