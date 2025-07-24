/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { YourProfile } from "../routes/YourProfile";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { VolunteerProfileCreation } from "../routes/ProfileCreation";
import { VolunteerList } from "../routes/ProfileList";
import { ToastContainer } from "react-toastify";
import { UserContext } from '../util/userContext';
import type { UserStateType } from '../util/userContext';
import type { User } from "firebase/auth";

// Define a type for our mock Firestore documents
type MockDoc = {
  id: string;
  data: () => {
    first_name: string;
    last_name: string;
    birthdate?: { toDate: () => Date };
    sex?: string;
    is_admin?: boolean;
    email?: string;
    address?: string;
    contact_number?: string;
    role?: string;
  };
};

let volunteerDocs: MockDoc[];

jest.mock("firebase/firestore", () => {
    const originalModule = jest.requireActual("firebase/firestore");
    const mockQuery = {
        withConverter: jest.fn().mockReturnThis(),
    };
    return {
        ...originalModule,
        collection: jest.fn(),
        getDocs: jest.fn(),
        getDoc: jest.fn(() =>
            Promise.resolve({
                exists: () => true,
                id: "123",
                data: () => ({
                    first_name: "Test",
                    last_name: "User",
                    birthdate: { seconds: 946684800 },
                    sex: "F",
                    is_admin: false,
                    email: "test@example.com",
                    address: "Original Address",
                    contact_number: "09123456789",
                }),
            })
        ),
        doc: jest.fn(() => ({})),
        updateDoc: jest.fn(() => Promise.resolve()),
        query: jest.fn(() => mockQuery),
        where: jest.fn(),
    };
});

jest.mock("../firebase/firebaseConfig", () => ({
    auth: {},
    db: {
        _settings: { host: "localhost:8080", ssl: false },
    },
    func: {},
}));

jest.mock("../firebase/cloudFunctions", () => ({
    callCreateVolunteerProfile: jest.fn(),
    callDeleteVolunteerProfile: jest.fn(),
}));

const mockedNavigate = jest.fn();
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigate: () => mockedNavigate,
}));

const mockAdminUser: UserStateType = {
  uid: "123",
  email: "test@example.com",
  emailVerified: true,
  isAnonymous: false,
  providerData: [],
  metadata: {} as User["metadata"],
  getIdToken: async () => "mock-token",
  getIdTokenResult: async () => ({
    authTime: "mock-auth-time",
    expirationTime: "mock-expiration-time",
    issuedAtTime: "mock-issued-time",
    signInProvider: "password",
    signInSecondFactor: null,
    claims: {},
    token: "mock-token",
  }),
  reload: async () => {},
  refreshToken: "mock-refresh",
  toJSON: () => ({}),
  displayName: "Test User",
  phoneNumber: null,
  photoURL: null,
  providerId: "firebase",
  tenantId: null,
  delete: async () => {},
  is_admin: true,
} as User & { is_admin: boolean };

const mockVolunteerUser: UserStateType = {
    ...mockAdminUser,
    is_admin: false,
} as User & { is_admin: boolean };

