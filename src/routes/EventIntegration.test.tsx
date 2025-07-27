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

interface MockEventData {
  name: string;
  description: string;
  start_date: { toDate: () => Date };
  end_date: { toDate: () => Date };
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

let eventDocs = [
  {
    id: "1",
    data: (): MockEventData => ({
      name: "Medical Mission",
      description: "Annual medical mission for the community.",
      start_date: { toDate: () => new Date("2025-12-25T09:00:00Z") },
      end_date: { toDate: () => new Date("2025-12-25T17:00:00Z") },
      location: "Community Center",
    }),
  },
  {
    id: "2",
    data: (): MockEventData => ({
      name: "Christmas Party",
      description: "Annual Christmas party for the kids.",
      start_date: { toDate: () => new Date("2025-12-20T13:00:00Z") },
      end_date: { toDate: () => new Date("2025-12-20T17:00:00Z") },
      location: "CHAI Youth Center",
    }),
  },
];

let attendeeDocs = [
    { id: 'att1', data: (): MockAttendeeData => ({ beneficiaryID: 'b1', first_name: 'John', last_name: 'Doe', attended: true, who_attended: "Beneficiary" }) },
    { id: 'att2', data: (): MockAttendeeData => ({ beneficiaryID: 'b2', first_name: 'Jane', last_name: 'Smith', attended: false, who_attended: "None" }) },
];


jest.mock("firebase/firestore", () => {
  const originalModule = jest.requireActual("firebase/firestore");
  return {
    ...originalModule,
    Timestamp: {
      fromDate: (date: Date) => ({
        toDate: () => date,
      }),
    },
    collection: jest.fn((db, path, ...segments) => {
      const collectionRef = {
        path: [path, ...segments].join('/'),
        withConverter: jest.fn(function(this, converter) {
          return this;
        }),
      };
      return collectionRef;
    }),
    doc: jest.fn((db, path, id) => ({ path: `${path}/${id}`, id })),
    addDoc: jest.fn(async (collectionRef, data) => {
        const newId = `new-id-${Date.now()}`;
        const newEvent = {
            id: newId,
            data: () => data,
        };
        eventDocs.push(newEvent as any);
        return Promise.resolve({ id: newId });
    }),
    getDocs: jest.fn(async (query) => {
        if (query.path.includes("attendees")) {
            return {
                docs: attendeeDocs,
                empty: attendeeDocs.length === 0,
                forEach: (callback: any) => attendeeDocs.forEach(callback),
            };
        }
        return {
            docs: eventDocs,
            empty: eventDocs.length === 0,
            forEach: (callback: any) => eventDocs.forEach(callback),
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
            data: (): undefined => undefined
        };
    }),
    updateDoc: jest.fn(() => Promise.resolve()),
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
  const MOCK_DATE = new Date();
  const { addDoc, updateDoc, getDocs, deleteDoc } = require("firebase/firestore");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_DATE);

    addDoc.mockClear();
    updateDoc.mockClear();
    (getDocs as jest.Mock).mockClear();
    deleteDoc.mockClear();
    mockedNavigate.mockClear();
    eventDocs = [
        {
          id: "1",
          data: (): MockEventData => ({
            name: "Medical Mission",
            description: "Annual medical mission for the community.",
            start_date: { toDate: () => new Date("2025-12-25T09:00:00Z") },
            end_date: { toDate: () => new Date("2025-12-25T17:00:00Z") },
            location: "Community Center",
          }),
        },
        {
          id: "2",
          data: (): MockEventData => ({
            name: "Christmas Party",
            description: "Annual Christmas party for the kids.",
            start_date: { toDate: () => new Date("2025-12-20T13:00:00Z") },
            end_date: { toDate: () => new Date("2025-12-20T17:00:00Z") },
            location: "CHAI Youth Center",
          }),
        },
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
          <Routes>
            <Route path="/admin" element={<EventList />} />
          </Routes>
        </MemoryRouter>
      </UserContext.Provider>
    );

    expect(await screen.findByText("New Year's Gala")).toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Updated Description" } });
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ description: "Updated Description" })
      );
    });
  });

  test("deletes an event", async() => {
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
    render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter initialEntries={["/calendar"]}>
          <Routes>
            <Route path="/calendar" element={<Calendar />} />
          </Routes>
        </MemoryRouter>
      </UserContext.Provider>
    );
    
    await waitFor(() => screen.getByText(/july 2025/i));
    
    for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByLabelText("Go to next month"));
    }

    await screen.findByText("December 2025");

    fireEvent.click(screen.getByText("25"));
    expect(await screen.findByText("Medical Mission")).toBeInTheDocument();

    fireEvent.click(screen.getByText("20"));
    expect(await screen.findByText("Christmas Party")).toBeInTheDocument();
  });
});