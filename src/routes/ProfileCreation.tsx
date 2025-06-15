import { toast } from "react-toastify";
import { useNavigate } from "react-router";
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
    <div className="flex items-center justify-center h-screen p-5">
      <div className="relative flex items-end justify-center pl-3 pr-3 pt-24 h-auto bg-[#254151] rounded-[5px] p-3">
        <div className="z-1 overflow-hidden bg-gray-500 w-[9rem] h-[9rem] absolute top-[4%] border-5 border-[#45B29D] rounded-full">
          <i className="relative right-0.5 bottom-6 text-[9rem] text-gray-300 fi fi-ss-circle-user"></i>
        </div>
        <div className="flex bg-[#45B29D] rounded-[5px] p-2 pt-20">
          <form className="flex flex-col" onSubmit={submitDetails}>
            <label
              htmlFor="dropdown"
              className="text-white font-[Montserrat] font-semibold "
            >
              Role
            </label>
            <select
              name="dropdown"
              className="rounded-[5px] appearance-none p-1.5 dark:text-white font-[Montserrat] border-solid border-3 border-[#254151]"
            >
              <option value="Admin">Admin</option>
              <option value="Volunteer">Volunteer</option>
              <option value="Student">Student</option>
              <option value="Waitlist">Waitlist</option>
            </select>
            <label
              htmlFor="username"
              className="text-white font-[Montserrat] font-semibold"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="input-text"
            />
            <label
              htmlFor="email"
              className="text-white font-[Montserrat] font-semibold"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input-text"
            />
            <div className="flex flex-row justify-between gap-2">
              <div className="flex flex-col">
                <label
                  htmlFor="fName"
                  className="text-white flex flex-col font-[Montserrat] font-semibold"
                >
                  First Name
                </label>
                <input
                  id="fName"
                  name="fName"
                  type="text"
                  className="input-text"
                />
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="lName"
                  className="text-white font-[Montserrat] font-semibold"
                >
                  Last Name
                </label>
                <input
                  id="lName"
                  name="lName"
                  type="text"
                  className="input-text"
                />
              </div>
            </div>
            <label
              htmlFor="address"
              className="text-white font-[Montserrat] font-semibold"
            >
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              className="input-text"
            />
            <label
              htmlFor="cNum"
              className="text-white font-[Montserrat] font-semibold"
            >
              Contact No.
            </label>
            <input id="cNum" name="cNum" type="number" className="input-text" />
            <button
              type="submit"
              className=" bg-[#254151] text-white mt-7 p-1.5 rounded-[5px] font-semibold"
            >
              {" "}
              Create Account{" "}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfileCreation;