describe("Volunteer Integration Tests", () => {
    const { callCreateVolunteerProfile, callDeleteVolunteerProfile } = require("../firebase/cloudFunctions");
    const { updateDoc, getDocs } = require("firebase/firestore");

    beforeEach(() => {
        volunteerDocs = [
            {
                id: "1",
                data: () => ({
                    first_name: "Alice",
                    last_name: "Smith",
                    birthdate: { toDate: () => new Date("2000-01-01") },
                    sex: "F",
                    is_admin: false,
                    role: 'Volunteer',
                }),
            },
            {
                id: "2",
                data: () => ({
                    first_name: "Bob",
                    last_name: "Jones",
                    birthdate: { toDate: () => new Date("1995-06-15") },
                    sex: "M",
                    is_admin: true,
                    role: 'Admin',
                }),
            },
        ];
        getDocs.mockImplementation(() => Promise.resolve({ docs: volunteerDocs }));
        callCreateVolunteerProfile.mockClear();
        callDeleteVolunteerProfile.mockClear();
        mockedNavigate.mockClear();
        updateDoc.mockClear();
    });

    test("creates a volunteer profile successfully", async () => {
        callCreateVolunteerProfile.mockResolvedValue({ data: true });

        render(
          <UserContext.Provider value={mockAdminUser}>
            <MemoryRouter>
              <VolunteerProfileCreation />
              <ToastContainer />
            </MemoryRouter>
          </UserContext.Provider>
        );

        fireEvent.change(screen.getByLabelText(/Email/i), {
          target: { value: "test@example.com" },
        });
        fireEvent.change(screen.getByLabelText(/First Name/i), {
          target: { value: "John" },
        });
        fireEvent.change(screen.getByLabelText(/Last Name/i), {
          target: { value: "Doe" },
        });
        fireEvent.change(screen.getByLabelText(/Contact No./i), {
          target: { value: "09123456789" },
        });
        fireEvent.change(screen.getByLabelText(/Address/i), {
          target: { value: "123 Main St" },
        });
        fireEvent.change(screen.getByLabelText(/Birth Date/i), {
          target: { value: "2000-01-01" },
        });
        fireEvent.change(screen.getByLabelText(/Sex/i), {
          target: { value: "Male" },
        });
        fireEvent.change(screen.getByLabelText(/Role/i), {
          target: { value: "Volunteer" },
        });

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
          expect(callCreateVolunteerProfile).toHaveBeenCalledWith(
            expect.objectContaining({
              email: "test@example.com",
              first_name: "John",
              last_name: "Doe",
            })
          );
          expect(mockedNavigate).toHaveBeenCalledWith("/admin");
        });
      });

      test("creates an admin profile successfully", async () => {
        callCreateVolunteerProfile.mockResolvedValue({ data: true });

        render(
          <UserContext.Provider value={mockAdminUser}>
            <MemoryRouter>
              <VolunteerProfileCreation />
              <ToastContainer />
            </MemoryRouter>
          </UserContext.Provider>
        );

        fireEvent.change(screen.getByLabelText(/Email/i), {
          target: { value: "admin@example.com" },
        });
        fireEvent.change(screen.getByLabelText(/First Name/i), {
          target: { value: "Admin" },
        });
        fireEvent.change(screen.getByLabelText(/Last Name/i), {
          target: { value: "User" },
        });
        fireEvent.change(screen.getByLabelText(/Contact No./i), {
            target: { value: "09123456789" },
        });
        fireEvent.change(screen.getByLabelText(/Address/i), {
            target: { value: "123 Main St" },
        });
        fireEvent.change(screen.getByLabelText(/Birth Date/i), {
            target: { value: "2000-01-01" },
        });
        fireEvent.change(screen.getByLabelText(/Sex/i), {
            target: { value: "Female" },
        });
        fireEvent.change(screen.getByLabelText(/Role/i), {
          target: { value: "Admin" },
        });

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
          expect(callCreateVolunteerProfile).toHaveBeenCalledWith(
            expect.objectContaining({
              email: "admin@example.com",
              is_admin: true,
            })
          );
          expect(mockedNavigate).toHaveBeenCalledWith("/admin");
        });
      });

    test("renders volunteer list correctly", async () => {
        render(
            <UserContext.Provider value={mockAdminUser}>
                <MemoryRouter>
                    <VolunteerList />
                </MemoryRouter>
            </UserContext.Provider>
        );

        expect(await screen.findByText(/Alice/i)).toBeInTheDocument();
        expect(screen.getByText(/Smith/i)).toBeInTheDocument();
        expect(screen.getByText(/Bob/i)).toBeInTheDocument();
        expect(screen.getByText(/Jones/i)).toBeInTheDocument();
    });

    test("creates a volunteer and displays in volunteer list", async () => {
        callCreateVolunteerProfile.mockResolvedValue({ data: true });

        render(
            <UserContext.Provider value={mockAdminUser}>
                <MemoryRouter initialEntries={["/admin/volunteer/new"]}>
                    <Routes>
                        <Route path="/admin/volunteer/new" element={<VolunteerProfileCreation />} />
                        <Route path="/admin/volunteer" element={<VolunteerList />} />
                    </Routes>
                    <ToastContainer />
                </MemoryRouter>
            </UserContext.Provider>
        );
        
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "charlie@example.com" } });
        fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: "Charlie" } });
        fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: "Wilson" } });
        fireEvent.change(screen.getByLabelText(/Contact No./i), { target: { value: "09999999999" } });
        fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: "123 Street" } });
        fireEvent.change(screen.getByLabelText(/Birth Date/i), { target: { value: "1990-01-01" } });
        fireEvent.change(screen.getByLabelText(/Sex/i), { target: { value: "Male" } });
        fireEvent.change(screen.getByLabelText(/Role/i), { target: { value: "Volunteer" } });

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(callCreateVolunteerProfile).toHaveBeenCalled();
        });

        // This is the fix: ensure all necessary data is present in the new mock document
        volunteerDocs.push({
            id: "3",
            data: () => ({
                first_name: "Charlie",
                last_name: "Wilson",
                birthdate: { toDate: () => new Date("1990-01-01") },
                sex: "M",
                is_admin: false,
                role: 'Volunteer',
            }),
        });
        getDocs.mockImplementation(() => Promise.resolve({ docs: volunteerDocs }));

        render(
            <UserContext.Provider value={mockAdminUser}>
                <MemoryRouter initialEntries={["/admin/volunteer"]}>
                    <Routes>
                        <Route path="/admin/volunteer" element={<VolunteerList />} />
                    </Routes>
                </MemoryRouter>
            </UserContext.Provider>
        );

        expect(await screen.findByText(/Charlie/i)).toBeInTheDocument();
        expect(screen.getByText(/Wilson/i)).toBeInTheDocument();
    });

    test("updates volunteer profile successfully", async () => {
        render(
          <UserContext.Provider value={mockVolunteerUser}>
            <MemoryRouter>
              <YourProfile />
            </MemoryRouter>
          </UserContext.Provider>
        );
    
        await screen.findByDisplayValue("test@example.com");
    
        fireEvent.click(screen.getByRole("button", { name: /edit/i }));
        fireEvent.change(screen.getByLabelText(/Address/i), {
          target: { value: "Updated Address" },
        });
        fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    
        await waitFor(() => {
          expect(updateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            address: "Updated Address",
          }));
        });
      });
    
      test("deletes a volunteer account and removes from list", async () => {
        callDeleteVolunteerProfile.mockResolvedValue({ data: true });
    
        render(
          <UserContext.Provider value={mockVolunteerUser}>
            <MemoryRouter>
              <YourProfile />
            </MemoryRouter>
          </UserContext.Provider>
        );
    
        await screen.findByDisplayValue("test@example.com");
    
        fireEvent.click(screen.getByText(/delete account/i));
        fireEvent.click(screen.getByText(/confirm delete/i));
    
        await waitFor(() => {
          expect(callDeleteVolunteerProfile).toHaveBeenCalledWith("123");
        });
    
        volunteerDocs = volunteerDocs.filter(doc => doc.data().first_name !== "Alice");
        getDocs.mockImplementation(() => Promise.resolve({ docs: volunteerDocs }));
    
    
        render(
          <UserContext.Provider value={mockAdminUser}>
            <MemoryRouter>
              <VolunteerList />
            </MemoryRouter>
          </UserContext.Provider>
        );
    
        await waitFor(() => {
          expect(screen.queryByText(/Alice/i)).not.toBeInTheDocument();
        });
      });
});