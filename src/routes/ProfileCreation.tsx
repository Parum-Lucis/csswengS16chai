import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { db } from "../firebase/firebaseConfig"
import { collection, doc, addDoc/*, Timestamp*/ } from "firebase/firestore"
import React from "react";

function ProfileCreation() {
  const navigate = useNavigate();

  const submitDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    let err = false;
    for (const [, value] of formData.entries()) {
      console.log(value.toString(), err);
      if (!value) err = true;
    }

    const emailRegEx = new RegExp(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g);
    if (!err) {
      if (!emailRegEx.test(formData.get("email") as string)) {
        toast.error("Please input a proper email.");
        return
      } else if (
        (formData.get("cNum") as string).length != 11 ||
        formData.get("cNum")?.slice(0, 2) != "09"
      ) {
        toast.error("Please input a valid phone number.");
        return
      } else {
        console.log("im here");
        const role = formData.get("dropdown") as string
        if( role == "Admin" || "Volunteer") {
          const is_admin = (role == "Admin" ? true : false )
          const addRef = await addDoc(collection(db, "volunteers"), {
            contact_number: parseInt(formData.get("cNum") as string),
            email: formData.get("email") as string,
            first_name: formData.get("fName") as string,
            last_name: formData.get("lName") as string,
            is_admin: is_admin,
            role: role,
          });

          if(addRef) {
            toast.success("Success!");
            navigate("/view-profile");
          }
          else toast.error("Submission failed.");
        }
      }
    } else toast.error("Please fill up all fields!");
  };

  return (
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-[#254151]">
        <div className="relative w-full max-w-2xl flex flex-col items-center rounded-[5px] p-4 sm:p-6">
          <div className="absolute top-0 sm:top-0 z-10 w-28 h-28 sm:w-36 sm:h-36 overflow-hidden bg-gray-500 border-4 border-[#45B29D] rounded-full flex items-center justify-center">
            <i className="text-[6rem] sm:text-[7rem] text-gray-300 fi fi-ss-circle-user"></i>
          </div>
          <div className="flex w-full bg-[#45B29D] rounded-[5px] p-4 pt-20">
            <form className="flex flex-col w-full space-y-3" onSubmit={submitDetails}>
              <div>
                <label htmlFor="dropdown" className="text-white font-[Montserrat] font-semibold">
                  Role
                </label>
                <select
                    name="dropdown"
                    className="w-full rounded-[5px] p-2 font-[Montserrat] border-2 border-[#254151]"
                >
                  <option value="Admin">Admin</option>
                  <option value="Volunteer">Volunteer</option>
                  <option value="Student">Student</option>
                  <option value="Waitlist">Waitlist</option>
                </select>
              </div>
              <div>
                <label htmlFor="role" className="text-white font-[Montserrat] font-semibold">
                  Temporary
                </label>
                <input
                    id="Temporary"
                    name="Temporary"
                    type="text"
                    className="input-text w-full"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-white font-[Montserrat] font-semibold">
                  Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    className="input-text w-full"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-4">
                <div className="flex flex-col w-full sm:w-1/2">
                  <label htmlFor="fName" className="text-white font-[Montserrat] font-semibold">
                    First Name
                  </label>
                  <input
                      id="fName"
                      name="fName"
                      type="text"
                      className="input-text w-full"
                  />
                </div>
                <div className="flex flex-col w-full sm:w-1/2">
                  <label htmlFor="lName" className="text-white font-[Montserrat] font-semibold">
                    Last Name
                  </label>
                  <input
                      id="lName"
                      name="lName"
                      type="text"
                      className="input-text w-full"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="address" className="text-white font-[Montserrat] font-semibold">
                  Address
                </label>
                <input
                    id="address"
                    name="address"
                    type="text"
                    className="input-text w-full"
                />
              </div>
              <div>
                <label htmlFor="cNum" className="text-white font-[Montserrat] font-semibold">
                  Contact No.
                </label>
                <input
                    id="cNum"
                    name="cNum"
                    type="number"
                    className="input-text w-full"
                />
              </div>
              <button
                  type="submit"
                  className="bg-[#254151] text-white mt-4 p-2 rounded-[5px] font-semibold"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      </div>
  );
}

export default ProfileCreation;
