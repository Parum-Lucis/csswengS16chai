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

jest.mock("firebase/firestore", () => {
  const originalModule = jest.requireActual("firebase/firestore");
  return {
    ...originalModule,
    collection: jest.fn(),
    getDocs: jest.fn(() => Promise.resolve({ docs: eventDocs })),
    getDoc: jest.fn((docRef) => {
        const id = docRef.id;
        const doc = eventDocs.find(b => b.id === id);
        if (doc) {
            return Promise.resolve({
                exists: () => true,
                id: doc.id,
                data: doc.data,
            });
        }
        return Promise.resolve({ exists: () => false });
    }),
    doc: jest.fn((db, collectionName, id) => ({ id: id || "new-id" })),
    addDoc: jest.fn(() => Promise.resolve({ id: "new-event-id" })),
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
  const { addDoc, updateDoc } = require("firebase/firestore");
  const { callDeleteEvent } = require("../firebase/cloudFunctions");

  beforeEach(() => {
    addDoc.mockClear();
    updateDoc.mockClear();
    callDeleteEvent.mockClear();
    mockedNavigate.mockClear();
  });

  test("creates an event, displays it in the list, and then deletes it", async () => {
    // 1. Create Event
    render(
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
      expect(addDoc).toHaveBeenCalled();
      expect(mockedNavigate).toHaveBeenCalledWith("/admin");
    });


    // 2. View in List
    eventDocs.push({
      id: "3",
      data: () => ({
        name: "New Year's Gala",
        description: "A fun night to welcome the new year",
        start_date: { toDate: () => new Date("2025-12-31T19:00:00Z") },
        end_date: { toDate: () => new Date("2025-12-31T23:59:00Z") },
        location: "Grand Ballroom",
      }),
    });

    render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter initialEntries={["/event"]}>
          <Routes>
            <Route path="/event" element={<EventList />} />
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

    await screen.findByText("December 2025");

    // Click on the 25th to see the Medical Mission
    fireEvent.click(screen.getByText("25"));
    expect(await screen.findByText("Medical Mission")).toBeInTheDocument();

    // Click on the 20th to see the Christmas Party
    fireEvent.click(screen.getByText("20"));
    expect(await screen.findByText("Christmas Party")).toBeInTheDocument();
  });
});