/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { UserContext } from "../util/userContext";
import { getDocs, getDoc, addDoc, updateDoc, Timestamp } from "firebase/firestore";
import { EventCreation } from "../routes/EventCreation";
import { EventList } from "../routes/EventList";
import { EventPage } from "../routes/EventPage";
import { add } from "date-fns";
// import { db } from "../firebase/firebaseConfig";

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

jest.mock("firebase/firestore", () => {
    const originalModule = jest.requireActual("firebase/firestore");

    class MockTimestamp {
        seconds: number;
        nanoseconds: number;

        constructor(seconds: number, nanoseconds: number = 0) {
            this.seconds = seconds;
            this.nanoseconds = nanoseconds;
        }

        toDate(): Date {
            return new Date(this.seconds * 1000 + this.nanoseconds / 1e6);
        }

        toMillis(): number {
            return this.toDate().getTime();
        }

        valueOf(): number {
            return this.toDate().getTime();
        }

        static fromDate(date: Date): MockTimestamp {
            const seconds = Math.floor(date.getTime() / 1000);
            const nanoseconds = (date.getTime() % 1000) * 1e6;
            return new MockTimestamp(seconds, nanoseconds);
        }

        static fromMillis(milliseconds: number): MockTimestamp {
            const date = new Date(milliseconds);
            return MockTimestamp.fromDate(date);
        }
    }

    return {
        ...originalModule,
        collection: jest.fn().mockReturnValue({
            withConverter: jest.fn().mockReturnThis(),
        }),
        query: jest.fn((collectionRef, ..._constraints) => collectionRef),
        where: jest.fn(),
        getDocs: jest.fn(),
        doc: jest.fn(),
        getDoc: jest.fn(),
        addDoc: jest.fn(),
        updateDoc: jest.fn(),
        deleteDoc: jest.fn(),
        Timestamp: MockTimestamp,
    };
});

jest.mock("../firebase/firebaseConfig", () => ({
  db: {},
  auth: {},
}));

const mockedNavigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockedNavigate,
}));

