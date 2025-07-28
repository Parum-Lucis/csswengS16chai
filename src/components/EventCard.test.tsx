/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import EventCard from "./EventCard";

describe("EventCard", () => {
  const baseProps = {
    date: Timestamp.fromDate(new Date("2025-01-05")),
    name: "Medical Mission",
  };

  it("renders the date", () => {
    render(<EventCard {...baseProps} />);
    expect(
      screen.getByText((content) => content.includes("00") && content.includes("5") && content.includes("2025"))
    ).toBeInTheDocument();
  });

  it("renders the event name", () => {
    render(<EventCard {...baseProps} />);
    expect(screen.getByText("Medical Mission")).toBeInTheDocument();
  });

  it("renders with empty strings without crashing", () => {
    const emptyDate = Timestamp.fromDate(new Date(0));
    render(<EventCard date={emptyDate} name="" />);
    expect(screen.getAllByRole("heading").length).toBeGreaterThanOrEqual(1);
  });
});