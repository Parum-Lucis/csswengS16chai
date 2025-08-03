/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EventCard from "../components/EventCalendarCard"; 

describe("EventCalendarCard", () => {
  const baseProps = {
    uid: "event123",
    date: "Jan 05 2025",
    event: "Medical Mission",
    time: "9",
  };

  it("renders the event name", () => {
    render(<EventCard {...baseProps} />, { wrapper: MemoryRouter });
    expect(screen.getByText("Medical Mission")).toBeInTheDocument();
  });

  it("formats the date as 'Mon DD, YYYY'", () => {
    render(<EventCard {...baseProps} />, { wrapper: MemoryRouter });
    expect(screen.getByText("Jan 05, 2025")).toBeInTheDocument();
  });

  it("pads the time string to 2 characters", () => {
    render(<EventCard {...baseProps} />, { wrapper: MemoryRouter });
    expect(screen.getByText("09")).toBeInTheDocument();
  });

  it("shows time unchanged when already 2+ chars", () => {
    render(<EventCard {...baseProps} time="14" />, { wrapper: MemoryRouter });
    expect(screen.getByText("14")).toBeInTheDocument();
  });

  it("handles a minimally malformed date string (defensive)", () => {
    render(<EventCard {...baseProps} date="Foo" />, { wrapper: MemoryRouter });
    expect(screen.getByText("Foo undefined, undefined")).toBeInTheDocument();
  });

  it("renders gracefully with empty props", () => {
    render(<EventCard uid="" date="" event="" time="" />, { wrapper: MemoryRouter });
    expect(screen.getByText(/undefined/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("renders non-numeric time without crashing", () => {
    render(<EventCard {...baseProps} time="abc" />, { wrapper: MemoryRouter });
    expect(screen.getByText("abc")).toBeInTheDocument();
  });

  it("handles completely invalid date without crashing", () => {
    render(<EventCard {...baseProps} date="NotADate" />, { wrapper: MemoryRouter });
    expect(screen.getByText("NotADate undefined, undefined")).toBeInTheDocument();
  });
});
