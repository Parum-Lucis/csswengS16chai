/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { UserContext } from "../util/userContext";
import type { User } from "firebase/auth";

const mockNavigate = jest.fn();

jest.mock("react-router", () => {
  const actual = jest.requireActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("../components/NavigationBar", () => () => <div>MockNavigationBar</div>);

const fullMockUser: User & { is_admin: boolean } = {
  uid: "123",
  email: "test@example.com",
  emailVerified: true,
  isAnonymous: false,
  providerData: [],
  metadata: {
    creationTime: "now",
    lastSignInTime: "now"
  },
  refreshToken: "mock-refresh-token",
  displayName: "Test User",
  phoneNumber: null,
  photoURL: null,
  tenantId: null,
  providerId: "firebase",
  delete: jest.fn(),
  getIdToken: jest.fn(),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn(),
  is_admin: true
};

describe("AuthLayout", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders nothing when user is undefined", () => {
    const { container } = render(
      <UserContext.Provider value={undefined}>
        <MemoryRouter>
          <AuthLayout />
        </MemoryRouter>
      </UserContext.Provider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("redirects to / when user is null", () => {
    render(
      <UserContext.Provider value={null}>
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route path="/protected" element={<AuthLayout />} />
          </Routes>
        </MemoryRouter>
      </UserContext.Provider>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("renders Outlet and NavigationBar when user is logged in", () => {
    render(
      <UserContext.Provider value={fullMockUser}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<AuthLayout />}>
              <Route index element={<div>ProtectedContent</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </UserContext.Provider>
    );

    expect(screen.getByText("ProtectedContent")).toBeInTheDocument();
    expect(screen.getByText("MockNavigationBar")).toBeInTheDocument();
  });

  it("does not redirect if user is defined", () => {
    render(
      <UserContext.Provider value={fullMockUser}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<AuthLayout />}>
              <Route index element={<div>ProtectedContent</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </UserContext.Provider>
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not render NavigationBar when user is undefined", () => {
    const { container } = render(
      <UserContext.Provider value={undefined}>
        <MemoryRouter>
          <AuthLayout />
        </MemoryRouter>
      </UserContext.Provider>
    );

    expect(container).not.toHaveTextContent("MockNavigationBar");
  });
});
