import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { db } from "../firebase/firebaseConfig"
import { collection, doc, addDoc,/*, Timestamp*/ 
Timestamp} from "firebase/firestore"
import React from "react";
import type { Guardian } from "../models/guardianType";

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
          address: /* formData.get("") as string */ "Earth",
          sex: /* formData.get("") as string */ "M",
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

export function BeneficiaryProfileCreation() {
  const navigate = useNavigate();
  
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
        const role = formData.get("dropdown") as string
        const guardianEx: Guardian[] = [{
            name: "string",
            relation: "string",
            email: "string@string.com",
            contact_number: "09876543210"
        }] // temp
        const addRef = await addDoc(collection(db, "beneficiaries"), {
          accredited_id: Number(formData.get("idNum") as string) || NaN,
          first_name: formData.get("fName") as string,
          last_name: formData.get("lName") as string,
          address: formData.get("address") as string,
          birthdate: Timestamp.fromMillis(Date.parse(/*formData.get("") as string*/ "2000-01-01T00:00:00.001Z")),
          grade_level: Number(formData.get("gradelevel") as string),
          is_waitlisted: is_waitlisted,
          guardians: guardianEx,
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
          <div className="absolute top-0 sm:top-0 z-10 w-28 h-28 sm:w-36 sm:h-36 overflow-hidden bg-gray-500 border-4 border-[#45B29D] rounded-full flex items-center justify-center">
            <i className="text-[6rem] sm:text-[7rem] text-gray-300 fi fi-ss-circle-user"></i>
          </div>
          <div className="flex w-full bg-[#45B29D] rounded-[5px] p-4 pt-20">
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
                      />
                </div>
                <div className="flex flex-row items-center w-full text-white border-x border-[#254151] bg-[#3EA08D] px-3">
                  <label htmlFor="ParentAffliation" className="text-white font-[Montserrat] font-bold text-center">Affliation:</label>
                  <input
                      type="text"
                      name="ParentAffliation"
                      id="ParentAffliation"
                      className="w-full bg-[#3e907f] text-white px-3 py-2 font-[Montserrat] border border-[#254151] m-1 rounded-sm"
                      />
                </div>
                <div className="flex flex-row items-center w-full text-white border-b border-x rounded-b-sm border-[#254151] bg-[#3EA08D] px-3">
                  <label htmlFor="ParentcNum" className="text-nowrap text-white font-[Montserrat] font-bold text-center">Contant Number:</label>
                  <input
                      type="text"
                      name="ParentcNum"
                      id="ParentcNum"
                      className="w-full bg-[#3e907f] text-white px-3 py-2 font-[Montserrat] border border-[#254151] m-1 rounded-sm"
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
