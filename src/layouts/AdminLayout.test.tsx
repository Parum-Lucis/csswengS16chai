/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { useContext } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { AdminLayout } from './AdminLayout';
import { UserContext } from '../util/userContext';

// Mock dependencies
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

jest.mock('react-router', () => ({
  Outlet: () => <div data-testid="outlet">Admin Content</div>,
  useNavigate: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    warn: jest.fn(),
  },
}));

// Type the mocked functions
const mockUseContext = useContext as jest.MockedFunction<typeof useContext>;
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;
const mockToastWarn = toast.warn as jest.MockedFunction<typeof toast.warn>;

describe('AdminLayout', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  it('renders empty fragment when user is undefined', () => {
    mockUseContext.mockReturnValue(undefined);

    const { container } = render(<AdminLayout />);

    expect(container.firstChild).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockToastWarn).not.toHaveBeenCalled();
  });

  it('navigates to root and renders empty fragment when user is null', () => {
    mockUseContext.mockReturnValue(null);

    const { container } = render(<AdminLayout />);

    expect(container.firstChild).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockToastWarn).not.toHaveBeenCalled();
  });

  it('navigates to profile and shows warning when user is not admin', () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      is_admin: false,
    };
    mockUseContext.mockReturnValue(mockUser);

    const { container } = render(<AdminLayout />);

    expect(container.firstChild).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/me');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockToastWarn).toHaveBeenCalledWith('You are not an admin!');
    expect(mockToastWarn).toHaveBeenCalledTimes(1);
  });

  it('renders Outlet when user is admin', () => {
    const mockUser = {
      id: 1,
      name: 'Admin User',
      is_admin: true,
    };
    mockUseContext.mockReturnValue(mockUser);

    render(<AdminLayout />);

    expect(screen.getByTestId('outlet')).toBeTruthy();
    expect(screen.getByText('Admin Content')).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockToastWarn).not.toHaveBeenCalled();
  });

  it('uses UserContext correctly', () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      is_admin: true,
    };
    mockUseContext.mockReturnValue(mockUser);

    render(<AdminLayout />);

    expect(mockUseContext).toHaveBeenCalledWith(UserContext);
  });

  describe('Navigation behavior', () => {
    it('calls navigate with correct path for unauthorized users', () => {
      const mockUser = {
        id: 1,
        name: 'Regular User',
        is_admin: false,
      };
      mockUseContext.mockReturnValue(mockUser);

      render(<AdminLayout />);

      expect(mockNavigate).toHaveBeenCalledWith('/me');
    });

    it('calls navigate with correct path for null users', () => {
      mockUseContext.mockReturnValue(null);

      render(<AdminLayout />);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Toast notifications', () => {
    it('shows warning toast only for non-admin users', () => {
      const mockUser = {
        id: 1,
        name: 'Regular User',
        is_admin: false,
      };
      mockUseContext.mockReturnValue(mockUser);

      render(<AdminLayout />);

      expect(mockToastWarn).toHaveBeenCalledWith('You are not an admin!');
    });

    it('does not show toast for null or undefined users', () => {
      // Test null user
      mockUseContext.mockReturnValue(null);
      render(<AdminLayout />);
      expect(mockToastWarn).not.toHaveBeenCalled();

      // Reset and test undefined user
      jest.clearAllMocks();
      mockUseContext.mockReturnValue(undefined);
      render(<AdminLayout />);
      expect(mockToastWarn).not.toHaveBeenCalled();
    });

    it('does not show toast for admin users', () => {
      const mockUser = {
        id: 1,
        name: 'Admin User',
        is_admin: true,
      };
      mockUseContext.mockReturnValue(mockUser);

      render(<AdminLayout />);

      expect(mockToastWarn).not.toHaveBeenCalled();
    });
  });
});