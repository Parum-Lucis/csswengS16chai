import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { db } from "../firebase/firebaseConfig"
import {
  collection, addDoc,/*, Timestamp*/
  Timestamp
} from "firebase/firestore"
import React from "react";
import { useState } from "react";
import type { Guardian } from "@models/guardianType";
import GuardianCard from "../components/GuardianCard";
import { callCreateVolunteerProfile } from "../firebase/cloudFunctions";
import type { Volunteer } from "@models/volunteerType";
import { emailRegex } from "../util/emailRegex";


export function VolunteerProfileCreation() {
  const navigate = useNavigate();

  const submitDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    const data: Volunteer = {
      contact_number: formData.get("cNum") as string,
      email: formData.get("email") as string,
      first_name: formData.get("fName") as string,
      last_name: formData.get("lName") as string,
      is_admin: formData.get("dropdown") as string == "Admin",
      birthdate: Timestamp.fromMillis(Date.parse(/*formData.get("") as string*/ "2000-01-01T00:00:00.001Z")),
      address: formData.get("address") as string,
      sex: formData.get("SexDropdown") as string,
      role: formData.get("dropdown") as string,
    }
    /*
    Error:
    whitespaces are allowed in the form

    Possibile Solution:
    let err = false;
    for (const [, value] of formData.entries()) {
      // Trim the value if it's a string before checking
      if (typeof value === 'string' && !value.trim()) {
        err = true;
      } else if (!value) {
        err = true;
      }
    }
    */

    let err = false;
    for (const [, value] of formData.entries()) {
      console.log(value.toString(), err);
      if (!(value.toString().trim())) err = true;
    }

    if (err) {
      toast.error("Please fill up all fields!");
      return;
    }


    if (!emailRegex.test(data.email)) {
      toast.error("Please input a proper email.");
      return;
    }

    if (data.contact_number.length != 11 ||
      formData.get("cNum")?.slice(0, 2) != "09") {
      toast.error("Please input a valid phone number.");
      return
    }



    const res = await callCreateVolunteerProfile(data);

    if (res.data) {
      toast.success("Success!");
      navigate("/view-profile");
    } else {
      toast.error("Couldn't create profile.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-[#254151]">
      <div className="relative w-full max-w-2xl flex flex-col items-center rounded-[5px] p-4 sm:p-6">
        <div className="absolute sm:top-0 z-1 w-28 h-28 sm:w-36 sm:h-36 overflow-hidden bg-gray-500 border-4 border-[#45B29D] rounded-full flex items-center justify-center">
          <i className="text-[6rem] sm:text-[7rem] text-gray-300 fi fi-ss-circle-user"></i>
        </div>
        <div className="flex w-full bg-[#45B29D] rounded-[5px] p-4 pt-20">
          <form className="flex flex-col w-full space-y-3" onSubmit={submitDetails}>
            <div>
              <label htmlFor="dropdown" className="text-white font-[Montserrat] font-semibold">
                Role
              </label>
              <select
                id="dropdown"
                name="dropdown"
                className="w-full rounded-[5px] p-2 font-[Montserrat] border-2 border-[#254151]"
              >
                <option value="Admin">Admin</option>
                <option value="Volunteer">Volunteer</option>
              </select>
            </div>
            <div>
              <label htmlFor="birthdate" className="text-white font-[Montserrat] font-semibold">
                Birth Date
              </label>
              <input
                id="birthdate"
                name="birthdate"
                type="date"
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
              <label htmlFor="SexDropdown" className="text-white font-[Montserrat] font-semibold">
                Sex
              </label>
              <select
                id="SexDropdown"
                name="SexDropdown"
                className="w-full rounded-[5px] p-2 font-[Montserrat] border-2 border-[#254151]"
              >
                <option value="Male">Male</option>
                <option value="Volunteer">Female</option>
              </select>
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

export function BeneficiaryProfileCreation() {
  const navigate = useNavigate();
  const [guardians, setGuardians] = useState<Guardian[]>([{
    name: '',
    relation: '',
    email: '',
    contact_number: ''
  }])
  const [minimizeState, setMinimize] = useState(false)

  function handleMinimize() {
    setMinimize(!minimizeState)
  }

  const submitDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    let err = false;
    let is_waitlisted = false;

    /* changed */
    /*
    for (const [key, value] of formData.entries()) {
      console.log(value.toString(), err);
      if (!(value.toString().trim()))
        key == "idNum" ? is_waitlisted = true : err = true
    }
    */

    // gemini suggested this, better logic daw
    const formValues: { [key: string]: FormDataEntryValue } = {};
    for (const [key, value] of formData.entries()) {
      formValues[key] = value;
    }

    for (const key in formValues) {
      const value = formValues[key];
      if (typeof value === 'string' && !value.trim()) {
        if (key === "idNum") {
          is_waitlisted = true;
        } else {
          err = true;
        }
      } else if (!value && key !== "idNum") {
        err = true;
      }
    }
    /* end of change */

    if (!err) {

      let test = false
      guardians.forEach((guardian, i) => {
        Object.values(guardian).forEach((val) => {
          if (!(val.toString().trim())) {
            toast.error("Please fill up all fields for Guardian " + (i + 1));
            test = true
            return
          }
        })
        if (test)
          return
        else if (!emailRegex.test(guardian.email)) {
          console.log(guardian.email)
          toast.error("Please input a proper email for Guardian " + (i + 1));
          test = true
          return
        }
        else if (guardian.contact_number.length != 11 || guardian.contact_number.slice(0, 2) != "09") {
          toast.error("Please input a proper contact number for Guardian " + (i + 1));
          test = true
          return
        }
      });
      if (test)
        return
      else {
        /* changed */
        /*
        const accredited_id = Number((formData.get("idNum") as string).trim())
        const addRef = await addDoc(collection(db, "beneficiaries"), {
        */
        const idNumValue = (formData.get("idNum") as string);
        const accredited_id = idNumValue.trim() ? Number(idNumValue) : NaN;
        /* end of change */
        const addRef = await addDoc(collection(db, "beneficiaries"), {
          /* accredited_id: accredited_id == 0 ? accredited_id : NaN,*/ // already converts an empty string to NaN
          accredited_id: accredited_id,
          first_name: formData.get("fName") as string,
          last_name: formData.get("lName") as string,
          address: formData.get("address") as string,
          birthdate: Timestamp.fromMillis(Date.parse(formData.get("birthdate") as string)),
          grade_level: Number(formData.get("gradelevel") as string),
          is_waitlisted: is_waitlisted,
          guardians: guardians,
          sex: formData.get("SexDropdown") as string, /* this was missing pala? */
        });

        if (addRef) {
          toast.success("Success!");
          navigate("/view-profile");
        }
        else toast.error("Submission failed.");
      }
    } else toast.error("Please fill up all fields!");
  };

  function handleAdd() {
    if (guardians.length + 1 <= 3) {
      setGuardians([...guardians, {
        name: '',
        relation: '',
        email: '',
        contact_number: ''
      }])
    }
    else
      toast.error("Cannot add more than 3 guardians!")
  }

  function handleSub() {
    if (guardians.length - 1 >= 1) {
      /* 
      Error: 
      remember that arrays are references? so we need to create a new copy instead
      when reducedGuardians.pop() is called, it modifies the original one
      for some reason according to Gemini, React doesn't see the update if ^^, so it doesn't re-render the component

      Possible Solution:
      const reducedGuardians = guardians.slice(0, -1);
      setGuardians(reducedGuardians);

      // noted, applied solution
      */
      const reducedGuardians = guardians.slice(0, -1);
      setGuardians(reducedGuardians)
    }
    else
      toast.error("Cannot have 0 guardians!")
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-[#254151]">
      <div className="relative w-full max-w-2xl flex flex-col items-center rounded-[5px] p-4 sm:p-6">
        <div className="absolute top-0 sm:top-0 z-10 w-28 h-28 sm:w-36 sm:h-36 overflow-hidden bg-gray-500 border-4 border-[#45B29D] rounded-full flex items-center justify-center">
          <i className="text-[6rem] sm:text-[7rem] text-gray-300 fi fi-ss-circle-user"></i>
        </div>
        <div className="flex w-full flex-col bg-[#45B29D] rounded-[5px] p-4 pt-20">
          <form className="flex flex-col w-full space-y-3" onSubmit={submitDetails}>
            <div>
              <label htmlFor="idNum" className="text-white font-[Montserrat] font-semibold">
                ID no.
              </label>
              <input
                id="idNum"
                name="idNum"
                type="number"
                className="input-text w-full"
              />
            </div>
            <div>
              <label htmlFor="birthdate" className="text-white font-[Montserrat] font-semibold">
                Birth Date
              </label>
              <input
                id="birthdate"
                name="birthdate"
                type="date"
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
              <label htmlFor="SexDropdown" className="text-white font-[Montserrat] font-semibold">
                Sex
              </label>
              <select
                id="SexDropdown"
                name="SexDropdown"
                className="w-full rounded-[5px] p-2 font-[Montserrat] border-2 border-[#254151]"
              >
                <option value="Male">Male</option>
                <option value="Volunteer">Female</option>
              </select>
            </div>
            <div>
              <label htmlFor="gradelevel" className="text-white font-[Montserrat] font-semibold">
                Grade Level
              </label>
              <input
                id="gradelevel"
                name="gradelevel"
                type="number"
                className="input-text w-full"
              />
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
            <div className="flex flex-row justify-end gap-1">
              <button
                type="button"
                className={`flex w-fit bg-[#254151] text-[#45B29D] p-1 px-3 rounded-sm font-semibold font-[Montserrat] cursor-pointer`}
                onClick={handleAdd}>
                +
              </button>
              <button
                type="button"
                className={`flex w-fit bg-[#254151] text-[#45B29D] p-1 px-3 rounded-sm font-semibold font-[Montserrat] cursor-pointer`}
                onClick={handleSub}>
                -
              </button>
            </div>
            <div className="flex flex-col">
              <button
                type="button"
                className={`flex items-center justify-between bg-[#254151] text-[#45B29D] px-2 py-1 rounded-t-sm font-semibold font-[Montserrat] transition-all duration-300 cursor-pointer ${minimizeState ? "rounded-b-sm" : "rounded-t-sm"}`}
                onClick={handleMinimize}>
                Guardian Information
                <span className="flex items-center justify-center">
                  <i className={`text-3xl mb-[-0.5rem] fi fi-ss-angle-small-down transition-all duration-300 ${minimizeState ? "rotate-180 mt-[-1rem]" : "rotate-0"}`}></i>
                </span>
              </button>
              <div className={`overflow-auto transition-all duration-300 ease-in-out ${minimizeState ? "max-h-0 opacity-0" : "max-h-96 opacity-100"}`}>
                <div className="w-full rounded-b-sm text-white border border-[#254151] bg-[#3EA08D] p-3">
                  {Array.from(
                    { length: guardians.length },
                    (_, i) => (
                      <div className="pb-4">
                        <h3 className="font-[Montserrat] mb-2">Guardian {i + 1}</h3>
                        <GuardianCard formState={false} index={i} guardians={guardians} setGuardians={setGuardians} />
                      </div>
                    )
                  )}
                </div>
              </div>
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
