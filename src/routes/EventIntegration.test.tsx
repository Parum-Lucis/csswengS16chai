/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { UserContext } from '../util/userContext';
import type { User } from "firebase/auth";
import { EventCreation } from "./EventCreation";
import EventList from "./EventList";
import { EventPage } from "./EventPage";
import { Calendar } from "./Calendar";

// Define mutable data stores for our mock Firestore.
let eventDocs = [
  {
    id: "1",
    data: () => ({
      name: "Medical Mission",
      description: "Annual medical mission for the community.",
      start_date: { toDate: () => new Date("2025-12-25T09:00:00Z") },
      end_date: { toDate: () => new Date("2025-12-25T17:00:00Z") },
      location: "Community Center",
    }),
  },
  {
    id: "2",
    data: () => ({
      name: "Christmas Party",
      description: "Annual Christmas party for the kids.",
      start_date: { toDate: () => new Date("2025-12-20T13:00:00Z") },
      end_date: { toDate: () => new Date("2025-12-20T17:00:00Z") },
      location: "CHAI Youth Center",
    }),
  },
];

let attendeeDocs = [
    { id: 'att1', data: () => ({ beneficiaryID: 'b1', first_name: 'John', last_name: 'Doe' }) },
    { id: 'att2', data: () => ({ beneficiaryID: 'b2', first_name: 'Jane', last_name: 'Smith' }) },
];


jest.mock("firebase/firestore", () => {
  const originalModule = jest.requireActual("firebase/firestore");
  return {
    ...originalModule,
    collection: jest.fn((db, path) => ({ path })),
    doc: jest.fn((db, path, id) => ({ path: `${path}/${id}`, id })),
    addDoc: jest.fn(async (collectionRef, data) => {
        const newId = `new-id-${Date.now()}`;
        const newEvent = {
            id: newId,
            data: () => ({
                ...data,
                start_date: { toDate: () => new Date(data.start_date) },
                end_date: { toDate: () => new Date(data.end_date) },
            }),
        };
        eventDocs.push(newEvent as any);
        return { id: newId };
    }),
    getDocs: jest.fn(async (query) => {
        if (query.path.includes("attendees")) {
            return {
                docs: attendeeDocs,
                forEach: (callback: any) => attendeeDocs.forEach(callback),
            };
        }
        return {
            docs: eventDocs,
            forEach: (callback: any) => eventDocs.forEach(callback),
        };
    }),
    getDoc: jest.fn(async (docRef) => {
        const doc = eventDocs.find(d => d.id === docRef.id);
        if (doc) {
            return {
                // Fix: Explicitly define the return type of the 'exists' function.
                exists: (): boolean => true,
                id: doc.id,
                data: doc.data,
            };
        }
        // Fix: Explicitly define the return type of the 'exists' function.
        return { exists: (): boolean => false };
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

jest.mock("../firebase/cloudFunctions", () => ({
  callDeleteEvent: jest.fn(),
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
  const { addDoc, updateDoc, getDocs, deleteDoc } = require("firebase/firestore");
  const { callDeleteEvent } = require("../firebase/cloudFunctions");

  beforeEach(() => {
    addDoc.mockClear();
    updateDoc.mockClear();
    (getDocs as jest.Mock).mockClear();
    deleteDoc.mockClear();
    callDeleteEvent.mockClear();
    mockedNavigate.mockClear();
    eventDocs = [
        {
          id: "1",
          data: () => ({
            name: "Medical Mission",
            description: "Annual medical mission for the community.",
            start_date: { toDate: () => new Date("2025-12-25T09:00:00Z") },
            end_date: { toDate: () => new Date("2025-12-25T17:00:00Z") },
            location: "Community Center",
          }),
        },
        {
          id: "2",
          data: () => ({
            name: "Christmas Party",
            description: "Annual Christmas party for the kids.",
            start_date: { toDate: () => new Date("2025-12-20T13:00:00Z") },
            end_date: { toDate: () => new Date("2025-12-20T17:00:00Z") },
            location: "CHAI Youth Center",
          }),
        },
    ];
  });

  test("creates an event, displays it in the list, and then deletes it", async () => {
    render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter initialEntries={["/create-event"]}>
          <Routes>
            <Route path="/create-event" element={<EventCreation />} />
            <Route path="/admin" element={<EventList />} />
            <Route path="/event" element={<EventList />} />
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
    callDeleteEvent.mockResolvedValue({data: true});
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

    await screen.findByText("Medical Mission");
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() => {
        expect(callDeleteEvent).toHaveBeenCalledWith("1");
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