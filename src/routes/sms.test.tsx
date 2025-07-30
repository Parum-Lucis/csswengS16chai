/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SendSMSModal } from "../components/SendSMSModal";
import { SMSCreditView } from "./SMSCreditView";
import { toast } from "react-toastify";
import { Timestamp } from "firebase/firestore";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

// Mock toast
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock cloud functions
jest.mock("../firebase/cloudFunctions", () => ({
  callNotifyGuardiansBySMS: jest.fn(() =>
    Promise.resolve({ data: { status: 200 } })
  ),
  callGetSMSCredits: jest.fn(() =>
    Promise.resolve({ data: { success: true, credits: 42 } })
  ),
}));

// Show modal and force it to be visible
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = jest.fn(function () {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = jest.fn(function () {
    this.open = false;
  });
});

// Global clipboard mock
beforeEach(() => {
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn(),
    },
  });
});

const mockEvent = {
  name: "Sample Event",
  description: "An example description",
  start_date: Timestamp.fromDate(new Date("2025-08-01T10:00:00Z")),
  end_date: Timestamp.fromDate(new Date("2025-08-01T12:00:00Z")),
  location: "DLSU",
};

const mockAttendees = [
  {
    docID: "1",
    beneficiaryID: "b1",
    event_name: "Sample Event",
    event_start: Timestamp.now(),
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    contact_number: "09171234567",
  },
  {
    docID: "2",
    beneficiaryID: "b2",
    event_name: "Sample Event",
    event_start: Timestamp.now(),
    first_name: "Jane",
    last_name: "Smith",
    email: "jane@example.com",
    contact_number: "09181234567",
  },
];

const renderSMSModal = () =>
  render(
    <MemoryRouter>
      <SendSMSModal
        event={mockEvent}
        attendees={mockAttendees}
        showModal={true}
        onClose={() => {}}
      />
    </MemoryRouter>
  );

describe("SendSMSModal", () => {
  it("calls notify function and shows success toast", async () => {
    renderSMSModal();
    const notifyButton = screen.getByRole("button", {
      name: /notify/i,
      hidden: true,
    });
    fireEvent.click(notifyButton);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Successfully sent notifcation to beneficiaries! -3 credits"
      )
    );
  });

  it("renders sms: link with phone numbers and encoded message", () => {
    renderSMSModal();
    const smsLink = screen.getByRole("link", { name: /send/i, hidden: true });
    expect(smsLink).toHaveAttribute("href");
    expect(smsLink.getAttribute("href")).toMatch(/^sms:/);
  });

  it("copies phone numbers to clipboard", async () => {
    renderSMSModal();

    const phoneNumbersDetails = screen.getByText('Phone numbers').closest('details');
    expect(phoneNumbersDetails).toBeTruthy();
   
    const parentDiv = phoneNumbersDetails?.parentElement;
    const phoneCopyBtn = parentDiv?.querySelector('button');
    
    expect(phoneCopyBtn).toBeTruthy();
    fireEvent.click(phoneCopyBtn!);

    await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "09171234567,09181234567"
        );
        expect(toast.success).toHaveBeenCalledWith(
        "successfully copied to clipboard!"
        );
    });
  });

  it("copies event details to clipboard", async () => {
    renderSMSModal();

    const eventDetailsText = screen.getByText('Event Details');
    const eventSection = eventDetailsText.closest('div');
    const eventCopyBtn = eventSection?.querySelector('button');
    
    expect(eventCopyBtn).toBeTruthy();
    fireEvent.click(eventCopyBtn!);

    await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
        "successfully copied to clipboard!"
        );
    });
  });
});

describe("SMSCreditView", () => {
  it("renders SMS credits correctly", async () => {
    render(
      <MemoryRouter>
        <SMSCreditView />
      </MemoryRouter>
    );

    expect(screen.getByText(/credits left/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });
});
