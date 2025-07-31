import type { Beneficiary } from "@models/beneficiaryType";
import type { Volunteer as OriginalVolunteer } from "@models/volunteerType";
import { getBlob, ref } from "firebase/storage";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { store } from "../firebase/firebaseConfig";
import { differenceInYears } from "date-fns";

// :3 (id should come in as either null (always for Volunteer), number, or "waitlisted")
type Volunteer = OriginalVolunteer & { accredited_id?: number | null };

function ProfileCard({ profile: {
  docID, pfpPath, first_name, last_name, sex, birthdate, accredited_id
}, sort }: { profile: Volunteer | Beneficiary, sort: string }) {
  const [picURL, setPicURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    async function fetchPictureBlob() {
      setIsLoading(true);
      if (!pfpPath) {
        setIsLoading(false);
        return
      }

      try {
        const r = ref(store, pfpPath);
        const blob = await getBlob(r);
        if (blob.size > 0)
          setPicURL(URL.createObjectURL(blob));
      } catch (error) {
        console.error(error);

      } finally {
        setIsLoading(false);
      }
    }
    fetchPictureBlob();
  }, [pfpPath]);

  const fullName = sort === "first"
    ? `${first_name.toUpperCase()} ${last_name}`
    : `${last_name.toUpperCase()}, ${first_name}`;

  return (
    <Link
      to={docID}
      className="w-full flex items-center bg-primary text-white rounded-xl p-4 shadow-lg cursor-pointer hover:opacity-90 transition"
    >
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 overflow-hidden">
        {
          isLoading || picURL === null ?
            <svg
              className="w-6 h-6 text-primary"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
              />
            </svg> :
            <img src={picURL} className="h-full w-full" />
        }
      </div>
      <div className="flex flex-col text-sm relative flex-1">
        <span className="font-bold text-base font-sans">
           {fullName.length > 30 ? fullName.slice(0, 30) + "..." : fullName}
        </span>
        <span>Age: {differenceInYears(new Date(), birthdate.toDate())}</span>
        <span>Sex: {sex}</span>
        {accredited_id != null && (
          <div
            className="absolute right-2 bottom-2 rounded-full px-2 py-1 text-xs font-semibold"
            style={{ right: 0, bottom: 0, backgroundColor: "#539665" }}
          >
            {isNaN(accredited_id) ? "Waitlisted" : `Child ID#${accredited_id}`}
          </div>
        )}
      </div>
    </Link>
  );
}

export default ProfileCard;