import { formatDate } from "date-fns";
import type { Timestamp } from "firebase/firestore";

function EventCard({ date, name }: { date: Timestamp, name: string }) {
  return (
    <div className="flex flex-row items-center mt-2 h-[6vh] text-[1rem] mr-2 font-sans bg-primary text-white p-1.5 rounded-[5px] font-semibold">
      <div className="flex justify-center items-center bg-secondary mr-2 text-white p-2 rounded-[5px] w-[15vh] h-[4vh] font-semibold">
        <h4>{formatDate(date.toDate(), "mm d, yyyy")}</h4>
      </div>
      <h3 className="flex">{name}</h3>
    </div>
  );
}

export default EventCard;
