/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AttendeesCard from "./AttendeesCard";

describe("AttendeesCard", () => {
  const defaultProps = {
    name: "Juan Dela Cruz",
    who_attended: "Parent",
    attendance: true, 
    handleToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the who_attended pill text", () => {
    render(<AttendeesCard {...defaultProps} />);
    expect(screen.getByText("Parent")).toBeInTheDocument();
  });

  it("renders the attendee name", () => {
    render(<AttendeesCard {...defaultProps} />);
    expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
  });

  it("calls handleToggle when checkbox is clicked", async () => {
    const user = userEvent.setup();
    render(<AttendeesCard {...defaultProps} />);
    const checkbox = screen.getByRole("checkbox"); 
    await user.click(checkbox);
    expect(defaultProps.handleToggle).toHaveBeenCalledTimes(1);
  });
});
