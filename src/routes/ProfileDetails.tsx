import EventCard from "../components/EventCard";
import { useNavigate, useParams } from "react-router";
import "../css/styles.css";
import { UserContext } from "../context/userContext";
import { useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore"
import type { Beneficiary } from "../models/beneficiaryType";
import { toast } from "react-toastify";

function ProfileDetails() {
  // const params = useParams()
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null)
  const [docID, setDocID] = useState(beneficiary?.docID)

  useEffect(() =>  {
    const fetchBeneficiary = async () => {
      const getQuery = doc(db, "beneficiaries", "test-1")
      const beneficiariesSnap = await getDoc(getQuery)
      if(beneficiariesSnap.exists())
        setBeneficiary(beneficiariesSnap.data() as Beneficiary)
        setDocID(beneficiariesSnap.id)
    }
    fetchBeneficiary()
  }, [setBeneficiary])
  console.log(beneficiary)
  const navigate = useNavigate();
  const usertest = useContext(UserContext);
  const { sex, grade_level : level, address } = beneficiary || {}
  const birthdate = new Date((beneficiary?.birthdate.seconds ?? 0)*1000)

  const userEx = {
    role: "Student",
    fName: "Juan",
    lName: "DELA CRUZ",
    birthday: "2000-04-11",
    id: 12341991,
    gLevel: 2,
    sex: "M",
    contact: "09171111111",
    address: "Earth",
  };

  useEffect(() => {

    // If there is no user logged in, skip this page and redirect to login page.
    if (usertest === null) {
      navigate("/");
    }
  }, [usertest, navigate]);

  const isEditable = false;
  let isStudent = false;
  let hasID = false;

  const handleEdit = async () => {
    if(!sex || !level )
      return
    if(sex != "M" && sex != "F")
      return
    if(level > 12 || level < 1)
      return 
    /*
    if(contact.toString().length != 12) 
      return
    */

    const updateRef = doc(db, "beneficiaries", docID!)
    console.log(beneficiary)
    await updateDoc(updateRef, {
      ...beneficiary
    })
    toast.success("Success!")
  }

  const eventsTest = [
    { id: 0, name: "Donation", date: "12/02/1902" },
    { id: 1, name: "Teaching", date: "12/02/1999" },
    { id: 2, name: "Airplane Visit", date: "11/09/2001" },
    { id: 3, name: "Church", date: "12/02/2004" },
    { id: 4, name: "Donation", date: "12/02/2005" },
    { id: 5, name: "Teaching", date: "12/02/2006" },
    { id: 6, name: "Food Drive", date: "12/02/2007" },
    { id: 7, name: "Food Drive", date: "12/02/2008" },
    { id: 8, name: "Christmas Party", date: "22/12/2009" },
  ];

  // Account role checking
  if (userEx.role === "Student") {
    isStudent = true;
    if (userEx.id) hasID = true;
  }

  return (
      <div className="w-full min-h-screen bg-[#254151] flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
        <div className="relative w-full max-w-4xl rounded-md flex flex-col items-center pt-8 pb-10 px-4 sm:px-6 overflow-hidden">
          <div className="-top-5 sm:-top-20 z-10 w-32 h-32 sm:w-36 sm:h-36 bg-gray-500 border-[5px] border-[#45B29D] rounded-full flex items-center justify-center mb-1">
            <i className="text-[6rem] sm:text-[8rem] text-gray-300 fi fi-ss-circle-user"></i>
          </div>

          <button
              onClick={() => auth.signOut()}
              className="absolute left-4 top-8 bg-[#45B29D] text-white px-4 py-2 rounded font-semibold hover:bg-[#45b29c8a] transition">
            Sign Out
          </button>

          <div className="w-full max-w-2xl bg-[#45B29D] rounded-md px-4 sm:px-6 py-8">
            <h3 className="text-[#254151] text-2xl text-center font-bold font-[Montserrat]">
              {beneficiary?.last_name}, {beneficiary?.first_name}
            </h3>

            {hasID && (
                <h3 className="text-[#254151] text-center font-[Montserrat] mt-1">
                  ID: {beneficiary?.accredited_id}
                </h3>
            )}

            <div className="flex flex-col gap-4 mt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col flex-1">
                  <label
                      htmlFor="bDate"
                      className="mb-1 bg-[#254151] text-white px-2 py-1 rounded font-semibold font-[Montserrat]">
                    Birth Date:
                  </label>
                  <input
                      type="date"
                      id="bDate"
                      className="w-full text-white border border-[#254151] bg-[#3EA08D] rounded px-3 py-2 font-[Montserrat]"
                      readOnly={isEditable}
                      onChange={(e) => setBeneficiary({...beneficiary as Beneficiary, birthdate : Timestamp.fromDate(birthdate)})}
                      value={birthdate?.toISOString().substring(0,10)}/>
                </div>

                <div className="flex flex-col flex-1">
                  <label
                      htmlFor="Sex"
                      className="mb-1 bg-[#254151] text-white px-2 py-1 rounded font-semibold font-[Montserrat]">
                    Sex:
                  </label>
                  <input
                      type="text"
                      id="Sex"
                      className="w-full text-white border border-[#254151] bg-[#3EA08D] rounded px-3 py-2 font-[Montserrat]"
                      readOnly={isEditable}
                      onChange={(e) => setBeneficiary({...beneficiary as Beneficiary, sex : e.target.value})}
                      value={sex}/>
                </div>
              </div>

              <div className="flex flex-col">
                <label
                    htmlFor="gLevel"
                    className="mb-1 bg-[#254151] text-white px-2 py-1 rounded font-semibold font-[Montserrat]">
                  Grade Level:
                </label>
                <input
                    type="text"
                    id="gLevel"
                    className="w-full text-white border border-[#254151] bg-[#3EA08D] rounded px-3 py-2 font-[Montserrat]"
                    readOnly={isEditable}
                    onChange={(e) => setBeneficiary({...beneficiary as Beneficiary, grade_level : Number(e.target.value)})}
                    value={level}/>
              </div>

              <div className="flex flex-col">
                <label
                    htmlFor="cNum"
                    className="mb-1 bg-[#254151] text-white px-2 py-1 rounded font-semibold font-[Montserrat]">
                  Contact No:
                </label>
                {/*
                <input
                    type="number"
                    id="cNum"
                    className="w-full text-white border border-[#254151] bg-[#3EA08D] rounded px-3 py-2 font-[Montserrat]"
                    readOnly={isEditable}
                    onChange={(e) => setBeneficiary({...beneficiary as Beneficiary, contact_number : Number(e.target.value)})}
                    value={contact}/>   */}
              </div>
               
              <div className="flex flex-col">
                <label
                    htmlFor="add"
                    className="mb-1 bg-[#254151] text-white px-2 py-1 rounded font-semibold font-[Montserrat]">
                  Address:
                </label>
                <input
                    type="text"
                    id="add"
                    className="w-full text-white border border-[#254151] bg-[#3EA08D] rounded px-3 py-2 font-[Montserrat]"
                    readOnly={isEditable}
                    onChange={(e) => setBeneficiary({...beneficiary as Beneficiary, address : e.target.value})}
                    value={address}/>
              </div>

              <button
                  type="submit"
                  className="mt-2 bg-[#254151] text-white px-4 py-2 rounded font-semibold font-[Montserrat] cursor-pointer"
                  onClick={handleEdit}
                  disabled={isEditable}>
                Edit
              </button>
            </div>
          </div>

          {isStudent && (
              <div className="w-full max-w-2xl mt-8">
                <h3 className="text-[#45B29D] text-2xl text-center font-bold font-[Montserrat] mb-4">
                  Attended Events
                </h3>
                <div className="space-y-2">
                  {eventsTest.map((event, index) => (
                      <EventCard key={index} date={event.date} event={event.name}/>
                  ))}
                </div>
              </div>
          )}
        </div>
      </div>
  )
      ;
}

export default ProfileDetails;