jest.mock("react-toastify", () => ({
  ...jest.requireActual("react-toastify"),
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUser = { uid: "test-user-id", email: "test@example.com" };

const renderWithRouter = (ui: React.ReactElement, user: any = mockUser) => {
  return render(
    <BrowserRouter>
      <UserContext.Provider value={user}>
        {ui}
        <ToastContainer />
      </UserContext.Provider>
    </BrowserRouter>
  );
};

const renderWithMemoryRouter = (ui: React.ReactElement, initialEntries: string[], user: any = mockUser) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <UserContext.Provider value={user}>
          {ui}
          <ToastContainer />
        </UserContext.Provider>
      </MemoryRouter>
    );
  };

describe("Event Creation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders the event creation form", () => {
        renderWithRouter(<EventCreation />);
        expect(screen.getByLabelText(/event name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /create event/i })).toBeInTheDocument();
    });

    test("shows an error if any field is empty", async () => {
        renderWithRouter(<EventCreation />);
        const form = screen.getByRole("button", { name: /create event/i }).closest('form');
        fireEvent.submit(form!);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Please fill up all fields!");
        });
    });

    test("successfully creates an event with valid data", async () => {
        (addDoc as jest.Mock).mockResolvedValue({ id: "new-event-id" });
        renderWithRouter(<EventCreation />);

        fireEvent.change(screen.getByLabelText(/event name/i), { target: { value: "Test Event" } });
        fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Test Description" } });
        fireEvent.change(screen.getByLabelText(/date/i), { target: { value: "2025-12-25" } });
        fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: "10:00" } });
        fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: "12:00" } });
        fireEvent.change(screen.getByLabelText(/location/i), { target: { value: "Test Location" } });

        const form = screen.getByRole("button", { name: /create event/i }).closest('form');
        fireEvent.submit(form!);

        await waitFor(() => {
            expect(addDoc).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith("Event created successfully!");
            expect(mockedNavigate).toHaveBeenCalledWith("/admin");
        });
    });

    test("shows an error if any field is empty on creation", async () => {
        renderWithRouter(<EventCreation />);
        const form = screen.getByRole("button", { name: /create event/i }).closest('form');

        fireEvent.submit(form!); // all fields empty

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Please fill up all fields!");
        });
        expect(addDoc).not.toHaveBeenCalled();
    });

    test("shows an error if end time is before start time on creation", async () => {
        renderWithRouter(<EventCreation />);

        fireEvent.change(screen.getByLabelText(/event name/i), { target: { value: "Time Travel Meeting" } });
        fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Discussing the temporal paradox." } });
        fireEvent.change(screen.getByLabelText(/date/i), { target: { value: "2025-12-25" } });
        fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: "14:00" } });
        fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: "11:00" } });
        fireEvent.change(screen.getByLabelText(/location/i), { target: { value: "The TARDIS" } });

        const form = screen.getByRole("button", { name: /create event/i }).closest('form');
        fireEvent.submit(form!);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Start time must strictly be before the end time!");
        });
        expect(addDoc).not.toHaveBeenCalled();
    });

    test("shows an error if description is too long on creation", async () => {
        renderWithRouter(<EventCreation />);
        const longDescription = "This description is intentionally made to be well over the maximum character limit of 255 to ensure that our validation logic correctly catches this error case and provides the appropriate feedback to the user. We must be thorough in our testing to prevent database errors and maintain a good user experience.".repeat(2);

        fireEvent.change(screen.getByLabelText(/event name/i), { target: { value: "Novel Writing Contest" } });
        fireEvent.change(screen.getByLabelText(/description/i), { target: { value: longDescription } });
        fireEvent.change(screen.getByLabelText(/date/i), { target: { value: "2025-11-01" } });
        fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: "09:00" } });
        fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: "17:00" } });
        fireEvent.change(screen.getByLabelText(/location/i), { target: { value: "The Library" } });

        const form = screen.getByRole("button", { name: /create event/i }).closest('form');
        fireEvent.submit(form!);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Description must be at most 255 characters in length!");
        });
        expect(addDoc).not.toHaveBeenCalled();
    });

    test("disables submit button after submission to prevent multiple submissions", async () => {
      const neverResolvingPromise = new Promise(() => {});
      (addDoc as jest.Mock).mockReturnValue(neverResolvingPromise);

      renderWithRouter(<EventCreation />);

      fireEvent.change(screen.getByLabelText(/event name/i), { target: { value: "Spam Block" } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Testing spam click" } });
      fireEvent.change(screen.getByLabelText(/date/i), { target: { value: "2025-12-25" } });
      fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: "09:00" } });
      fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: "11:00" } });
      fireEvent.change(screen.getByLabelText(/location/i), { target: { value: "Lab" } });

      const button = screen.getByRole("button", { name: /create event/i });
      
      const form = button.closest('form')!;
      
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      Object.defineProperty(submitEvent, 'target', {
        value: form,
        enumerable: true
      });
      
      form.dispatchEvent(submitEvent);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    test("re-enables submit button after validation error", async () => {
      renderWithRouter(<EventCreation />);

      const button = screen.getByRole("button", { name: /create event/i });

      fireEvent.submit(button.closest("form")!);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Please fill up all fields!");
        expect(button).not.toBeDisabled();
      });
    });

    test("re-enables submit button if addDoc fails", async () => {
      (addDoc as jest.Mock).mockRejectedValue(new Error("Firestore error"));

      renderWithRouter(<EventCreation />);

      fireEvent.change(screen.getByLabelText(/event name/i), { target: { value: "Test" } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Error Test" } });
      fireEvent.change(screen.getByLabelText(/date/i), { target: { value: "2025-12-25" } });
      fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: "09:00" } });
      fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: "11:00" } });
      fireEvent.change(screen.getByLabelText(/location/i), { target: { value: "Field" } });

      const button = screen.getByRole("button", { name: /create event/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Failed to create event"));
        expect(button).not.toBeDisabled();
      });
    });
});

