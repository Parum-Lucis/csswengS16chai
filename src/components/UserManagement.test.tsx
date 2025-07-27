/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';

jest.mock("../firebase/firebaseConfig", () => ({
  auth: {}, 
}));

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserManagement from "./UserManagement";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { toast } from "react-toastify";

jest.mock("firebase/auth", () => ({
  applyActionCode: jest.fn(() => Promise.resolve()),
  verifyPasswordResetCode: jest.fn(() => Promise.resolve()),
  confirmPasswordReset: jest.fn(() => Promise.resolve()),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    warning: jest.fn(),
  },
}));

const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
};

const renderWithParams = (search = "?mode=resetPassword&oobCode=testCode") => {
  render(
    <MemoryRouter initialEntries={[`/user-management${search}`]}>
      <Routes>
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe("UserManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.log.mockClear();
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
  });

  describe("Password Reset Flow", () => {
    it("renders initial input field and advances to second step on continue", () => {
      renderWithParams();
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
      const continueBtn = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(continueBtn);
      expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    });

    it("shows warning if passwords don't match", async () => {
      renderWithParams();
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "abc123" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "different" } });

      fireEvent.click(screen.getByRole("button", { name: /change password/i }));
      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith("Different passwords inputted");
      });
    });

    it("shows modal after successful password reset", async () => {
      renderWithParams();
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "abc123" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "abc123" } });

      fireEvent.click(screen.getByRole("button", { name: /change password/i }));

      await waitFor(() => {
        expect(confirmPasswordReset).toHaveBeenCalledWith(expect.anything(), "testCode", "abc123");
        expect(toast.success).toHaveBeenCalledWith("Password Change Successful");
        expect(screen.getByText("Password Reset Successful")).toBeInTheDocument();
      });
    });

    it("disables form button after successful submission", async () => {
      renderWithParams();
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "abc123" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "abc123" } });

      const submitButton = screen.getByRole("button", { name: /change password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it("navigates back to login when clicking 'Return to Login Page'", async () => {
      renderWithParams();
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));
      fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "abc123" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "abc123" } });
      fireEvent.click(screen.getByRole("button", { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText("Password Reset Successful")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /return to login page/i }));

      await waitFor(() => {
        expect(screen.getByText("Login Page")).toBeInTheDocument();
      });
    });

    it("navigates to login via back button", () => {
      renderWithParams();
      fireEvent.click(screen.getByText("Back to Login"));
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });
  });

  describe("Email Verification Flow", () => {
    it("handles email verification mode successfully", async () => {
      renderWithParams("?mode=verifyEmail&oobCode=testCode");
      
      await waitFor(() => {
        expect(applyActionCode).toHaveBeenCalledWith({}, "testCode");
        expect(consoleSpy.log).toHaveBeenCalledWith("Email verified successfully!");
      });
    });

    it("handles email verification failure", async () => {
      (applyActionCode as jest.Mock).mockRejectedValueOnce(new Error("Invalid code"));
      
      renderWithParams("?mode=verifyEmail&oobCode=testCode");
      
      await waitFor(() => {
        expect(applyActionCode).toHaveBeenCalledWith({}, "testCode");
        expect(consoleSpy.log).toHaveBeenCalledWith("Error verifying email.");
      });
    });
  });

  describe("Firebase Error Handling", () => {
    it("handles password reset code verification failure", async () => {
      (verifyPasswordResetCode as jest.Mock).mockRejectedValueOnce(new Error("Invalid code"));
      
      renderWithParams();
      
      await waitFor(() => {
        expect(verifyPasswordResetCode).toHaveBeenCalledWith({}, "testCode");
        expect(consoleSpy.log).toHaveBeenCalledWith("Invalid or expired reset code.");
      });
    });

    it("handles password reset confirmation failure", async () => {
      const mockError = {
        code: "auth/weak-password",
        message: "Password is too weak"
      };
      (confirmPasswordReset as jest.Mock).mockRejectedValueOnce(mockError);
      
      renderWithParams();
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));
      fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "weak" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "weak" } });
      
      fireEvent.click(screen.getByRole("button", { name: /change password/i }));
      
      await waitFor(() => {
        expect(confirmPasswordReset).toHaveBeenCalledWith({}, "testCode", "weak");
        expect(consoleSpy.log).toHaveBeenCalledWith("auth/weak-password");
        expect(consoleSpy.log).toHaveBeenCalledWith("Password is too weak");
      });
    });
  });

  describe("URL Parameter Validation", () => {
    it("handles missing mode parameter", () => {
      renderWithParams("?oobCode=testCode");
      expect(consoleSpy.log).toHaveBeenCalledWith("Invalid email action link.");
    });

    it("handles missing oobCode parameter", () => {
      renderWithParams("?mode=resetPassword");
      expect(consoleSpy.log).toHaveBeenCalledWith("Invalid email action link.");
    });

    it("handles both missing mode and oobCode", () => {
      renderWithParams("");
      expect(consoleSpy.log).toHaveBeenCalledWith("Invalid email action link.");
    });

    it("handles unknown mode", async () => {
      renderWithParams("?mode=unknownMode&oobCode=testCode");
      
      await waitFor(() => {
        expect(consoleSpy.log).toHaveBeenCalledWith("Unknown mode.");
      });
    });
  });

  describe("Password Reset Code Verification", () => {
    it("successfully verifies password reset code", async () => {
      renderWithParams();
      
      await waitFor(() => {
        expect(verifyPasswordResetCode).toHaveBeenCalledWith({}, "testCode");
        expect(consoleSpy.log).toHaveBeenCalledWith("Code Verified");
      });
    });
  });

  describe("Component Rendering", () => {
    it("renders the correct heading", () => {
      renderWithParams();
      expect(screen.getByText("Forgot Password")).toBeInTheDocument();
    });

    it("renders logo image", () => {
      renderWithParams();
      expect(screen.getByAltText("Logo")).toBeInTheDocument();
    });

    it("shows continue button initially", () => {
      renderWithParams();
      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    });

    it("shows change password button in step 2", () => {
      renderWithParams();
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));
      expect(screen.getByRole("button", { name: /change password/i })).toBeInTheDocument();
    });
  });
});