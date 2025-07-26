/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NavigationBar from "../components/NavigationBar";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { UserContext } from "../util/userContext";
import type { User } from "firebase/auth";

const mockUser: User & { is_admin: boolean } = {
  uid: "123",
  email: "test@example.com",
  displayName: "Test User",
  emailVerified: true,
  isAnonymous: false,
  phoneNumber: null,
  photoURL: null,
  providerData: [],
  metadata: {
    creationTime: "now",
    lastSignInTime: "now"
  },
  providerId: "firebase",
  refreshToken: "fake-refresh-token",
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn().mockResolvedValue("fake-token"),
  getIdTokenResult: jest.fn().mockResolvedValue({}),
  reload: jest.fn(),
  toJSON: jest.fn(),

  is_admin: true
};

const mockNonAdminUser: User & { is_admin: boolean } = {
  ...mockUser,
  is_admin: false
};

const renderWithProviders = (ui: React.ReactNode, userValue: any, initialRoute = "/") => {
  window.history.pushState({}, "Test page", initialRoute);
  return render(
    <UserContext.Provider value={userValue}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {ui}
      </MemoryRouter>
    </UserContext.Provider>
  );
};

describe("Navigation Bar", () => {
  test("renders navigation links when admin user is present", () => {
    renderWithProviders(<NavigationBar />, mockUser);

    const expectedLinks = [
      "You",
      "Admin",
      "Beneficiaries",
      "Events",
      "Calendar",
    ];

    expectedLinks.forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  test("renders navigation links without Admin when non-admin user is present", () => {
    renderWithProviders(<NavigationBar />, mockNonAdminUser);

    const expectedLinks = [
      "You",
      "Beneficiaries", 
      "Events",
      "Calendar",
    ];

    expectedLinks.forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });

    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  test("renders navigation bar even when user is null", () => {
    renderWithProviders(<NavigationBar />, null);
    
    const expectedLinks = [
      "You",
      "Beneficiaries",
      "Events", 
      "Calendar",
    ];

    expectedLinks.forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });

    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  test("applies hover class styles to navigation links", () => {
    renderWithProviders(<NavigationBar />, mockUser);
    const adminLink = screen.getByRole('link', { name: /admin/i });
    expect(adminLink.className).toMatch(/hover:translate-y-\[-5px\]/);
  });

  test("navigates to correct route on click", async () => {
    const user = userEvent.setup();
    render(
        <UserContext.Provider value={mockUser}>
        <MemoryRouter initialEntries={["/"]}>
            <Routes>
            <Route path="/" element={<NavigationBar />} />
            <Route path="/beneficiary" element={<div>Beneficiaries Page</div>} />
            </Routes>
        </MemoryRouter>
        </UserContext.Provider>
    );

    const link = screen.getByRole('link', { name: /beneficiaries/i });
    await user.click(link);

    expect(await screen.findByText("Beneficiaries Page")).toBeInTheDocument();
  });

  test("applies active styles to current route", () => {
    renderWithProviders(<NavigationBar />, mockUser, "/admin");
    const adminLink = screen.getByRole('link', { name: /admin/i });
    expect(adminLink.className).toMatch(/text-amber-300/);
  });
});