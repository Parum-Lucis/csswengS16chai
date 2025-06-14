import EventCard from "../components/EventCard";
import { useNavigate } from "react-router";
import "../css/styles.css";
import { UserContext } from "../assets/userContext";
import { useContext, useEffect } from "react";
import { auth } from "../firebase/firebaseConfig";

function ProfileDetails() {
  const navigate = useNavigate();
  const usertest = useContext(UserContext);

  useEffect(() => {

    // If there is no user logged in, skip this page and redirect to login page
    if (usertest === null) {
      navigate("/");
    }
  }, [usertest, navigate]);

  const isEditable = false;
  let isStudent = false;
  let hasID = false;

  const user = {
    role: "Student",
    fName: "Juan",
    lName: "DELA CRUZ",
    birthday: "2000-04-11",
    id: 12341991,
    gLevel: "2",
    sex: "M",
    contact: "09171111111",
    address: "Earth",
  };

  const eventsTest = [
    { id: 0, name: "Donation", date: "12/2/1902" },
    { id: 1, name: "Class", date: "12/2/2002" },
    { id: 2, name: "Church", date: "12/2/2004" },
  ];

  // Account role checking
  if (user.role === "Student") {
    isStudent = true;
    if (user.id) hasID = true;
  }

  return (
    <div className="h-screen flex items-center justify-center p-3">
      <div
        className={`relative overflow-hidden flex items-end justify-center pl-3 pr-3 pt-20 h-auto bg-[#254151] rounded-[5px] pb-3`}
      >
        <div className="z-1 overflow-hidden bg-gray-500 w-[9rem] h-[9rem] absolute top-[4%] border-5 border-[#45B29D] rounded-full">
          <i className="relative right-0.5 bottom-6 text-[9rem] text-gray-300 fi fi-ss-circle-user"></i>
        </div>
        <button
          onClick={() => {
            auth.signOut();
            // navigate("/");
          }}
          className="absolute left-[3%] top-[2%] bg-[#45B29D] text-white p-1.5 rounded-[5px] font-semibold duration-500 hover:bg-[#45b29c8a]"
        >
          Sign Out
        </button>
        <div className=" flex flex-col justify-center items-center">
          <div className="flex flex-col overflow-hidden bg-[#45B29D] rounded-[5px] p-2 pt-20">
            <h3 className="text-[#254151] mt-6 flex text-2xl justify-center font-[Montserrat] font-bold">
              {user.lName}, {user.fName}
            </h3>
            {hasID && (
              <h3 className="flex text-[#254151] justify-center font-[Montserrat] font-regular">
                id: {user.id}{" "}
              </h3>
            )}
            <div className="flex flex-col p-3">
              <div className="flex flex-row justify-between items-center gap-2">
                <div className="flex items-center">
                  <label
                    htmlFor="bDate"
                    className="text-nowrap mr-2 flex font-[Montserrat] justify-center items-center bg-[#254151] text-white p-1 rounded-[5px] font-semibold"
                  >
                    Birth Date:
                  </label>
                  <input
                    type="date"
                    name="bDate"
                    className="flex text-white font-[Montserrat] border-solid border-1 border-[#254151] bg-[#3EA08D] rounded-[5px] p-[0.18rem]"
                    readOnly={!isEditable}
                    value={user.birthday}
                  />
                </div>
                <div className="flex items-center">
                  <label
                    htmlFor="Sex"
                    className="flex mr-2 font-[Montserrat] justify-center items-center bg-[#254151] text-white p-1 rounded-[5px] font-semibold"
                  >
                    Sex:
                  </label>
                  <input
                    type="text"
                    name="Sex"
                    className="w-[1.5rem] flex text-white font-[Montserrat] border-solid border-1 border-[#254151] bg-[#3EA08D] rounded-[5px] p-[0.18rem]"
                    readOnly={!isEditable}
                    value={user.sex}
                  />
                </div>
              </div>
              <div className="flex flex-row items-center mt-2">
                <label
                  htmlFor="gLevel"
                  className="flex mr-2 font-[Montserrat] justify-center items-center bg-[#254151] text-white p-1 rounded-[5px] font-semibold"
                >
                  Grade Level:
                </label>
                <input
                  type="text"
                  name="gLevel"
                  className="flex-1/2 text-white font-[Montserrat] border-solid border-1 border-[#254151] bg-[#3EA08D] rounded-[5px] p-[0.18rem]"
                  readOnly={!isEditable}
                  value={user.gLevel}
                />
              </div>
              <div className="flex flex-row items-center mt-2">
                <label
                  htmlFor="cNum"
                  className="flex mr-2 font-[Montserrat] justify-center items-center bg-[#254151] text-white p-1 rounded-[5px] font-semibold"
                >
                  Contact No:
                </label>
                <input
                  type="number"
                  name="cNum"
                  className="flex-1/2 text-white font-[Montserrat] border-solid border-1 border-[#254151] bg-[#3EA08D] rounded-[5px] p-[0.18rem]"
                  readOnly={!isEditable}
                  value={user.contact}
                />
              </div>
              <div className="flex flex-row items-center mt-2">
                <label
                  htmlFor="Address"
                  className="flex mr-2 font-[Montserrat] justify-center items-center bg-[#254151] text-white p-1 rounded-[5px] font-semibold"
                >
                  Address:
                </label>
                <input
                  type="text"
                  name="Address"
                  className="flex-1/2 text-white font-[Montserrat] border-solid border-1 border-[#254151] bg-[#3EA08D] rounded-[5px] p-[0.18rem]"
                  readOnly={!isEditable}
                  value={user.address}
                />
              </div>
              <button
                type="submit"
                className="flex mt-3 justify-center items-center bg-[#254151] text-white p-1.5 rounded-[5px] font-semibold"
                disabled={!isEditable}
              >
                {" "}
                Edit{" "}
              </button>
            </div>
          </div>
          {isStudent && (
            <div className="flex flex-col align-center h-[27vh] p-4">
              <h3 className="text-[#45B29D] mt-2 flex text-3xl justify-center font-[Montserrat] font-bold">
                Attended Events
              </h3>
              <div className="overflow-auto">
                {eventsTest.map((event) => (
                  <EventCard date={event.date} event={event.name} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileDetails;
