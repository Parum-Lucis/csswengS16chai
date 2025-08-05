/**
 * @jest-environment jsdom
 */
jest.mock("../../firebase/firebaseConfig", () => ({
  db: {},
}));

jest.mock("../admin/DeletedProfileList", () => ({
  DeletedProfileList: ({ profiles, loading, handleRestore, ProfileCard }: any) => {
    if (loading) return <div>Loading profiles...</div>;
    if (profiles.length === 0) return <div>Nothing to show</div>;

    return (
      <div>
        {profiles.map((profile: any) => (
          <div key={profile.docID}>
            <div>{profile.first_name.toUpperCase()} {profile.last_name.toUpperCase()}</div>
            <button
              data-testid={`restore-button-${profile.docID}`}
              onClick={() => handleRestore(profile)}
            >
              Restore
            </button>
          </div>
        ))}
      </div>
    );
  }
}));

import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DeletedVolunteerList } from "../admin/DeletedVolunteerList";
import * as cloudFunctions from "../../firebase/cloudFunctions";
import { getDocs, collection, query, where } from "firebase/firestore";
import { toast } from "react-toastify";

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockRestore = jest.spyOn(cloudFunctions, "callRestoreDeletedVolunteer");

const mockVolunteers = [
  {
    docID: "v1",
    first_name: "Alice",
    last_name: "Smith",
    birthdate: { toDate: () => new Date(1990, 1, 1) },
    sex: "F",
    role: "volunteer",
    time_to_live: {
      toDate: () => new Date(Date.now() + 86400000),
      toMillis: () => Date.now() + 86400000,
    },
  },
  {
    docID: "v2",
    first_name: "Bob",
    last_name: "Johnson",
    birthdate: { toDate: () => new Date(1985, 5, 5) },
    sex: "M",
    role: "admin",
    time_to_live: {
      toDate: () => new Date(Date.now() + 172800000),
      toMillis: () => Date.now() + 172800000,
    },
  },
];

describe("Deleted Volunteer List", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (collection as jest.Mock).mockReturnValue({});
    (where as jest.Mock).mockReturnValue({});
    (query as jest.Mock).mockReturnValue({
      withConverter: jest.fn().mockReturnValue({})
    });
  });

  test("renders title, filter, sort, and search inputs", () => {
    (getDocs as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<DeletedVolunteerList />);
    
    expect(screen.getByRole("heading", { name: /deleted list/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Filter By")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Sort by")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  test("shows loading state", () => {
    (getDocs as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<DeletedVolunteerList />);
    expect(screen.getByText(/deleted List/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading profiles.../i)).toBeInTheDocument();
  });

  test("shows empty state when no profiles", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });
    render(<DeletedVolunteerList />);
    await waitFor(() =>
      expect(screen.getByText(/Nothing to show/i)).toBeInTheDocument()
    );
  });

  test("renders volunteer cards after fetching", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: mockVolunteers.map((v) => ({
        id: v.docID,
        data: () => v,
      })),
    });
    render(<DeletedVolunteerList />);
    await waitFor(() => {
      expect(screen.getByText(/ALICE SMITH/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText(/BOB JOHNSON/i)).toBeInTheDocument();
  });

  test("restores volunteer when restore button is clicked", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: mockVolunteers.map((v) => ({
        id: v.docID,
        data: () => v,
      })),
    });
    mockRestore.mockResolvedValue({ data: true } as any);
    render(<DeletedVolunteerList />);
    await waitFor(() => screen.getByText(/ALICE SMITH/i), { timeout: 3000 });
    const aliceRestoreButton = screen.getByTestId("restore-button-v1");
    fireEvent.click(aliceRestoreButton);
    await waitFor(() => {
      expect(mockRestore).toHaveBeenCalledWith("v1");
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("successfully restored Alice Smith")
      );
    });
  });

  test("searches volunteer by name substring", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: mockVolunteers.map((v) => ({
        id: v.docID,
        data: () => v,
      })),
    });
    render(<DeletedVolunteerList />);
    await waitFor(() => screen.getByText(/ALICE SMITH/i));
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "Alice" } });
    await waitFor(() => {
      expect(screen.getByText(/ALICE SMITH/i)).toBeInTheDocument();
      expect(screen.queryByText(/BOB JOHNSON/i)).not.toBeInTheDocument();
    });
  });

  test("filters volunteer by role", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: mockVolunteers.map((v) => ({
        id: v.docID,
        data: () => v,
      })),
    });
    render(<DeletedVolunteerList />);
    await waitFor(() => screen.getByText(/ALICE SMITH/i));
    const filterSelect = screen.getByDisplayValue(/Filter By/i);
    fireEvent.change(filterSelect, { target: { value: "admin" } });
    await waitFor(() => {
      expect(screen.queryByText(/ALICE SMITH/i)).not.toBeInTheDocument();
      expect(screen.getByText(/BOB JOHNSON/i)).toBeInTheDocument();
    });
  });

  test("sorts volunteers by last name", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: mockVolunteers.map((v) => ({
        id: v.docID,
        data: () => v,
      })),
    });

    render(<DeletedVolunteerList />);
    await waitFor(() => screen.getByText(/ALICE SMITH/i));

    const sortSelect = screen.getByDisplayValue("Sort by") as HTMLSelectElement;
    fireEvent.change(sortSelect, { target: { value: "last" } });

    expect(sortSelect.value).toBe("last");
    expect(screen.getByText(/ALICE SMITH/i)).toBeInTheDocument();
    expect(screen.getByText(/BOB JOHNSON/i)).toBeInTheDocument();
  });

  test("sorts volunteers by first name", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: mockVolunteers.map((v) => ({
        id: v.docID,
        data: () => v,
      })),
    });

    render(<DeletedVolunteerList />);
    await waitFor(() => screen.getByText(/ALICE SMITH/i));

    const sortSelect = screen.getByDisplayValue("Sort by") as HTMLSelectElement;
    fireEvent.change(sortSelect, { target: { value: "first" } });

    expect(sortSelect.value).toBe("first");
    expect(screen.getByText(/ALICE SMITH/i)).toBeInTheDocument();
    expect(screen.getByText(/BOB JOHNSON/i)).toBeInTheDocument();
  });

  test("sorts volunteers by age", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: mockVolunteers.map((v) => ({
        id: v.docID,
        data: () => v,
      })),
    });

    render(<DeletedVolunteerList />);
    await waitFor(() => screen.getByText(/ALICE SMITH/i));

    const sortSelect = screen.getByDisplayValue("Sort by") as HTMLSelectElement;
    fireEvent.change(sortSelect, { target: { value: "age" } });

    expect(sortSelect.value).toBe("age");
    expect(screen.getByText(/ALICE SMITH/i)).toBeInTheDocument();
    expect(screen.getByText(/BOB JOHNSON/i)).toBeInTheDocument();
  });

  test("shows error when fetching volunteers fails", async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    (getDocs as jest.Mock).mockRejectedValueOnce(new Error("Firestore error"));
    render(<DeletedVolunteerList />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Couldn't load volunteers.");
    });
    consoleError.mockRestore();
  });

  test("shows error when restore fails", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [mockVolunteers[0]].map((v) => ({
        id: v.docID,
        data: () => v,
      })),
    });
    mockRestore.mockRejectedValue(new Error("Network error"));
    render(<DeletedVolunteerList />);
    await waitFor(() => screen.getByText(/ALICE SMITH/i));
    const aliceRestoreButton = screen.getByTestId("restore-button-v1");
    fireEvent.click(aliceRestoreButton);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("couldn't restored Alice Smith")
      );
    });
  });
});
