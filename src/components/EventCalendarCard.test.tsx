/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import EventCalendarCard from "./EventCalendarCard"; 

describe("EventCalendarCard", () => {
  const baseProps = {
    date: "Jan 05 2025",
    event: "Medical Mission",
    time: "9", 
  };

  it("renders the event name", () => {
    render(<EventCalendarCard {...baseProps} />);
    expect(screen.getByText("Medical Mission")).toBeInTheDocument();
  });

  it("formats the date as 'Mon DD, YYYY'", () => {
    render(<EventCalendarCard {...baseProps} />);
    expect(screen.getByText("Jan 05, 2025")).toBeInTheDocument();
  });

  it("pads the time string to 2 characters", () => {
    render(<EventCalendarCard {...baseProps} />);
    expect(screen.getByText("09")).toBeInTheDocument();
  });

  it("shows time unchanged when already 2+ chars", () => {
    render(<EventCalendarCard {...baseProps} time="14" />);
    expect(screen.getByText("14")).toBeInTheDocument();
  });

  it("handles a minimally malformed date string (defensive)", () => {
    render(<EventCalendarCard {...baseProps} date="Foo" />);
    expect(screen.getByText("Foo undefined, undefined")).toBeInTheDocument();
  });

  it("renders gracefully with empty props", () => {
    render(<EventCalendarCard date="" event="" time="" />);
    expect(screen.getByText(/undefined/)).toBeInTheDocument(); 
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("renders non-numeric time without crashing", () => {
    render(<EventCalendarCard {...baseProps} time="abc" />);
    expect(screen.getByText("abc")).toBeInTheDocument();
  });

  it("handles completely invalid date without crashing", () => {
    render(<EventCalendarCard {...baseProps} date="NotADate" />);
    expect(screen.getByText("NotADate undefined, undefined")).toBeInTheDocument();
  });
});