describe("View Event", () => {
    const mockEvent = {
        docID: "test-event-id",
        name: "Test Event",
        description: "Test Description",
        start_date: Timestamp.fromDate(new Date("2025-12-25T10:00:00Z")),
        end_date: Timestamp.fromDate(new Date("2025-12-25T12:00:00Z")),
        location: "Test Location",
        attendees: [],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (getDoc as jest.Mock).mockResolvedValue({
            exists: () => true,
            data: () => mockEvent,
            id: "test-event-id",
        });
        (getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });
    });

    test("fetches and displays event details", async () => {
        renderWithMemoryRouter(
            <Routes>
                <Route path="/view-event/:docId" element={<EventPage />} />
            </Routes>,
            ["/view-event/test-event-id"]
        );

        await waitFor(() => {
            expect(screen.getByText("Test Event")).toBeInTheDocument();
            expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
            expect(screen.getByDisplayValue("Test Location")).toBeInTheDocument();
        });
    });

    test("renders event list", async () => {
        (getDocs as jest.Mock).mockResolvedValue({ docs: [{ data: () => mockEvent, id: mockEvent.docID }] });
        renderWithRouter(<EventList />);
        await waitFor(() => {
          expect(screen.getByText("Test Event")).toBeInTheDocument();
        });
      });
});

