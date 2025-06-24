import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import React from "react";

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

    const emailRegEx = new RegExp(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g);
    if (!err) {
      if (!emailRegEx.test(formData.get("email") as string)) {
        toast.error("Please input a proper email.");
      } else if (
        (formData.get("cNum") as string).length != 11 ||
        formData.get("cNum")?.slice(0, 2) != "09"
      ) {
        toast.error(
          "Please input a valid phone number." +
            formData.get("cNum")?.toString.length
        );
      } else {
        console.log("im here");
        toast.success("Success!");
        navigate("/ProfileDetails");
        // more stuff
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
                <label htmlFor="username" className="text-white font-[Montserrat] font-semibold">
                  Username
                </label>
                <input
                    id="username"
                    name="username"
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

export function BeneficiaryProfileCreation() {
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
      } else if (
        (formData.get("cNum") as string).length != 11 ||
        formData.get("cNum")?.slice(0, 2) != "09"
      ) {
        toast.error(
          "Please input a valid phone number." +
            formData.get("cNum")?.toString.length
        );
      } else {
        console.log("im here");
        toast.success("Success!");
        navigate("/ProfileDetails");
        // more stuff
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
                <label htmlFor="username" className="text-white font-[Montserrat] font-semibold">
                  Username
                </label>
                <input
                    id="username"
                    name="username"
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
