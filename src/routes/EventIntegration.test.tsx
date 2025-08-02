/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { UserContext } from '../util/userContext';
import type { User } from "firebase/auth";
import { add } from "date-fns";
import { EventCreation } from "./EventCreation";
import EventList from "./EventList";
import { EventPage } from "./EventPage";
import { Calendar } from "./Calendar";

if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function() {
    this.setAttribute('open', '');
  };
}
if (typeof HTMLDialogElement.prototype.close !== 'function') {
  HTMLDialogElement.prototype.close = function() {
    this.removeAttribute('open');
  };
}

interface MockEventData {
  name: string;
  description: string;
  start_date: { toDate: () => Date; toMillis: () => number };
  end_date: { toDate: () => Date; toMillis: () => number };
  location: string;
  time_to_live?: { toDate: () => Date };
}

interface MockAttendeeData {
    beneficiaryID: string;
    first_name: string;
    last_name: string;
    attended: boolean;
    who_attended: string;
}

let eventDocs: Array<{ id: string; data: () => MockEventData; }> = [];
let attendeeDocs: Array<{ id: string; data: () => MockAttendeeData; }> = [];

jest.mock("firebase/firestore", () => {
    const originalModule = jest.requireActual("firebase/firestore");

    // A type-safe mock Timestamp class that mimics the real one
    class MockTimestamp {
        private date: Date;
        seconds: number;
        nanoseconds: number;

        constructor(seconds: number, nanoseconds: number = 0) {
            this.seconds = seconds;
            this.nanoseconds = nanoseconds;
            this.date = new Date(seconds * 1000 + nanoseconds / 1e6);
        }
        toDate(): Date { return this.date; }
        toMillis(): number { return this.date.getTime(); }
        static fromDate(date: Date): MockTimestamp {
            const seconds = Math.floor(date.getTime() / 1000);
            const nanoseconds = (date.getTime() % 1000) * 1e6;
            return new MockTimestamp(seconds, nanoseconds);
        }
    }

    // This is the complete mock object for all firestore functions
    return {
        ...originalModule,
        Timestamp: MockTimestamp,
        collection: jest.fn((_db, path, ...segments) => ({
            path: [path, ...segments].join('/'),
            withConverter: function() { return this; },
        })),
        doc: jest.fn((_db, path, id) => ({ path: `${path}/${id}`, id })),
        addDoc: jest.fn(async (collectionRef, data) => {
            const newId = `new-id-${Date.now()}`;
            const newEvent = {
                id: newId,
                data: () => ({ ...data, docID: newId }),
            };
            if (collectionRef.path === "events") {
                eventDocs.push(newEvent as any);
            }
            return Promise.resolve({ id: newId });
        }),
        getDocs: jest.fn(async (query) => {
            const dataSet = query.path.includes("attendees") ? attendeeDocs : eventDocs;
            return {
                docs: dataSet,
                empty: dataSet.length === 0,
                forEach: (callback: (doc: any) => void) => dataSet.forEach(callback),
            };
        }),
        getDoc: jest.fn(async (docRef) => {
            const doc = eventDocs.find(d => d.id === docRef.id);
            if (doc) {
                return {
                    exists: (): boolean => true,
                    id: doc.id,
                    data: doc.data,
                };
            }
            return {
                exists: (): boolean => false,
                data: (): undefined => undefined,
            };
        }),
        updateDoc: jest.fn(async (docRef, data) => {
            const eventIndex = eventDocs.findIndex(d => d.id === docRef.id);
            if (eventIndex > -1) {
                const currentData = eventDocs[eventIndex].data();
                eventDocs[eventIndex] = { ...eventDocs[eventIndex], data: () => ({ ...currentData, ...data }) };
            }
            return Promise.resolve();
        }),
        query: jest.fn((collectionRef, ..._constraints) => collectionRef),
        where: jest.fn(),
        deleteDoc: jest.fn(() => Promise.resolve()),
    };
});

jest.mock("../firebase/firebaseConfig", () => ({
  auth: {},
  db: {},
  func: {},
}));

const mockedNavigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockedNavigate,
}));

const mockUser = {
  uid: "test-admin-uid",
  email: "admin@example.com",
  is_admin: true,
} as User & { is_admin: boolean };


