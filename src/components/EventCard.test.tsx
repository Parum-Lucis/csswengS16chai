/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import EventCard from "./EventCard";
import type { AttendedEvents } from "@models/attendedEventsType";
import { MemoryRouter } from "react-router-dom";

describe("EventCard", () => {
  const baseProps: AttendedEvents = {
    docID: "test-id",
    beneficiaryID: "beneficiary-id",
    event_name: "Medical Mission",
    event_start: Timestamp.fromDate(new Date("2025-01-05T12:00:00Z")),
    first_name: "Juan",
    last_name: "Dela Cruz",
    email: "juandelacruz@example.com",
    contact_number: "09123456789",
    attended: true,
    who_attended: "Beneficiary"
  };

  it("renders the date", () => {
    render(
      <MemoryRouter>
        <EventCard attEvent={baseProps} />
      </MemoryRouter>
    );
    expect(
      screen.getByText((content) => content.includes("01/05/25"))
    ).toBeInTheDocument();
  });

  it("renders the event name", () => {
    render(
      <MemoryRouter>
        <EventCard attEvent={baseProps} />
      </MemoryRouter>
    );
    expect(screen.getByText("Medical Mission")).toBeInTheDocument();
  });

  it("renders with empty strings without crashing", () => {
    const emptyProps: AttendedEvents = {
      ...baseProps,
      event_name: "",
    };
    render(
      <MemoryRouter>
        <EventCard attEvent={emptyProps} />
      </MemoryRouter>
    );

    expect(screen.getByText(/date/i)).toBeInTheDocument();
  });
});