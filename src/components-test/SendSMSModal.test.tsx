/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SendSMSModal } from "../components/SendSMSModal";
import { toast } from "react-toastify";
import { Timestamp } from "firebase/firestore";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { UserContext } from "../util/userContext";
import { User } from "firebase/auth";
import { type UserStateType } from "../util/userContext";
import { format, add } from "date-fns";
import { callNotifyGuardiansBySMS, callGetSMSCredits } from "../firebase/cloudFunctions";
import { SMSCreditView } from "../routes/SMSCreditView";

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../firebase/cloudFunctions", () => ({
  callNotifyGuardiansBySMS: jest.fn(),
  callGetSMSCredits: jest.fn(() =>
    Promise.resolve({ data: { success: true, credits: 42 } })
  ),
}));

const mockedCallNotifyGuardiansBySMS = callNotifyGuardiansBySMS as unknown as jest.Mock;

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = jest.fn(function () {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = jest.fn(function () {
    this.open = false;
  });
});

beforeEach(() => {
  mockedCallNotifyGuardiansBySMS.mockClear();
  (toast.success as jest.Mock).mockClear();
  (toast.error as jest.Mock).mockClear();
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn(),
    },
  });
});

const mockEvent = {
  docID: "event-123",
  name: "Health Seminar",
  description: "A seminar on public health.",
  start_date: Timestamp.fromDate(new Date("2025-10-20T10:00:00Z")),
  end_date: Timestamp.fromDate(new Date("2025-10-20T11:00:00Z")),
  location: "Main Auditorium",
};

const mockAttendees = [
  {
    docID: "1",
    beneficiaryID: "b1",
    event_name: "Health Seminar",
    event_start: Timestamp.now(),
    first_name: "Pedro",
    last_name: "Penduko",
    email: "pedro.penduko@example.com",
    contact_number: "+639171234567",
  },
  {
    docID: "2",
    beneficiaryID: "b2",
    event_name: "Health Seminar",
    event_start: Timestamp.now(),
    first_name: "Narda",
    last_name: "Santos",
    email: "narda.santos@example.com",
    contact_number: "+639209876543",
  },
];

const mockAdmin: UserStateType = {
    uid: "test-admin-uid",
    email: "admin@example.com",
    is_admin: true,
} as User & { is_admin: boolean };

const renderSmsModal = () =>
  render(
    <MemoryRouter>
      <UserContext.Provider value={mockAdmin}>
        <SendSMSModal
          event={mockEvent}
          attendees={mockAttendees}
          showModal={true}
          onClose={() => {}}
        />
      </UserContext.Provider>
    </MemoryRouter>
  );

describe("SendSmsModal", () => {
  it("calls notify function and shows success toast on successful SMS sending", async () => {
    mockedCallNotifyGuardiansBySMS.mockResolvedValue({
      data: { status: 200 },
    });

    renderSmsModal();
    const notifyButton = screen.getByRole("button", {
      name: /notify/i,
      hidden: true,
    });
    fireEvent.click(notifyButton);

    await waitFor(() => {
      // The cost is calculated as Math.ceil((184 * 2) / 160) = 3
      expect(toast.success).toHaveBeenCalledWith(
        "Successfully sent notification to beneficiaries! -3 credits"
      );
    });
  });

  it("renders a valid manual 'sms:' link for messaging apps", () => {
    renderSmsModal();
    const smsLink = screen.getByRole("link", { name: /send/i, hidden: true });
    const href = smsLink.getAttribute("href");

    expect(href).toContain("sms:");
    expect(href).toContain("+639171234567,+639209876543;?&");
    expect(href).toContain(encodeURI("This is a reminder to attend the event titled Health Seminar."));
  });

  it("displays the correct phone numbers", () => {
    renderSmsModal();
    const phoneNumbersDetails = screen
      .getByText("Phone numbers")
      .closest("details");
    expect(phoneNumbersDetails).toHaveTextContent(
      "+639171234567,+639209876543"
    );
  });

  it("copies just the phone numbers to the clipboard", async () => {
    renderSmsModal();
    const phoneNumbersDetails = screen.getByText("Phone numbers").closest("details");
    const copyButton = phoneNumbersDetails?.parentElement?.querySelector("button");

    expect(copyButton).toBeInTheDocument();
    fireEvent.click(copyButton!);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "+639171234567,+639209876543"
      );
      expect(toast.success).toHaveBeenCalledWith(
        "successfully copied to clipboard!"
      );
    });
  });

  it("copies just the message body to the clipboard", async () => {
    renderSmsModal();
    const bodyDetails = screen.getByText("Event Details").closest("details");
    const copyButton = bodyDetails?.parentElement?.querySelector("button");

    expect(copyButton).toBeInTheDocument();
    fireEvent.click(copyButton!);

    // dont edit the spacing it ruins the test idk why
    const expectedBody = `This is a reminder to attend the event titled Health Seminar.

It will happen between 10:00 AM and 11:00 AM on October 20, 2025.

About the event: A seminar on public health.`;

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedBody);
      expect(toast.success).toHaveBeenCalledWith(
        "successfully copied to clipboard!"
      );
    });
  });

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