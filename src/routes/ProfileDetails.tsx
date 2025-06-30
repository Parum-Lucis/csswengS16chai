import EventCard from "../components/EventCard.tsx";
import { useNavigate, useParams } from "react-router";
import "../css/styles.css";
import { UserContext } from "../context/userContext.ts";
import { useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore"
import type { Beneficiary } from "../models/beneficiaryType.ts";

export function ProfileDetails() {
  // const params = useParams()
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null)
  // formState == 1 && 2 for beneficiary view and edit 
  // formState == 3 && 4 for volunteer view and edit 
  const [formState, setForm] = useState(0);
  const [docID, setDocID] = useState(beneficiary?.docID)

  useEffect(() =>  {
    const fetchBeneficiary = async () => {
      const getQuery = doc(db, "beneficiaries", "test-1")
      const beneficiariesSnap = await getDoc(getQuery)
      if(beneficiariesSnap.exists())
        setBeneficiary(beneficiariesSnap.data() as Beneficiary)
        setDocID(beneficiariesSnap.id)
        setForm(1)
    }
    fetchBeneficiary()
  }, [setBeneficiary])
  console.log(beneficiary)
  const navigate = useNavigate();
  const usertest = useContext(UserContext);
  const { sex, contact_number : contact, grade_level : level, address } = beneficiary || {}
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

  let isStudent = false;
  let hasID = false;

  function handleEdit(){
    // view beneficiary
    if (formState == 1) {
      setForm(2)
    }
    // view volunteer
    else if (formState == 3){
      setForm(4)
    }
    // edit volunteer
    else if (formState == 4){
      setForm(3)
    }
    // beneficiary
    else if (formState == 2){
      setForm(1)
    }
  }
  async function handleDelete(){

  }
  const handleSave = 
  async () => {
    if(!sex || !level || !contact)
      return
    if(sex != "M" && sex != "F")
      return
    if(level > 12 || level < 1)
      return 
    if(contact.toString().length != 12) 
      return

    const updateRef = doc(db, "beneficiaries", docID!)
    console.log(beneficiary)
    await updateDoc(updateRef, {
      ...beneficiary
    })
    if (formState == 2)
      setForm(1)
    else if (formState == 4)
      setForm(3)
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
          {(formState == 0) && (
          <h3
              className="z-1 absolute right-4 bottom-0 bg-[#e7c438] text-white px-4 py-2 rounded font-semibold hover:bg-[#45b29c8a] transition">
            Fetching...
          </h3>
          )}

          <div className="w-full max-w-2xl bg-[#45B29D] rounded-md px-4 sm:px-6 py-8">
            <h3 className="text-[#254151] text-2xl text-center font-bold font-[Montserrat]">
              {beneficiary?.last_name}, {beneficiary?.first_name}
            </h3>

            {(formState == 1 || formState == 2) && hasID && (
                <div className="w-full flex justify-center mt-1">
                  <div className="flex flex-row gap-2 text-[#254151] font-[Montserrat]">
                    <label htmlFor="idNum">ID:</label>
                    <input
                      name="idNum"
                      id="idNum"
                      type="number"
                      className="underline text-sm text-[#254151] font-[Montserrat] px-0 py-0 w-auto border border-[#254151] rounded-sm"
                      onChange={(e) => setBeneficiary({...beneficiary as Beneficiary, accredited_id : Number(e.target.value)})}
                      value={beneficiary?.accredited_id}
                      readOnly={formState == 1}
                    />
                  </div>
                </div>
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
                      readOnly={formState == 0 || formState == 1 || formState==3}
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
                      readOnly={formState == 0 || formState == 1 || formState==3}
                      onChange={(e) => setBeneficiary({...beneficiary as Beneficiary, sex : e.target.value})}
                      value={sex}/>
                </div>
              </div>
              { (formState == 1 || formState == 2) && (
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
                      readOnly={formState == 1}
                      onChange={(e) => setBeneficiary({...beneficiary as Beneficiary, grade_level : Number(e.target.value)})}
                      value={level}/>
                </div>
              )}

              <div className="flex flex-col">
                <label
                    htmlFor="cNum"
                    className="mb-1 bg-[#254151] text-white px-2 py-1 rounded font-semibold font-[Montserrat]">
                  Contact No:
                </label>
                <input
                    type="number"
                    id="cNum"
                    className="w-full text-white border border-[#254151] bg-[#3EA08D] rounded px-3 py-2 font-[Montserrat]"
                    readOnly={formState == 0 || formState == 1 || formState==3}
                    onChange={(e) => setBeneficiary({...beneficiary as Beneficiary, contact_number : Number(e.target.value)})}
                    value={contact}/>
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
                    readOnly={formState == 0 || formState == 1 || formState==3}
                    onChange={(e) => setBeneficiary({...beneficiary as Beneficiary, address : e.target.value})}
                    value={address}/>
              </div>
              {(formState == 1 || formState == 2) && (
              <div className="flex flex-col">
                <h3
                    className="text-center bg-[#254151] text-[#45B29D] px-2 py-1 rounded-t-sm font-semibold font-[Montserrat]">
                  Parent Information
                </h3>
                <div className="flex flex-row items-center w-full text-white border-x border-[#254151] bg-[#3EA08D] px-3">
                  <label htmlFor="ParentName" className="text-white font-[Montserrat] font-bold text-center">Name:</label>
                  <input
                      type="text"
                      name="ParentName"
                      id="ParentName"
                      className="w-full bg-[#3e907f] text-white px-3 py-2 font-[Montserrat] border border-[#254151] m-1 rounded-sm"
                      readOnly={formState == 1}
                      />
                </div>
                <div className="flex flex-row items-center w-full text-white border-x border-[#254151] bg-[#3EA08D] px-3">
                  <label htmlFor="ParentAffliation" className="text-white font-[Montserrat] font-bold text-center">Affliation:</label>
                  <input
                      type="text"
                      name="ParentAffliation"
                      id="ParentAffliation"
                      className="w-full bg-[#3e907f] text-white px-3 py-2 font-[Montserrat] border border-[#254151] m-1 rounded-sm"
                      readOnly={formState == 1}
                      />
                </div>
                <div className="flex flex-row items-center w-full text-white border-b border-x rounded-b-sm border-[#254151] bg-[#3EA08D] px-3">
                  <label htmlFor="ParentcNum" className="text-nowrap text-white font-[Montserrat] font-bold text-center">Contant Number:</label>
                  <input
                      type="text"
                      name="ParentcNum"
                      id="ParentcNum"
                      className="w-full bg-[#3e907f] text-white px-3 py-2 font-[Montserrat] border border-[#254151] m-1 rounded-sm"
                      readOnly={formState == 1}
                      />
                </div>
              </div>
              )}
              <div className="flex flex-row items-center justify-around w-full gap-4">
                {(formState === 2 || formState === 4) && (
                  <button
                      type="submit"
                      className="mt-2 w-full bg-[#FF0000] text-white px-4 py-2 rounded font-semibold font-[Montserrat] cursor-pointer"
                      onClick={handleEdit}>
                    Discard
                  </button>
                  )
                }
                <button
                    type="submit"
                    className="mt-2 w-full bg-[#254151] text-white px-4 py-2 rounded font-semibold font-[Montserrat] cursor-pointer"
                    onClick={formState == 0 || formState == 1 || formState == 3 ? handleEdit : handleSave}
                    disabled={formState == 0}>
                  {formState == 0 || formState == 1 || formState == 3 ? "Edit" : "Save Changes"}
                </button>
              </div>
              {(formState == 1 || formState == 3) && (
              <button
                    type="submit"
                    className="mt-2 w-full bg-[#254151] text-white px-4 py-2 rounded font-semibold font-[Montserrat] cursor-pointer"
                    onClick={handleDelete}
                    disabled={formState == 0}>
                    Delete Account
              </button>
              )}
            </div>
          </div>

          {(formState == 1 || formState == 2) && (
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


