import type { AttendedEvents } from "@models/attendedEventsType";
import { formatDate } from "date-fns";

function EventCard({attEvent}: {attEvent: AttendedEvents}) {
  return (
    <div className="grid grid-cols-4 gap-2 mt-2 font-sans bg-primary text-white p-1.5 rounded-sm font-semibold">
      <div className="flex justify-center items-center bg-secondary mr-2 text-white p-2 rounded-sm font-semibold">
        <h4 className="text-center break-words">{formatDate(new Date((attEvent.event_start.seconds ?? 0)*1000), "MMMM d, yyyy h:mm aa")}</h4>
      </div>
      <h3 className="flex justify-center items-center text-center break-words">{attEvent.event_name}</h3>
      <p className="flex justify-center items-center text-center break-words">{String(attEvent.attended ?? "Upcoming")}</p>
      <p className="flex justify-center items-center text-center break-words">{attEvent.who_attended}</p>
    </div>
  );
}

export default EventCard;