describe("Event Integration Tests", () => {
  const { addDoc, updateDoc, getDocs } = require("firebase/firestore");

  beforeEach(() => {
    jest.clearAllMocks();
    eventDocs = [
        {
          id: "1",
          data: (): MockEventData => ({
            name: "Medical Mission",
            description: "Annual medical mission for the community.",
            start_date: { toDate: () => new Date("2025-12-25T09:00:00Z"), toMillis: () => new Date("2025-12-25T09:00:00Z").getTime() },
            end_date: { toDate: () => new Date("2025-12-25T17:00:00Z"), toMillis: () => new Date("2025-12-25T17:00:00Z").getTime() },
            location: "Community Center",
          }),
        },
        {
          id: "2",
          data: (): MockEventData => ({
            name: "Christmas Party",
            description: "Annual Christmas party for the kids.",
            start_date: { toDate: () => new Date("2025-12-20T13:00:00Z"), toMillis: () => new Date("2025-12-20T13:00:00Z").getTime() },
            end_date: { toDate: () => new Date("2025-12-20T17:00:00Z"), toMillis: () => new Date("2025-12-20T17:00:00Z").getTime() },
            location: "CHAI Youth Center",
          }),
        },
    ];
    attendeeDocs = [
        { id: 'att1', data: (): MockAttendeeData => ({ beneficiaryID: 'b1', first_name: 'John', last_name: 'Doe', attended: true, who_attended: "Beneficiary" }) },
        { id: 'att2', data: (): MockAttendeeData => ({ beneficiaryID: 'b2', first_name: 'Jane', last_name: 'Smith', attended: false, who_attended: "None" }) },
    ];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("creates an event and displays it in the list", async () => {
    const { unmount } = render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter initialEntries={["/create-event"]}>
          <Routes>
            <Route path="/create-event" element={<EventCreation />} />
            <Route path="/admin" element={<EventList />} />
          </Routes>
          <ToastContainer />
        </MemoryRouter>
      </UserContext.Provider>
    );

    fireEvent.change(screen.getByLabelText(/event name/i), { target: { value: "New Year's Gala" } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "A fun night to welcome the new year" } });
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: "2025-12-31" } });
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: "19:00" } });
    fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: "23:59" } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: "Grand Ballroom" } });
    fireEvent.click(screen.getByRole("button", { name: /create event/i }));

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith("/admin");
    });

    unmount();

    render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter initialEntries={["/admin"]}>
            <EventList />
        </MemoryRouter>
      </UserContext.Provider>
    );

    expect(await screen.findByText("New Year's Gala")).toBeInTheDocument();
    expect(screen.getByText("Medical Mission")).toBeInTheDocument();
  });

  test("updates an event's details", async () => {
    render(
        <UserContext.Provider value={mockUser}>
          <MemoryRouter initialEntries={["/event/1"]}>
            <Routes>
              <Route path="/event/:docId" element={<EventPage />} />
            </Routes>
            <ToastContainer />
          </MemoryRouter>
        </UserContext.Provider>
    );

    await screen.findByDisplayValue("Annual medical mission for the community.");
    
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Updated Description" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ description: "Updated Description" })
      );
    });
  });

  test("deletes an event", async() => {
    const MOCK_DATE = new Date();
    jest.setSystemTime(MOCK_DATE);

    render(
        <UserContext.Provider value={mockUser}>
          <MemoryRouter initialEntries={["/event/1"]}>
            <Routes>
              <Route path="/event/:docId" element={<EventPage />} />
              <Route path="/event" element={<div>Event Page</div>} />
            </Routes>
            <ToastContainer />
          </MemoryRouter>
        </UserContext.Provider>
    );

    await screen.findByText("Medical Mission");
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await screen.findByText("Confirm Deletion");
    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() => {
        expect(updateDoc).toHaveBeenCalled();
        const mockUpdateDocCall = (updateDoc as jest.Mock).mock.calls[0];
        const updatePayload = mockUpdateDocCall[1];
        
        expect(updatePayload).toHaveProperty("time_to_live");
        const receivedTime = updatePayload.time_to_live.toDate().getTime();
        const expectedTime = add(MOCK_DATE, { days: 30 }).getTime();
        
        expect(Math.abs(receivedTime - expectedTime)).toBeLessThan(1000);
        expect(mockedNavigate).toHaveBeenCalledWith("/event");
    });
  });

  test("calendar displays events", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-12-01T10:00:00Z"));

    render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter initialEntries={["/calendar"]}>
            <Calendar />
        </MemoryRouter>
      </UserContext.Provider>
    );
    
    await screen.findByText(/December 2025/i); 
    
    fireEvent.click(screen.getByText("25"));
    expect(await screen.findByText("Medical Mission")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("20"));
    expect(await screen.findByText("Christmas Party")).toBeInTheDocument();
  });
});