/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VolunteerProfileCreation } from "../routes/ProfileCreation";
import { BrowserRouter } from "react-router-dom";
import { callCreateVolunteerProfile } from "../firebase/cloudFunctions";
import React from "react";
import '@testing-library/jest-dom';

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => `mock-uuid-${Math.random()}`,
  },
  configurable: true,
});

jest.mock("../firebase/firebaseConfig", () => ({
  __esModule: true,
  db: {},
  auth: {},
}));

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockedUsedNavigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockedUsedNavigate,
}));

jest.mock("../firebase/cloudFunctions", () => ({
  callCreateVolunteerProfile: jest.fn(),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe("Volunteer Creation Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders all required form fields and create account button", () => {
    renderWithRouter(<VolunteerProfileCreation />);

    expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Birth Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sex/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact No./i)).toBeInTheDocument();
    expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
  });

  test("shows error if fields are empty", async () => {
    renderWithRouter(<VolunteerProfileCreation />);
    fireEvent.click(screen.getByText(/Create Account/i));

    await waitFor(() => {
      expect(require("react-toastify").toast.error).toHaveBeenCalledWith(
        "Please fill up all fields!"
      );
    });
  });

  test("shows error for invalid email", async () => {
    const toast = require("react-toastify").toast;

    renderWithRouter(<VolunteerProfileCreation />);

    fireEvent.change(screen.getByLabelText(/Role/i), {
      target: { value: "Admin" },
    });

    fireEvent.change(screen.getByLabelText(/Birth Date/i), {
      target: { value: "2025-07-04" },
    });

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "wwwww@w" }, // INVALID
    });

    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "Two" },
    });

    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: "Test" },
    });

    fireEvent.change(screen.getByLabelText(/^Sex$/i), {
      target: { value: "Male" },
    });

    fireEvent.change(screen.getByLabelText(/Address/i), {
      target: { value: "Test Address" },
    });

    fireEvent.change(screen.getByLabelText(/Contact No./i), {
      target: { value: "09789067589" },
    });

    fireEvent.click(screen.getByText(/Create Account/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please input a proper email.");
    });
  });

  test("shows error for invalid phone number", async () => {
    renderWithRouter(<VolunteerProfileCreation />);

    fireEvent.change(screen.getByLabelText(/Role/i), {
      target: { value: "Volunteer" },
    });

    fireEvent.change(screen.getByLabelText(/Birth Date/i), {
      target: { value: "2000-01-01" },
    });

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "John" },
    });

    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: "Doe" },
    });

    fireEvent.change(screen.getByLabelText(/Sex/i), {
      target: { value: "Male" },
    });

    fireEvent.change(screen.getByLabelText(/Address/i), {
      target: { value: "123 Street" },
    });

    fireEvent.change(screen.getByLabelText(/Contact No./i), {
      target: { value: "0812345678" }, // invalid
    });

    fireEvent.click(screen.getByText(/Create Account/i));

    await waitFor(() => {
      expect(require("react-toastify").toast.error).toHaveBeenCalledWith(
        "Please input a valid phone number."
      );
    });
  });

  test("submits valid form and calls cloud function", async () => {
    const mockRes = { data: true };
    (callCreateVolunteerProfile as unknown as jest.Mock).mockResolvedValue(mockRes);

    renderWithRouter(<VolunteerProfileCreation />);

    fireEvent.change(screen.getByLabelText(/Role/i), {
      target: { value: "Volunteer" },
    });

    fireEvent.change(screen.getByLabelText(/Birth Date/i), {
      target: { value: "2000-01-01" },
    });

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "John" },
    });

    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: "Doe" },
    });

    fireEvent.change(screen.getByLabelText(/Sex/i), {
      target: { value: "Male" },
    });

    fireEvent.change(screen.getByLabelText(/Address/i), {
      target: { value: "123 Street" },
    });

    fireEvent.change(screen.getByLabelText(/Contact No./i), {
      target: { value: "09123456789" },
    });

    fireEvent.click(screen.getByText(/Create Account/i));

    await waitFor(() => {
      expect(callCreateVolunteerProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "john@example.com",
          first_name: "John",
          last_name: "Doe",
          contact_number: "09123456789",
        })
      );

      expect(require("react-toastify").toast.success).toHaveBeenCalledWith("Success");
      expect(mockedUsedNavigate).toHaveBeenCalledWith(-1);
    });
  });

  test("disables submit button during submission", async () => {
    (callCreateVolunteerProfile as unknown as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: true }), 500))
    );

    renderWithRouter(<VolunteerProfileCreation />);

    fireEvent.change(screen.getByLabelText(/Role/i), {
      target: { value: "Volunteer" },
    });

    fireEvent.change(screen.getByLabelText(/Birth Date/i), {
      target: { value: "2000-01-01" },
    });

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "valid@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "Jane" },
    });

    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: "Smith" },
    });

    fireEvent.change(screen.getByLabelText(/Sex/i), {
      target: { value: "Female" },
    });

    fireEvent.change(screen.getByLabelText(/Address/i), {
      target: { value: "456 Road" },
    });

    fireEvent.change(screen.getByLabelText(/Contact No./i), {
      target: { value: "09121234567" },
    });

    fireEvent.click(screen.getByText(/Create Account/i));
    expect(screen.getByText(/Create Account/i)).toBeDisabled();
  });

  test("re-enables submit button if there is a submission error", async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {}); // prevent log
    (callCreateVolunteerProfile as unknown as jest.Mock).mockRejectedValueOnce(new Error("Simulated error"));

    renderWithRouter(<VolunteerProfileCreation />);

    fireEvent.change(screen.getByLabelText(/Role/i), {
      target: { value: "Volunteer" },
    });

    fireEvent.change(screen.getByLabelText(/Birth Date/i), {
      target: { value: "2000-01-01" },
    });

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "error@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "Error" },
    });

    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: "Case" },
    });

    fireEvent.change(screen.getByLabelText(/Sex/i), {
      target: { value: "Female" },
    });

    fireEvent.change(screen.getByLabelText(/Address/i), {
      target: { value: "789 Lane" },
    });

    fireEvent.change(screen.getByLabelText(/Contact No./i), {
      target: { value: "09129876543" },
    });

    fireEvent.click(screen.getByText(/Create Account/i));

    await waitFor(() => {
      expect(screen.getByText(/Create Account/i)).not.toBeDisabled();
    });
  });
});
