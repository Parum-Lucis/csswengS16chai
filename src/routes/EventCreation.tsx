import React from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

export function EventCreation() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-secondary">
      <div className="relative w-full max-w-2xl flex flex-col items-center rounded-[5px] sm:p-6">
        <div className="flex w-full bg-[#45B29D] rounded-[5px] p-4 pt-5">
          <form className="flex flex-col w-full space-y-3" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="eventName" className="text-white font-[Montserrat] font-semibold">
                Event Name
              </label>
              <input
                id="eventName"
                name="eventName"
                type="text"
                className="input-text w-full"
              />
            </div>
            <div>
              <label htmlFor="description" className="text-white font-[Montserrat] font-semibold">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="input-text w-full"
              ></textarea>
            </div>
            <div>
              <label htmlFor="date" className="text-white font-[Montserrat] font-semibold">
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                className="input-text w-full"
              />
            </div>
            <div>
              <label htmlFor="time" className="text-white font-[Montserrat] font-semibold">
                Time
              </label>
              <input
                id="time"
                name="time"
                type="time"
                className="input-text w-full"
              />
            </div>
            <div>
              <label htmlFor="location" className="text-white font-[Montserrat] font-semibold">
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                className="input-text w-full"
              />
            </div>
            <button
              type="submit"
              className="bg-secondary text-white mt-4 p-2 rounded-[5px] font-semibold"
            >
              Create Event
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EventCreation;