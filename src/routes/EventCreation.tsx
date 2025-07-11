import type { Event } from "@models/eventType";
import type { AttendedEvents } from "@models/attendedEventsType";

import React from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import {collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "../firebase/firebaseConfig"

export function EventCreation() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    // check if all form input is non-empty
    for (const [, value] of formData.entries()) {
      if (!(value.toString().trim())) {
        // cancel submission when a field is empty
        toast.error("Please fill up all fields!");
        return;
      }
    }

    // handle start date-time
    const date = new Date(formData.get("date") as string);
    const start_time = formData.get("time") as string;
    let [hours, minutes] = start_time.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
    const start_timestamp = Timestamp.fromDate(date);

    // handle end date-time
    const end_time = formData.get("time") as string; // TODO: change
    [hours, minutes] = end_time.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
    const end_timestamp = Timestamp.fromDate(date);

    // create object and trim whitespaces
    // note: create attendees subcollection when we're actually adding attendees na 
    const newEvent: Omit<Event, "attendees"> = {
      event_name: (formData.get("eventName") as string).trim(),
      description: (formData.get("description") as string).trim(),
      start_date: start_timestamp, 
      end_date: end_timestamp,
      location: (formData.get("location") as string).trim(),
    };

    // add to database
    addDoc(collection(db, "events"), newEvent)
      .then(() => {
        toast.success("Event created successfully!");
        navigate("/view-admin");
      })
      .catch((error) => {
        toast.error("Failed to create event: " + error.message);
      });
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
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="text-white font-[Montserrat] font-semibold">
              Description
            </label>
            <div className="relative">
                <textarea
                id="description"
                name="description"
                rows={3}
                className="input-text w-full pr-16"
                required
                maxLength={255}
                onInput={e => {
                  const counter = document.getElementById("desc-count");
                  if (counter) counter.textContent = `${(e.target as HTMLTextAreaElement).value.length}/255`;
                }}
                ></textarea>
              <span id="desc-count" className="absolute bottom-2 right-3 text-xs text-white pointer-events-none">
                0/255
              </span>
            </div>
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
              required
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
              required
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
              required
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