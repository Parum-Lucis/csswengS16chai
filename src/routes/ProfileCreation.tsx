import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { db } from "../firebase/firebaseConfig"
import { collection, doc, addDoc,/*, Timestamp*/ 
Timestamp} from "firebase/firestore"
import React from "react";
import { useState } from "react";
import type { Guardian } from "../models/guardianType";
import GuardianCard from "../components/GuardianCard.tsx";

//password generator
function GenPass(){

  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  const pass_length = 20
  let pass = Array.from(crypto.getRandomValues(new Uint32Array(pass_length)))
                  .map((x) => chars[x % chars.length])
                  .join('')

  return pass
}

export function VolunteerProfileCreation() {
  const navigate = useNavigate();

  const submitDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    let err = false;
    for (const [, value] of formData.entries()) {
      console.log(value.toString(), err);
      if (!value) err = true;
    }

    const password = GenPass()

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
        const role = formData.get("dropdown") as string
        const is_admin = (role == "Admin" ? true : false )
        const addRef = await addDoc(collection(db, "volunteers"), {
          contact_number: formData.get("cNum") as string,
          email: formData.get("email") as string,
          first_name: formData.get("fName") as string,
          last_name: formData.get("lName") as string,
          is_admin: is_admin,
          birthdate: Timestamp.fromMillis(Date.parse(/*formData.get("") as string*/ "2000-01-01T00:00:00.001Z")),
          address: formData.get("address") as string,
          sex: formData.get("SexDropdown") as string,
          role: role,
        });

        if(addRef) {
          toast.success("Success!");
          navigate("/view-profile");
        }
        else toast.error("Submission failed.");
      }
    } else toast.error("Please fill up all fields!");
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
  //formState = 0, 0 guardian (just because lol)
  //formState = 1, 1 guardian
  //formState = 2, 2 guardian
  //formState = 3, 3 guardian
  const [guardianState, setGuardianState] = useState(1)
  const [guardians, setGuardians] = useState<Guardian[]>([{
    name: '',
    relation: '',
    email: '',
    contact_number: ''
  }])
  const [minimizeState, setMinimize] = useState(false)

  function handleMinimize(){
        setMinimize(!minimizeState)
  } 

  const submitDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    let err = false;
    let is_waitlisted = false;
    for (const [key, value] of formData.entries()) {
      console.log(value.toString(), err);
      if (!value)
        key == "idNum" ? is_waitlisted = true : err = true
    }

    const emailRegEx = new RegExp(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g);
    if (!err) {
      if (!emailRegEx.test(formData.get("email") as string)) {
        toast.error("Please input a proper email.");
      } else if (
        (formData.get("ParentcNum") as string).length != 11 ||
        formData.get("ParentcNum")?.slice(0, 2) != "09"
      ) {
        toast.error(
          "Please input a valid phone number." +
            formData.get("cNum")?.toString.length
        );
      } else {
        const addRef = await addDoc(collection(db, "beneficiaries"), {
          accredited_id: Number(formData.get("idNum") as string) || NaN,
          first_name: formData.get("fName") as string,
          last_name: formData.get("lName") as string,
          address: formData.get("address") as string,
          birthdate: Timestamp.fromMillis(Date.parse(formData.get("birthdate") as string)),
          grade_level: Number(formData.get("gradelevel") as string),
          is_waitlisted: is_waitlisted,
          guardians: guardians,
        });

        if(addRef) {
          toast.success("Success!");
          navigate("/view-profile");
        }
        else toast.error("Submission failed.");
      }
    } else toast.error("Please fill up all fields!");
  };

  function handleAdd(){
    if (guardianState+1 <= 3){
      setGuardianState(guardianState+1)
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

  function handleSub(){
    if (guardianState-1 >= 1){
      setGuardianState(guardianState-1)
      const reducedGuardians = guardians
      reducedGuardians.pop()
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
                          {length: guardianState},
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
