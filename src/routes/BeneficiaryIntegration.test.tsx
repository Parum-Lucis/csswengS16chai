/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BeneficiaryProfileCreation } from "../routes/ProfileCreation";
import { BeneficiaryList } from "../routes/ProfileList";
import { BeneficiaryProfile } from "../routes/BeneficiaryProfile";
import { ToastContainer } from "react-toastify";
import { UserContext } from "../context/userContext";
import type { User } from "firebase/auth";

let beneficiaryDocs = [
  {
    id: "1",
    data: () => ({
      first_name: "Ana",
      last_name: "Santos",
      birthdate: { toDate: () => new Date("2010-02-10") },
      sex: "F",
      accredited_id: 101,
      grade_level: 5,
      address: "123 Rizal Ave",
      guardians: [{ name: 'Maria Santos', relation: 'Mother', email: 'maria@example.com', contact_number: '09111111111' }],
    }),
  },
  {
    id: "2",
    data: () => ({
      first_name: "Ben",
      last_name: "Reyes",
      birthdate: { toDate: () => new Date("2012-07-20") },
      sex: "M",
      accredited_id: null,
      grade_level: 3,
      address: "456 Mabini St",
      guardians: [{ name: 'Lito Reyes', relation: 'Father', email: 'lito@example.com', contact_number: '09222222222' }],
    }),
  },
];

jest.mock("firebase/firestore", () => {
  const originalModule = jest.requireActual("firebase/firestore");
  const mockCollectionRef = { id: 'beneficiaries', path: 'beneficiaries' };
  return {
    ...originalModule,
    collection: jest.fn(() => mockCollectionRef),
    getDocs: jest.fn(() => Promise.resolve({ docs: beneficiaryDocs })),
    getDoc: jest.fn((docRef) => {
        const id = docRef.id;
        const doc = beneficiaryDocs.find(b => b.id === id);
        if (doc) {
            return Promise.resolve({
                exists: () => true,
                id: doc.id,
                data: doc.data,
            });
        }
        return Promise.resolve({ exists: () => false });
    }),
    doc: jest.fn((id) => ({
      id: id,
    })),
    addDoc: jest.fn(() => Promise.resolve({ id: "new-beneficiary-id" })),
    updateDoc: jest.fn(() => Promise.resolve()),
  };
});

jest.mock("../firebase/firebaseConfig", () => ({
  auth: {},
  db: {},
}));

jest.mock("../firebase/cloudFunctions", () => ({
  callDeleteBeneficiaryProfile: jest.fn(),
}));

const mockedNavigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockedNavigate,
  useParams: jest.fn(() => ({ docId: '1' })),
}));

const mockUser = {
  uid: "test-admin-uid",
  email: "admin@example.com",
} as User;

describe("Beneficiary Module Integration Tests", () => {
  const { addDoc, updateDoc } = require("firebase/firestore");

  beforeEach(() => {
    addDoc.mockClear();
    updateDoc.mockClear();
    mockedNavigate.mockClear();
  });

  test("creates a beneficiary profile and redirects", async () => {
    render(
      <MemoryRouter>
        <BeneficiaryProfileCreation />
        <ToastContainer />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/ID no./i), { target: { value: "102" } });
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: "Carla" } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: "Cruz" } });
    fireEvent.change(screen.getByLabelText(/Birth Date/i), { target: { value: "2011-03-15" } });
    /* should check the original code for the correct label text */
    fireEvent.change(screen.getByLabelText(/Sex/i), { target: { value: "Female" } });
    fireEvent.change(screen.getByLabelText(/Grade Level/i), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: "789 Bonifacio St" } });

    const guardianCard = screen.getByText(/Guardian 1/i).closest('div')!;
    fireEvent.change(within(guardianCard).getByLabelText(/Name:/i), { target: { value: 'Lina Cruz' } });
    fireEvent.change(within(guardianCard).getByLabelText(/Relation:/i), { target: { value: 'Mother' } });
    fireEvent.change(within(guardianCard).getByLabelText(/Email:/i), { target: { value: 'lina@example.com' } });
    fireEvent.change(within(guardianCard).getByLabelText(/Contact Number:/i), { target: { value: '09333333333' } });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          first_name: "Carla",
          last_name: "Cruz",
          accredited_id: 102,
          guardians: expect.arrayContaining([
            expect.objectContaining({ name: 'Lina Cruz' })
          ])
        })
      );
      expect(mockedNavigate).toHaveBeenCalledWith("/view-profile");
    });
  });

  test("renders beneficiary list correctly", async () => {
    render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter>
          <BeneficiaryList />
        </MemoryRouter>
      </UserContext.Provider>
    );

    expect(await screen.findByText("Profile List")).toBeInTheDocument();
    expect(await screen.findByText(/Santos, Ana/i)).toBeInTheDocument();
    expect(await screen.findByText(/Reyes, Ben/i)).toBeInTheDocument();
  });

  test("updates a beneficiary's profile successfully", async () => {
    jest.requireMock('react-router').useParams.mockReturnValue({ docId: '1' });
    
    render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter initialEntries={["/beneficiary-profile/1"]}>
           <Routes>
            <Route path="/beneficiary-profile/:docId" element={<BeneficiaryProfile />} />
          </Routes>
        </MemoryRouter>
      </UserContext.Provider>
    );

    await screen.findByDisplayValue("123 Rizal Ave");

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/Address:/i), { target: { value: "Updated Address" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1' }),
        expect.objectContaining({
          address: "Updated Address",
        })
      );
    });
  });

  test("deletes a beneficiary account and removes them from the list", async () => {
    jest.requireMock('react-router').useParams.mockReturnValue({ docId: '2' });

    const { unmount } = render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter initialEntries={["/beneficiary-profile/2"]}>
           <Routes>
            <Route path="/beneficiary-profile/:docId" element={<BeneficiaryProfile />} />
          </Routes>
        </MemoryRouter>
      </UserContext.Provider>
    );

    await screen.findByText("Reyes, Ben");

    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: '2' }),
        expect.objectContaining({
          time_to_live: expect.any(Number),
        })
      );
    });

    beneficiaryDocs = beneficiaryDocs.filter(doc => doc.id !== "2");
    
    unmount();

    render(
        <UserContext.Provider value={mockUser}>
          <MemoryRouter>
            <BeneficiaryList />
          </MemoryRouter>
        </UserContext.Provider>
      );
  
    await waitFor(() => {
        expect(screen.getByText(/Santos, Ana/i)).toBeInTheDocument();
        expect(screen.queryByText(/Reyes, Ben/i)).not.toBeInTheDocument();
    });
  });
});