/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NavigationBar from "../components/NavigationBar";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { UserContext } from "../context/userContext";
import type { User } from "firebase/auth";

const mockUser: User = {
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
  toJSON: jest.fn()
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
  it("renders navigation links when user is present", () => {
    renderWithProviders(<NavigationBar />, mockUser);

    const expectedLinks = [
      "Admin",
      "Search",
      "Beneficiaries",
      "You",
      "Events",
      "Calendar",
    ];

    expectedLinks.forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  it("does not render anything when user is null", () => {
    renderWithProviders(<NavigationBar />, null);
    expect(screen.queryByText("Admin")).toBeNull();
  });

  it("applies hover class styles", () => {
    renderWithProviders(<NavigationBar />, mockUser);
    const link = screen.getByText("Admin");
    expect(link.className).toMatch(/hover:translate-y-\[-5px\]/);
  });

  it("navigates to correct route on click", async () => {
    const user = userEvent.setup();
    render(
        <UserContext.Provider value={mockUser}>
        <MemoryRouter initialEntries={["/"]}>
            <Routes>
            <Route path="/" element={<NavigationBar />} />
            <Route path="/view-beneficiary-list" element={<div>Beneficiaries Page</div>} />
            </Routes>
        </MemoryRouter>
        </UserContext.Provider>
    );

    const link = screen.getByText("Beneficiaries");
    await user.click(link);

    expect(await screen.findByText("Beneficiaries Page")).toBeInTheDocument();
    });
});
