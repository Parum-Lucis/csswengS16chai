/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SendEmailModal } from "../components/SendEmailModal";
import { toast } from "react-toastify";
import { Timestamp } from "firebase/firestore";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { UserContext } from "../util/userContext";
import { User } from "firebase/auth";
import { type UserStateType } from "../util/userContext";

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../firebase/cloudFunctions", () => ({
  sendEmailReminder: jest.fn(() => Promise.resolve({ data: true })),
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = jest.fn(function () {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = jest.fn(function () {
    this.open = false;
  });
});

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn(),
    },
  });
});

const mockEvent = {
  name: "Community Outreach",
  description: "A community outreach program.",
  start_date: Timestamp.fromDate(new Date("2025-09-15T09:00:00Z")),
  end_date: Timestamp.fromDate(new Date("2025-09-15T12:00:00Z")),
  location: "Community Hall",
};

const mockAttendees = [
  {
    docID: "1",
    beneficiaryID: "b1",
    event_name: "Community Outreach",
    event_start: Timestamp.now(),
    first_name: "Juan",
    last_name: "Dela Cruz",
    email: "juan.delacruz@example.com",
    contact_number: "09123456789",
  },
  {
    docID: "2",
    beneficiaryID: "b2",
    event_name: "Community Outreach",
    event_start: Timestamp.now(),
    first_name: "Maria",
    last_name: "Santos",
    email: "maria.santos@example.com",
    contact_number: "09987654321",
  },
];

const mockAdmin: UserStateType = {
    uid: "test-admin-uid",
    email: "admin@example.com",
    is_admin: true,
} as User & { is_admin: boolean };

const renderEmailModal = () =>
  render(
    <MemoryRouter>
      <UserContext.Provider value={mockAdmin}>
        <SendEmailModal
          event={mockEvent}
          attendees={mockAttendees}
          showModal={true}
          onClose={() => {}}
        />
      </UserContext.Provider>
    </MemoryRouter>
  );

describe("SendEmailModal", () => {
  it("calls notify function and shows success toast on successful email sending", async () => {
    renderEmailModal();
    const notifyButton = screen.getByRole("button", {
      name: /notify/i,
      hidden: true,
    });
    fireEvent.click(notifyButton);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Successfully sent email notification to beneficiaries!"
      )
    );
  });

  it("renders mailto link with correct email addresses, subject, and body", () => {
    renderEmailModal();
    const mailtoLink = screen.getByRole("link", { 
        name: /send/i,
        hidden: true
    });
    expect(mailtoLink).toHaveAttribute("href");
    const href = mailtoLink.getAttribute("href");
    const expectedEmails = encodeURIComponent(
       "juan.delacruz@example.com,maria.santos@example.com"
    );
    expect(href).toContain(expectedEmails);
    expect(href).toContain("subject=Reminder%3A%20Community%20Outreach");
    const expectedBody = `This is a reminder to attend the event titled ${mockEvent.name}.`;
    const expectedDescription = `About the event: ${mockEvent.description}`;
    expect(href).toContain(encodeURIComponent(expectedBody));
    expect(href).toContain(encodeURIComponent(expectedDescription));
  });

  it("copies email addresses to clipboard when copy button is clicked", async () => {
    renderEmailModal();
    const emailDetails = screen.getByText("Email Addresses").closest("details");
    const copyButton = emailDetails?.parentElement?.querySelector("button");
    if (copyButton) {
      fireEvent.click(copyButton);
    }
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "juan.delacruz@example.com,maria.santos@example.com"
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Successfully copied to clipboard!"
      );
    });
  });

  it("copies email subject to clipboard when copy button is clicked", async () => {
    renderEmailModal();

    const subjectDetails = screen.getByText("Email Subject").closest("details");
    const copyButton = subjectDetails?.parentElement?.querySelector("button");

    if (copyButton) {
      fireEvent.click(copyButton);
    }

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "Reminder: Community Outreach"
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Successfully copied to clipboard!"
      );
    });
  });

  it("copies email body to clipboard when copy button is clicked", async () => {
    renderEmailModal();
    const bodyDetails = screen.getByText("Email Body").closest("details");
    const copyButton = bodyDetails?.parentElement?.querySelector("button");
    if (copyButton) {
      fireEvent.click(copyButton);
    }
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        "Successfully copied to clipboard!"
      );
    });
  });
});