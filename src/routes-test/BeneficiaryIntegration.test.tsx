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
import { UserContext } from "../util/userContext";
import type { User } from "firebase/auth";
import { type UserStateType } from "../util/userContext";

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => `mock-uuid-${Math.random()}`,
  },
  configurable: true,
});

jest.mock('firebase/storage', () => ({
  ref: jest.fn(() => ({})),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getBlob: jest.fn(() => Promise.resolve(new Blob())),
  deleteObject: jest.fn(() => Promise.resolve()),
}));


const getInitialBeneficiaryDocs = () => [
  {
    id: "1",
    exists: () => true,
    data: () => ({
      docID: "1",
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
    exists: () => true,
    data: () => ({
      docID: "2",
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

let beneficiaryDocs = getInitialBeneficiaryDocs();

jest.mock("firebase/firestore", () => {
    const originalModule = jest.requireActual("firebase/firestore");
    const mockCollectionRef = { _type: 'beneficiariesCollection' };
    const mockCollectionGroupRef = { _type: 'attendeesCollectionGroup' };

    return {
        ...originalModule,
        collection: jest.fn(() => mockCollectionRef),
        collectionGroup: jest.fn(() => mockCollectionGroupRef),
        getDocs: jest.fn((q) => {
            if (q._ref === mockCollectionRef) {
                return Promise.resolve({
                    docs: beneficiaryDocs,
                    forEach: (callback: (doc: any) => void) => beneficiaryDocs.forEach(callback),
                });
            }
            return Promise.resolve({
                docs: [],
                forEach: (callback: (doc: any) => void) => [].forEach(callback),
            });
        }),
        getDoc: jest.fn((docRef) => {
            const id = docRef.id;
            const doc = beneficiaryDocs.find(b => b.id === id);
            if (doc) { return Promise.resolve(doc); }
            return Promise.resolve({ exists: () => false });
        }),
        doc: jest.fn((db, path, id) => ({
            id: id,
            path: `${path}/${id}`,
            withConverter: jest.fn().mockReturnThis(),
        })),
        query: jest.fn((ref) => ({
            _ref: ref,
            withConverter: jest.fn().mockReturnThis(),
        })),
        where: jest.fn(),
        addDoc: jest.fn((collectionRef, newData) => {
            const newId = `new-${Math.random()}`;
            beneficiaryDocs.push({ id: newId, exists: () => true, data: () => ({...newData, docID: newId}) });
            return Promise.resolve({ id: newId });
        }),
        updateDoc: jest.fn((docRef, data) => {
            const docIndex = beneficiaryDocs.findIndex(doc => doc.id === docRef.id);
            if (docIndex > -1) {
                const existingData = beneficiaryDocs[docIndex].data();
                beneficiaryDocs[docIndex] = {
                    ...beneficiaryDocs[docIndex],
                    data: () => ({ ...existingData, ...data }),
                };
            }
            return Promise.resolve();
        }),
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
  useParams: jest.fn(),
}));

const mockAdminUser: UserStateType = {
    uid: "test-admin-uid",
    email: "admin@example.com",
    is_admin: true,
} as User & { is_admin: boolean };

const mockVolunteerUser: UserStateType = {
    uid: "test-volunteer-uid",
    email: "volunteer@example.com",
    is_admin: false,
} as User & { is_admin: boolean };


describe("Admin Beneficiary Management", () => {
    const { addDoc, updateDoc } = require("firebase/firestore");
    const { useParams } = require("react-router");

    beforeEach(() => {
        addDoc.mockClear();
        updateDoc.mockClear();
        mockedNavigate.mockClear();
        useParams.mockClear();
        beneficiaryDocs = getInitialBeneficiaryDocs();
    });

    test("admin can create a beneficiary profile and is redirected", async () => {
        render(
            <UserContext.Provider value={mockAdminUser}>
                <MemoryRouter>
                    <BeneficiaryProfileCreation />
                    <ToastContainer />
                </MemoryRouter>
            </UserContext.Provider>
        );

        fireEvent.change(screen.getByLabelText(/ID no./i), { target: { value: "102" } });
        fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: "Carla" } });
        fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: "Cruz" } });
        fireEvent.change(screen.getByLabelText(/Birth Date/i), { target: { value: "2011-03-15" } });
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
            })
          );
          expect(mockedNavigate).toHaveBeenCalledWith("/beneficiary");
        });
    });

    // modified
    test("admin can view the list and navigate to a profile", async () => {
      jest.requireMock('react-router').useParams.mockReturnValue({ docId: '1' });
      render(
        <UserContext.Provider value={mockAdminUser}>
          <MemoryRouter initialEntries={['/beneficiaries']}>
            <Routes>
              <Route path="/beneficiaries" element={<BeneficiaryList />} />
              <Route path="/beneficiaries/:docId" element={<BeneficiaryProfile />} />
            </Routes>
          </MemoryRouter>
        </UserContext.Provider>
      );
  
      const profileLink = await screen.findByText(/Santos, Ana/i);
      expect(screen.getByText(/Reyes, Ben/i)).toBeInTheDocument();
      
      fireEvent.click(profileLink);
  
      expect(await screen.findByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue("123 Rizal Ave")).toBeInTheDocument();
    });

    test("admin can update a beneficiary's profile", async () => {
        jest.requireMock('react-router').useParams.mockReturnValue({ docId: '1' });

        render(
          <UserContext.Provider value={mockAdminUser}>
            <MemoryRouter initialEntries={["/beneficiary/1"]}>
               <Routes>
                <Route path="/beneficiary/:docId" element={<BeneficiaryProfile />} />
              </Routes>
              <ToastContainer/>
            </MemoryRouter>
          </UserContext.Provider>
        );

        await screen.findByDisplayValue("123 Rizal Ave");
        fireEvent.click(screen.getByRole("button", { name: /edit/i }));
        fireEvent.change(screen.getByLabelText(/Address:/i), { target: { value: "Updated Address" } });
        fireEvent.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => {
          expect(updateDoc).toHaveBeenCalledWith(
            expect.objectContaining({ id: '1' }),
            expect.objectContaining({ address: "Updated Address" })
          );
        });
    });

    test("admin can delete a beneficiary account", async () => {
        jest.requireMock('react-router').useParams.mockReturnValue({ docId: '2' });
        const { unmount } = render(
          <UserContext.Provider value={mockAdminUser}>
            <MemoryRouter initialEntries={["/beneficiary/2"]}>
               <Routes>
                <Route path="/beneficiary/:docId" element={<BeneficiaryProfile />} />
              </Routes>
              <ToastContainer/>
            </MemoryRouter>
          </UserContext.Provider>
        );

        await screen.findByText("Reyes, Ben");
        fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
        fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

        await waitFor(() => {
          expect(updateDoc).toHaveBeenCalledWith(
            expect.objectContaining({ id: '2' }),
            expect.objectContaining({ time_to_live: expect.any(Object) })
          );
        });

        beneficiaryDocs = beneficiaryDocs.filter(doc => doc.id !== "2");
        unmount();

        render(
            <UserContext.Provider value={mockAdminUser}>
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


describe("Volunteer Beneficiary Management", () => {
    const { addDoc, updateDoc } = require("firebase/firestore");

    beforeEach(() => {
        addDoc.mockClear();
        updateDoc.mockClear();
        mockedNavigate.mockClear();
        beneficiaryDocs = getInitialBeneficiaryDocs();
    });

    test("volunteer can create a beneficiary profile and is redirected", async () => {
        render(
            <UserContext.Provider value={mockVolunteerUser}>
                <MemoryRouter>
                    <BeneficiaryProfileCreation />
                    <ToastContainer />
                </MemoryRouter>
            </UserContext.Provider>
        );
        
        fireEvent.change(screen.getByLabelText(/ID no./i), { target: { value: "103" } });
        fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: "David" } });
        fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: "Lee" } });
        fireEvent.change(screen.getByLabelText(/Birth Date/i), { target: { value: "2012-08-20" } });
        fireEvent.change(screen.getByLabelText(/Sex/i), { target: { value: "Male" } });
        fireEvent.change(screen.getByLabelText(/Grade Level/i), { target: { value: "2" } });
        fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: "101 Aguinaldo St" } });
    
        const guardianCard = screen.getByText(/Guardian 1/i).closest('div')!;
        fireEvent.change(within(guardianCard).getByLabelText(/Name:/i), { target: { value: 'Susan Lee' } });
        fireEvent.change(within(guardianCard).getByLabelText(/Relation:/i), { target: { value: 'Mother' } });
        fireEvent.change(within(guardianCard).getByLabelText(/Email:/i), { target: { value: 'susan@example.com' } });
        fireEvent.change(within(guardianCard).getByLabelText(/Contact Number:/i), { target: { value: '09444444444' } });
    
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    
        await waitFor(() => {
          expect(addDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
              first_name: "David",
              last_name: "Lee",
            })
          );
          expect(mockedNavigate).toHaveBeenCalledWith("/beneficiary");
        });
    });

    test("volunteer can view the list and navigate to a profile", async () => {
      render(
        <UserContext.Provider value={mockVolunteerUser}>
          <MemoryRouter initialEntries={['/beneficiaries']}>
            <Routes>
              <Route path="/beneficiaries" element={<BeneficiaryList />} />
              <Route path="/beneficiaries/:docId" element={<BeneficiaryProfile />} />
            </Routes>
          </MemoryRouter>
        </UserContext.Provider>
      );
  
      const profileLink = await screen.findByText(/Reyes, Ben/i);
      expect(screen.getByText(/Santos, Ana/i)).toBeInTheDocument();
      
      fireEvent.click(profileLink);
  
      expect(await screen.findByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue("456 Mabini St")).toBeInTheDocument();
    });

    test("volunteer can update a beneficiary's profile", async () => {
        jest.requireMock('react-router').useParams.mockReturnValue({ docId: '1' });

        render(
          <UserContext.Provider value={mockVolunteerUser}>
            <MemoryRouter initialEntries={["/beneficiary/1"]}>
               <Routes>
                <Route path="/beneficiary/:docId" element={<BeneficiaryProfile />} />
              </Routes>
              <ToastContainer/>
            </MemoryRouter>
          </UserContext.Provider>
        );

        await screen.findByDisplayValue("123 Rizal Ave");
        fireEvent.click(screen.getByRole("button", { name: /edit/i }));
        fireEvent.change(screen.getByLabelText(/Address:/i), { target: { value: "Volunteer Updated Address" } });
        fireEvent.click(screen.getByRole("button", { name: /save/i }));

        await waitFor(() => {
          expect(updateDoc).toHaveBeenCalledWith(
            expect.objectContaining({ id: '1' }),
            expect.objectContaining({ address: "Volunteer Updated Address" })
          );
        });
    });

    test("volunteer can delete a beneficiary account", async () => {
        jest.requireMock('react-router').useParams.mockReturnValue({ docId: '2' });
        const { unmount } = render(
          <UserContext.Provider value={mockVolunteerUser}>
            <MemoryRouter initialEntries={["/beneficiary/2"]}>
               <Routes>
                <Route path="/beneficiary/:docId" element={<BeneficiaryProfile />} />
              </Routes>
              <ToastContainer/>
            </MemoryRouter>
          </UserContext.Provider>
        );

        await screen.findByText("Reyes, Ben");
        fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
        fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

        await waitFor(() => {
          expect(updateDoc).toHaveBeenCalledWith(
            expect.objectContaining({ id: '2' }),
            expect.objectContaining({ time_to_live: expect.any(Object) })
          );
        });
        
        beneficiaryDocs = beneficiaryDocs.filter(doc => doc.id !== "2");
        unmount();

        render(
            <UserContext.Provider value={mockVolunteerUser}>
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