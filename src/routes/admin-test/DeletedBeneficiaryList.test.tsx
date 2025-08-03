/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DeletedBeneficiaryList } from "../admin/DeletedBeneficiaryList";
import { getDocs, collection, query, where, doc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";

jest.mock("../../firebase/firebaseConfig", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockBeneficiaries = [
  {
    docID: "b1",
    first_name: "Alice",
    last_name: "Smith",
    birthdate: { toDate: () => new Date(2010, 1, 1) },
    sex: "F",
    accredited_id: 123,
    time_to_live: {
      toDate: () => new Date(Date.now() + 86400000),
      toMillis: () => Date.now() + 86400000,
    },
  },
  {
    docID: "b2",
    first_name: "Bob",
    last_name: "Johnson",
    birthdate: { toDate: () => new Date(2005, 5, 5) },
    sex: "M",
    accredited_id: NaN,
    time_to_live: {
      toDate: () => new Date(Date.now() + 172800000),
      toMillis: () => Date.now() + 172800000,
    },
  },
];

describe("Deleted Beneficiary List", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (collection as jest.Mock).mockReturnValue({});
    (where as jest.Mock).mockReturnValue({});
    (query as jest.Mock).mockReturnValue({
      withConverter: jest.fn().mockReturnValue({}),
    });
  });

  test("renders title, filter, sort, and search inputs", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });
    render(<DeletedBeneficiaryList />);

    expect(screen.getByRole("heading", { name: /deleted list/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Filter By")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Sort by")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  test("shows 'Fetching...' initially", () => {
    (getDocs as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<DeletedBeneficiaryList />);
    expect(screen.getByText(/fetching/i)).toBeInTheDocument();
  });

  test("renders empty state when no profiles", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });
    render(<DeletedBeneficiaryList />);

    await waitFor(() =>
      expect(screen.getByText(/Nothing to show/i)).toBeInTheDocument()
    );
  });

  test("renders beneficiary profiles", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: mockBeneficiaries.map((b) => ({
        id: b.docID,
        data: () => b,
      })),
    });

    render(<DeletedBeneficiaryList />);

    await waitFor(() => {
      expect(screen.getByText(/SMITH, Alice/i)).toBeInTheDocument();
      expect(screen.getByText(/JOHNSON, Bob/i)).toBeInTheDocument();
    });
  });

  it("handles search functionality", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: mockBeneficiaries.map((b) => ({
        id: b.docID,
        data: () => b,
        })),
    });

    render(<DeletedBeneficiaryList />);

    await waitFor(() => screen.getByText(/JOHNSON, Bob/i));

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "Alice" } });

    expect(searchInput).toHaveValue("Alice");

    expect(screen.queryByText(/JOHNSON, Bob/i)).not.toBeInTheDocument()
    expect(screen.getByText(/SMITH, Alice/i)).toBeInTheDocument(); 
  });

  test("handles filter functionality", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: mockBeneficiaries.map((b) => ({
        id: b.docID,
        data: () => b,
      })),
    });

    render(<DeletedBeneficiaryList />);

    await waitFor(() => screen.getByText(/SMITH, Alice/i));

    const filterSelect = screen.getByDisplayValue(/Filter By/i);
    fireEvent.change(filterSelect, { target: { value: "admin" } });

    await waitFor(() => {
      expect(screen.getByText(/SMITH, Alice/i)).toBeInTheDocument();
    });
  });

  test("sorts beneficiaries by last name", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: mockBeneficiaries.map((b) => ({
        id: b.docID,
        data: () => b,
      })),
    });

    render(<DeletedBeneficiaryList />);

    await waitFor(() => screen.getByText(/SMITH, Alice/i));

    const sortSelect = screen.getByDisplayValue("Sort by") as HTMLSelectElement;
    fireEvent.change(sortSelect, { target: { value: "last" } });

    expect(sortSelect.value).toBe("last");
    expect(screen.getByText(/SMITH, Alice/i)).toBeInTheDocument();
    expect(screen.getByText(/JOHNSON, Bob/i)).toBeInTheDocument();
  });

  test("sorts beneficiaries by first name", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: mockBeneficiaries.map((b) => ({
        id: b.docID,
        data: () => b,
      })),
    });

    render(<DeletedBeneficiaryList />);

    await waitFor(() => screen.getByText(/SMITH, Alice/i));

    const sortSelect = screen.getByDisplayValue("Sort by") as HTMLSelectElement;
    fireEvent.change(sortSelect, { target: { value: "first" } });

    expect(sortSelect.value).toBe("first");
    expect(screen.getByText(/SMITH, Alice/i)).toBeInTheDocument();
    expect(screen.getByText(/JOHNSON, Bob/i)).toBeInTheDocument();
  });

  test("sorts beneficiaries by age", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: mockBeneficiaries.map((b) => ({
        id: b.docID,
        data: () => b,
      })),
    });

    render(<DeletedBeneficiaryList />);

    await waitFor(() => screen.getByText(/SMITH, Alice/i));

    const sortSelect = screen.getByDisplayValue("Sort by") as HTMLSelectElement;
    fireEvent.change(sortSelect, { target: { value: "age" } });

    expect(sortSelect.value).toBe("age");
    expect(screen.getByText(/SMITH, Alice/i)).toBeInTheDocument();
    expect(screen.getByText(/JOHNSON, Bob/i)).toBeInTheDocument();
  });

  test("restores a beneficiary when restore button is clicked", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: mockBeneficiaries.map((b) => ({
        id: b.docID,
        data: () => b,
      })),
    });
    (updateDoc as jest.Mock).mockResolvedValueOnce(true);

    render(<DeletedBeneficiaryList />);

    await waitFor(() => screen.getByText(/SMITH, Alice/i));

    const restoreButton = screen.getAllByRole("button")[0];
    fireEvent.click(restoreButton);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("successfully restored Alice Smith")
      );
    });
  });

  test("displays error when fetching beneficiaries fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    (getDocs as jest.Mock).mockRejectedValueOnce(new Error("Firestore error"));

    render(<DeletedBeneficiaryList />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Couldn't load beneficiaries.");
    });

    consoleError.mockRestore();
  });

  test("handles restore failure", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [mockBeneficiaries[0]].map((b) => ({
        id: b.docID,
        data: () => b,
      })),
    });
    (updateDoc as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<DeletedBeneficiaryList />);

    await waitFor(() => screen.getByText(/SMITH, Alice/i));

    const restoreButton = screen.getAllByRole("button")[0];
    fireEvent.click(restoreButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("couldn't restored Alice Smith")
      );
    });
  });
});
