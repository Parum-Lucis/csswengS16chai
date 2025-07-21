/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import EventCard from "./EventCard";

describe("EventCard", () => {
  const baseProps = { date: "Jan 05, 2025", event: "Medical Mission" };

  it("renders the date", () => {
    render(<EventCard {...baseProps} />);
    expect(screen.getByText("Jan 05, 2025")).toBeInTheDocument();
  });

  it("renders the event name", () => {
    render(<EventCard {...baseProps} />);
    expect(screen.getByText("Medical Mission")).toBeInTheDocument();
  });

  it("renders with empty strings without crashing", () => {
    render(<EventCard date="" event="" />);
    expect(screen.getAllByRole("heading").length).toBeGreaterThanOrEqual(2);
  });
});