describe("Edit Event", () => {
    const mockEvent = {
        docID: "test-event-id",
        name: "Test Event",
        description: "Test Description",
        start_date: Timestamp.fromDate(new Date("2025-12-25T10:00:00Z")),
        end_date: Timestamp.fromDate(new Date("2025-12-25T12:00:00Z")),
        location: "Test Location",
        attendees: [],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (getDoc as jest.Mock).mockResolvedValue({
            exists: () => true,
            data: () => mockEvent,
            id: "test-event-id",
        });
        (getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });
    });

    test("allows editing and saving changes", async () => {
        renderWithMemoryRouter(
            <Routes>
                <Route path="/view-event/:docId" element={<EventPage />} />
            </Routes>,
            ["/view-event/test-event-id"]
        );

        await waitFor(() => {
            expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
        fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Updated Description" } });     
        fireEvent.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => {
            expect(updateDoc).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith("Update success!");
        });
    });

    test("shows an error on edit if a field is empty", async () => {
        renderWithMemoryRouter(
            <Routes>
                <Route path="/view-event/:docId" element={<EventPage />} />
            </Routes>,
            ["/view-event/test-event-id"]
        );

        await waitFor(() => {
          expect(screen.getByLabelText(/Description:/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
        fireEvent.change(screen.getByLabelText(/Description:/i), { target: { value: "  " } });
        fireEvent.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Please fill up all fields!");
        });
        expect(updateDoc).not.toHaveBeenCalled();
    });

    test("shows an error on edit if end date is before start date", async () => {
        renderWithMemoryRouter(
          <Routes>
            <Route path="/view-event/:docId" element={<EventPage />} />
          </Routes>,
          ["/view-event/test-event-id"]
        );

        await waitFor(() => {
          expect(screen.getByLabelText(/Start:/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
        fireEvent.change(screen.getByLabelText(/Start:/i), { target: { value: "2025-12-25T12:00:00" } });
        fireEvent.change(screen.getByLabelText(/End:/i), { target: { value: "2025-12-25T10:00:00" } });
        fireEvent.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Start date cannot be greater than end date!");
        });
        expect(updateDoc).not.toHaveBeenCalled();
    });
});

describe("Delete Event", () => {
    const mockEvent = {
        docID: "test-event-id",
        name: "Test Event",
        description: "Test Description",
        start_date: Timestamp.fromDate(new Date("2025-12-25T10:00:00Z")),
        end_date: Timestamp.fromDate(new Date("2025-12-25T12:00:00Z")),
        location: "Test Location",
        attendees: [],
    };

    const MOCK_DATE = new Date();

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(MOCK_DATE);

        jest.clearAllMocks();
        (getDoc as jest.Mock).mockResolvedValue({
            exists: () => true,
            data: () => mockEvent,
            id: "test-event-id",
        });
        (getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("shows delete confirmation and 'deletes' event", async () => {
        renderWithMemoryRouter(
            <Routes>
                <Route path="/view-event/:docId" element={<EventPage />} />
                <Route path="/event" element={<div>Event List Page</div>} />
            </Routes>,
            ["/view-event/test-event-id"]
        );

        await waitFor(() => {
            expect(screen.getByText("Test Event")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: /delete/i }));
        expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

        await waitFor(() => {
            // bruh all because it difference in nanoseconds lmao
            expect(updateDoc).toHaveBeenCalled();

            const mockUpdateDocCall = (updateDoc as jest.Mock).mock.calls[0];
            const updatePayload = mockUpdateDocCall[1];

            expect(updatePayload).toHaveProperty("time_to_live");

            const receivedTime = updatePayload.time_to_live.toDate().getTime();
            const expectedTime = add(MOCK_DATE, { days: 30 }).getTime();
            
            expect(Math.abs(receivedTime - expectedTime)).toBeLessThan(1000); // Less than 1000ms (1 second) difference
            expect(toast.success).toHaveBeenCalledWith("Event delete success!");
            expect(mockedNavigate).toHaveBeenCalledWith("/event");
        });
    });
});

describe("Search and Filtering Event List", () => {
    const mockEvents = [
        { docID: "1", name: "Ongoing Event", description: "", location: "...", start_date: Timestamp.fromDate(new Date()), end_date: Timestamp.fromDate(new Date(Date.now() + 86400000)) },
        { docID: "2", name: "Done Event", description: "", location: "...", start_date: Timestamp.fromDate(new Date(Date.now() - 86400000 * 2)), end_date: Timestamp.fromDate(new Date(Date.now() - 86400000)) },
        { docID: "3", name: "Pending Event", description: "", location: "...", start_date: Timestamp.fromDate(new Date(Date.now() + 86400000)), end_date: Timestamp.fromDate(new Date(Date.now() + 86400000 * 2)) },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (getDocs as jest.Mock).mockResolvedValue({
            docs: mockEvents.map(event => ({
              data: () => event,
              id: event.docID,
            })),
          });
    });

    test("filters events by status", async () => {
        renderWithRouter(<EventList />);

        await waitFor(() => {
            expect(screen.getByText("Ongoing Event")).toBeInTheDocument();
            expect(screen.getByText("Done Event")).toBeInTheDocument();
            expect(screen.getByText("Pending Event")).toBeInTheDocument();
        });

        fireEvent.change(screen.getByDisplayValue("Filter By"), { target: { value: "done" } });

        await waitFor(() => {
            expect(screen.queryByText("Ongoing Event")).not.toBeInTheDocument();
            expect(screen.getByText("Done Event")).toBeInTheDocument();
            expect(screen.queryByText("Pending Event")).not.toBeInTheDocument();
        });
    });

    test("searches events by name", async () => {
        renderWithRouter(<EventList />);

        await waitFor(() => {
            expect(screen.getByText("Ongoing Event")).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "Pending" } });

        await waitFor(() => {
            expect(screen.queryByText("Ongoing Event")).not.toBeInTheDocument();
            expect(screen.queryByText("Done Event")).not.toBeInTheDocument();
            expect(screen.getByText("Pending Event")).toBeInTheDocument();
        });
      });

      test("sorts events by name", async () => {
        renderWithRouter(<EventList />);

        await waitFor(() => {
          expect(screen.getByText("Ongoing Event")).toBeInTheDocument();
        });

        fireEvent.change(screen.getByDisplayValue("Sort by"), { target: { value: "name" } });

        await waitFor(() => {
            const eventNames = screen.getAllByRole("link").map(link => link.textContent?.split("Date:")[0].trim());
            expect(eventNames).toEqual(["Done Event", "Ongoing Event", "Pending Event"]);
        });
      });
});