/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { UserContext } from "../util/userContext";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { EventPage } from "./EventPage";
import type { User } from "firebase/auth";

jest.mock("firebase/firestore", () => ({
  ...jest.requireActual("firebase/firestore"),
  collection: jest.fn((db, ...pathSegments) => ({
    path: pathSegments.join('/'),
  })),
  getDocs: jest.fn(),
  doc: jest.fn((db, ...pathSegments) => ({
    path: pathSegments.join('/'),
    id: pathSegments[pathSegments.length - 1],
  })),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  Timestamp: {
    fromDate: (date: Date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1e6,
      toDate: () => date,
    }),
  },
}));

jest.mock("../firebase/firebaseConfig", () => ({
  db: {},
  auth: {},
}));

const mockedNavigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockedNavigate,
  useParams: () => ({ docId: 'test-event-id' }),
}));

jest.mock("react-toastify", () => ({
  ...jest.requireActual("react-toastify"),
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUser: User & { is_admin: boolean } = {
    uid: "test-user-id",
    email: "test@example.com",
    emailVerified: true,
    is_admin: false,
    isAnonymous: false,
    metadata: {} as any, // cast to any to avoid providing all metadata fields
    providerData: [],
    refreshToken: "test-refresh-token",
    tenantId: null,
    delete: jest.fn(),
    getIdToken: jest.fn(),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn(),
    displayName: "Test User",
    phoneNumber: null,
    photoURL: null,
    providerId: "password",
};

const mockEvent = {
  name: "Community Cleanup",
  description: "Annual cleanup event.",
  start_date: Timestamp.fromDate(new Date("2025-08-01T09:00:00Z")),
  end_date: Timestamp.fromDate(new Date("2025-08-01T12:00:00Z")),
  location: "City Park",
};

const mockAttendees = [
  { docID: 'attendee-1', beneficiaryID: 'bene-1', first_name: 'John', last_name: 'Doe', who_attended: 'Beneficiary', attendance: false },
];

const mockBeneficiaries = [
  { docID: 'bene-1', first_name: 'John', last_name: 'Doe' },
  { docID: 'bene-2', first_name: 'Jane', last_name: 'Smith' },
];

const renderEventPage = () => {
  return render(
    <MemoryRouter initialEntries={['/view-event/test-event-id']}>
      <UserContext.Provider value={mockUser}>
        <Routes>
          <Route path="/view-event/:docId" element={<EventPage />} />
        </Routes>
        <ToastContainer />
      </UserContext.Provider>
    </MemoryRouter>
  );
};

describe("Attendance Checking", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockEvent,
      id: 'test-event-id',
    });

    (getDocs as jest.Mock).mockImplementation((query: any) => {
      const path = query.path;
      if (path === "events/test-event-id/attendees") {
        const docs = mockAttendees.map(att => ({ data: () => att, id: att.docID }));
        return Promise.resolve({
          empty: docs.length === 0,
          docs: docs,
          forEach: (callback: (doc: any) => void) => docs.forEach(callback),
        });
      }
      if (path === "beneficiaries") {
        const docs = mockBeneficiaries.map(bene => ({ data: () => bene, id: bene.docID }));
        return Promise.resolve({
          empty: docs.length === 0,
          docs: docs,
          forEach: (callback: (doc: any) => void) => docs.forEach(callback),
        });
      }
      return Promise.resolve({ empty: true, docs: [], forEach: () => {} });
    });
  });

  test("adds a new attendee to the event", async () => {
    renderEventPage();

    await waitFor(() => {
      expect(screen.getByText("Community Cleanup")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => {
      // Jane Smith is not an attendee yet
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/jane smith/i));
    fireEvent.click(screen.getByRole("button", { name: /update list/i }));

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Success!");
    });
  });

  test("removes an attendee from the event", async () => {
    renderEventPage();

    await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const checkboxes = await screen.findAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // Click the first checkbox for removal

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));

    await waitFor(() => {
        expect(deleteDoc).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith("Success!");
    });
  });

  test("shows a message when no beneficiaries are available to add", async () => {
    // mock so all beneficiaries are already attendees
    (getDocs as jest.Mock).mockImplementation((query: any) => {
        const path = query.path;
        if (path === "events/test-event-id/attendees") {
          const docs = mockBeneficiaries.map(b => ({ data: () => ({...b, beneficiaryID: b.docID}), id: b.docID }));
          return Promise.resolve({
            empty: docs.length === 0,
            docs: docs,
            forEach: (callback: (doc: any) => void) => docs.forEach(callback),
          });
        }
        if (path === "beneficiaries") {
          const docs = mockBeneficiaries.map(bene => ({ data: () => bene, id: bene.docID }));
          return Promise.resolve({
            empty: docs.length === 0,
            docs: docs,
            forEach: (callback: (doc: any) => void) => docs.forEach(callback),
          });
        }
        return Promise.resolve({ empty: true, docs: [], forEach: () => {} });
      });

    renderEventPage();
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText("No beneficiaries to show")).toBeInTheDocument();
    });
  });

  test("shows a message when trying to add/remove with no selections", async () => {
    renderEventPage();
    await waitFor(() => {
      expect(screen.getByText("Community Cleanup")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /update list/i }));
    });
    await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Nothing to update");
    });

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Nothing to update");
    });
  });
});