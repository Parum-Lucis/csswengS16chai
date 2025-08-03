/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import AttendeesCard from "../components/AttendeesCard";
import { MemoryRouter } from "react-router-dom";

describe("AttendeesCard", () => {
  const defaultProps = {
    index: 0,
    name: "John Doe",
    who_attended: "Beneficiary",
    attendance: true,
    editChecklist: [true],
    setEditChecklist: jest.fn(),
    isEditing: false,
    docID: "test-doc-id",
  };

  it("renders the name", () => {
    render(
      <MemoryRouter>
        <AttendeesCard {...defaultProps} />
      </MemoryRouter>
    );
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders the role", () => {
    render(
      <MemoryRouter>
        <AttendeesCard {...defaultProps} />
      </MemoryRouter>
    );
    expect(screen.getByText("Beneficiary")).toBeInTheDocument();
  });

  it("checkbox is checked when isPresent is true", () => {
    const props = {
      ...defaultProps,
      isEditing: true,
    };
    render(
      <MemoryRouter>
        <AttendeesCard {...props} />
      </MemoryRouter>
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("checkbox is not checked when isPresent is false", () => {
    const props = {
      ...defaultProps,
      attendance: false,
      isEditing: true,
      editChecklist: [false],
    };
    render(
      <MemoryRouter>
        <AttendeesCard {...props} />
      </MemoryRouter>
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });
});