/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { UserContext } from "../util/userContext";
import type { User } from "firebase/auth";

import EventCreation from "../routes/EventCreation";
import EventList from "../routes/EventList";
import { EventPage } from "../routes/EventPage";
import { callDeleteEvent } from "../firebase/cloudFunctions";

let eventDocs = [
  {
    id: "event1",
    data: () => ({
      name: "Community Cleanup",
      description: "Annual cleanup event.",
      start_date: { toDate: () => new Date("2025-08-01T09:00:00Z") },
      end_date: { toDate: () => new Date("2025-08-01T12:00:00Z") },
      location: "City Park",
      attendees: [],
    }),
  },
  {
    id: "event2",
    data: () => ({
      name: "Fundraising Gala",
      description: "Gala to support our programs.",
      start_date: { toDate: () => new Date("2025-09-15T18:00:00Z") },
      end_date: { toDate: () => new Date("2025-09-15T22:00:00Z") },
      location: "Grand Hall",
      attendees: [],
    }),
  },
];

// Mock Firebase services
jest.mock("firebase/firestore", () => {
  const originalModule = jest.requireActual("firebase/firestore");
  return {
    ...originalModule,
    collection: jest.fn().mockReturnValue({
      withConverter: jest.fn().mockReturnThis(),
    }),
    getDocs: jest.fn((query) => {
      if (query.path?.includes("attendees")) {
        return Promise.resolve({ docs: [] }); // Fix for forEach error
      }
      return Promise.resolve({ docs: eventDocs });
    }),
    doc: jest.fn((db, collectionName, docId) => ({
      id: docId, // Ensure id is passed correctly
      path: `${collectionName}/${docId}`,
      withConverter: jest.fn().mockReturnThis(),
    })),
    getDoc: jest.fn((docRef) => {
      const doc = eventDocs.find((d) => d.id === docRef.id);
      return Promise.resolve({
        exists: () => !!doc,
        data: () => doc?.data(),
        id: doc?.id,
      });
    }),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    Timestamp: {
      fromDate: (date: Date) => ({
        toDate: () => date,
        seconds: date.getTime() / 1000,
        nanoseconds: 0,
      }),
    },
  };
});

jest.mock("../firebase/firebaseConfig", () => ({
  db: {},
  auth: {},
}));

jest.mock("../firebase/cloudFunctions", () => ({
  callDeleteEvent: jest.fn(),
}));

const mockedNavigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockedNavigate,
  useParams: jest.fn(),
}));

const mockUser = {
  uid: "test-admin-uid",
  is_admin: true,
} as User & { is_admin: boolean };

describe("Event Module Integration Test", () => {
  const { addDoc, updateDoc } = require("firebase/firestore");
  const { useParams } = require("react-router");

  beforeEach(() => {
    addDoc.mockClear();
    updateDoc.mockClear();
    (callDeleteEvent as unknown as jest.Mock).mockClear();
    mockedNavigate.mockClear();
  });

  test("creates an event and sees it in the list", async () => {
    addDoc.mockResolvedValue({ id: "event3" });

    // 1. Create Event
    const { unmount } = render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter>
          <EventCreation />
          <ToastContainer />
        </MemoryRouter>
      </UserContext.Provider>
    );

    fireEvent.change(screen.getByLabelText(/event name/i), {
      target: { value: "New Charity Run" },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "A 5k run for a good cause." },
    });
    fireEvent.change(screen.getByLabelText(/date/i), {
      target: { value: "2025-10-10" },
    });
    fireEvent.change(screen.getByLabelText(/start time/i), {
      target: { value: "08:00" },
    });
    fireEvent.change(screen.getByLabelText(/end time/i), {
      target: { value: "10:00" },
    });
    fireEvent.change(screen.getByLabelText(/location/i), {
      target: { value: "Central Park" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create event/i }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
      expect(mockedNavigate).toHaveBeenCalledWith("/view-admin");
    });

    // Add the new event to our mock database
    eventDocs.push({
      id: "event3",
      data: () => ({
        name: "New Charity Run",
        description: "A 5k run for a good cause.",
        start_date: { toDate: () => new Date("2025-10-10T08:00:00Z") },
        end_date: { toDate: () => new Date("2025-10-10T10:00:00Z") },
        location: "Central Park",
        attendees: [],
      }),
    });

    unmount();

    // 2. View in List
    render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter>
          <EventList />
        </MemoryRouter>
      </UserContext.Provider>
    );

    expect(await screen.findByText("New Charity Run")).toBeInTheDocument();
  });

  test("updates an event's details", async () => {
    useParams.mockReturnValue({ docId: "event1" });

    render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter initialEntries={["/view-event/event1"]}>
          <Routes>
            <Route path="/view-event/:docId" element={<EventPage />} />
          </Routes>
          <ToastContainer />
        </MemoryRouter>
      </UserContext.Provider>
    );

    await screen.findByDisplayValue("Annual cleanup event.");

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Updated description for cleanup." },
    });
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "event1" }),
        expect.objectContaining({
          description: "Updated description for cleanup.",
        })
      );
    });
  });

  test("deletes an event and removes it from the list", async () => {
    (callDeleteEvent as unknown as jest.Mock).mockResolvedValue({ data: true });
    useParams.mockReturnValue({ docId: "event2" });

    // 1. Delete the event from its page
    const { unmount } = render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter initialEntries={["/view-event/event2"]}>
          <Routes>
            <Route path="/view-event/:docId" element={<EventPage />} />
          </Routes>
          <ToastContainer />
        </MemoryRouter>
      </UserContext.Provider>
    );

    await screen.findByText("Fundraising Gala");

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() => {
      expect(callDeleteEvent).toHaveBeenCalledWith("event2");
      expect(mockedNavigate).toHaveBeenCalledWith("/view-event-list");
    });

    // Remove from mock data for the list view check
    eventDocs = eventDocs.filter((event) => event.id !== "event2");
    unmount();

    // 2. Verify it's gone from the list
    render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter>
          <EventList />
        </MemoryRouter>
      </UserContext.Provider>
    );

    await screen.findByText("Community Cleanup"); // wait for list to render
    expect(screen.queryByText("Fundraising Gala")).not.toBeInTheDocument();
  });
});