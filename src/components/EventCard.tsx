import type { AttendedEvents } from "@models/attendedEventsType";
import { formatDate } from "date-fns";
import { Link } from "react-router";

function EventCard({attEvent}: {attEvent: AttendedEvents}) {
  let attendance = ""
  switch(attEvent.attended) {
    case true:
      attendance = "Present"
      break;
    case false:
      attendance = "Absent"
      break;
    default:
      attendance = "Upcoming Event"
      break;
  }
  if(Date.now() < (attEvent.event_start.toMillis() ?? 0))
    attendance = "Upcoming Event"

  return (
    <Link
      to={`/event/${attEvent.docID}`} className="flex items-center bg-primary text-white rounded-xl p-4 shadow-md">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 shrink-0">
          <svg
            className="w-6 h-6 text-primary"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
          </svg>
        </div>
        <div className="grow min-w-0">
          <div className="block truncate w-50 sm:w-60 text-base font-bold">{attEvent.event_name}</div>
          <div>
            <div className="text-sm">Date: {formatDate(new Date((attEvent.event_start.seconds ?? 0)*1000), "MM/dd/yy")}<br />Time: {formatDate(new Date((attEvent.event_start.seconds ?? 0)*1000), "h:mm aa")}</div>
            <div className="block truncate w-40 sm:w-50 text-sm">Attendee: {attEvent.who_attended}</div>
            <div className="text-sm">Attendance: {attendance}</div>
          </div>
      </div>
    </Link>
  );
}

export default EventCard;
