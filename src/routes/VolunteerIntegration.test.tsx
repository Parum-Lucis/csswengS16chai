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
import type { User } from "firebase/auth";

let volunteerDocs = [
  {
    id: "1",
    data: () => ({
      first_name: "Alice",
      last_name: "Smith",
      birthdate: { toDate: () => new Date("2000-01-01") },
      sex: "F",
      is_admin: false,
      email: "alice@example.com",
      address: "123 Main St",
      contact_number: "09123456789",
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
    }),
  },
];

jest.mock("firebase/firestore", () => {
  const originalModule = jest.requireActual("firebase/firestore");
  return {
    ...originalModule,
    collection: jest.fn(),
    getDocs: jest.fn(() => Promise.resolve({ docs: volunteerDocs })),
    getDoc: jest.fn(() =>
      Promise.resolve({
        exists: () => true,
        id: "123",
        data: () => ({
          first_name: "Test",
          last_name: "User",
          birthdate: { seconds: 946684800 }, // Jan 1, 2000
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
  };
});

jest.mock("../firebase/firebaseConfig", () => ({
  auth: {},
  db: {},
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

const mockUser = {
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
} as User;

describe("Volunteer Integration Tests", () => {
  const { callCreateVolunteerProfile, callDeleteVolunteerProfile } = require("../firebase/cloudFunctions");
  const { updateDoc } = require("firebase/firestore");

  beforeEach(() => {
    callCreateVolunteerProfile.mockClear();
    callDeleteVolunteerProfile.mockClear();
    mockedNavigate.mockClear();
    updateDoc.mockClear();
  });

  test("creates a volunteer profile successfully", async () => {
    callCreateVolunteerProfile.mockResolvedValue({ data: true });

    render(
      <MemoryRouter>
        <VolunteerProfileCreation />
        <ToastContainer />
      </MemoryRouter>
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
          contact_number: "09123456789",
          address: "123 Main St",
          sex: "Male",
          role: "Volunteer",
        })
      );
      expect(mockedNavigate).toHaveBeenCalledWith("/view-profile");
    });
  });

  test("renders volunteer list correctly", async () => {
    render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter>
          <VolunteerList />
        </MemoryRouter>
      </UserContext.Provider>
    );

    expect(await screen.findByText("Profile List")).toBeInTheDocument();

    await screen.findByText(/Alice/i);
    await screen.findByText(/Smith/i);
    await screen.findByText(/Bob/i);
    await screen.findByText(/Jones/i);
  });

  test("creates a volunteer and displays in volunteer list", async () => {
    callCreateVolunteerProfile.mockResolvedValue({ data: true });

    volunteerDocs.push({
      id: "3",
      data: () => ({
        first_name: "Charlie",
        last_name: "Wilson",
        birthdate: { toDate: () => new Date("1990-01-01") },
        sex: "M",
        is_admin: false,
      }),
    });

    render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter initialEntries={["/create-profile"]}>
          <Routes>
            <Route path="/create-profile" element={<VolunteerProfileCreation />} />
            <Route path="/view-volunteer-list" element={<VolunteerList />} />
          </Routes>
          <ToastContainer />
        </MemoryRouter>
      </UserContext.Provider>
    );

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "charlie@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "Charlie" },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: "Wilson" },
    });
    fireEvent.change(screen.getByLabelText(/Contact No./i), {
      target: { value: "09999999999" },
    });
    fireEvent.change(screen.getByLabelText(/Address/i), {
      target: { value: "123 Street" },
    });
    fireEvent.change(screen.getByLabelText(/Birth Date/i), {
      target: { value: "1990-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/Sex/i), {
      target: { value: "Male" },
    });
    fireEvent.change(screen.getByLabelText(/Role/i), {
      target: { value: "Volunteer" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(callCreateVolunteerProfile).toHaveBeenCalled();
    });

    render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter initialEntries={["/view-volunteer-list"]}>
          <Routes>
            <Route path="/view-volunteer-list" element={<VolunteerList />} />
          </Routes>
        </MemoryRouter>
      </UserContext.Provider>
    );

    await screen.findByText("Profile List");

    await screen.findByText(/Charlie/i);
    await screen.findByText(/Wilson/i);
  });

  test("updates volunteer profile successfully", async () => {
    render(
      <UserContext.Provider value={mockUser}>
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
    // Use new ID to avoid ID conflict
    volunteerDocs.push({
      id: "4",
      data: () => ({
        first_name: "Eve",
        last_name: "Stone",
        birthdate: { toDate: () => new Date("1992-04-20") },
        sex: "F",
        is_admin: false,
        email: "eve@example.com",
        address: "456 Side St",
        contact_number: "09988887777",
      }),
    });

    const { callDeleteVolunteerProfile } = require("../firebase/cloudFunctions");
    callDeleteVolunteerProfile.mockResolvedValue({ data: true });

    render(
      <UserContext.Provider value={mockUser}>
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

    volunteerDocs = volunteerDocs.filter(doc => doc.id !== "4");

    render(
      <UserContext.Provider value={mockUser}>
        <MemoryRouter>
          <VolunteerList />
        </MemoryRouter>
      </UserContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Eve/i)).not.toBeInTheDocument();
    });
  });
});
