/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useNavigate } from 'react-router';
import { VolunteerList } from '../routes/ProfileList';
import { UserContext } from '../util/userContext';
import { getDocs } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  where: jest.fn(),
  query: jest.fn(() => ({
    withConverter: jest.fn().mockReturnThis(),
  })),
}));

jest.mock('../firebase/firebaseConfig', () => ({
  db: {},
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Volunteer List Page', () => {
  const mockNavigate = jest.fn();
  const mockVolunteers = [
    {
      id: '1',
      data: () => ({
        docID: '1',
        first_name: 'Test',
        last_name: 'Admin',
        role: 'Admin',
        birthdate: { toDate: () => new Date('1990-01-01') },
      }),
    },
    {
      id: '2',
      data: () => ({
        docID: '2',
        first_name: 'Another',
        last_name: 'Volunteer',
        role: 'Volunteer',
        birthdate: { toDate: () => new Date('1995-01-01') },
      }),
    },
    {
      id: '2',
      data: () => ({
        docID: '3',
        first_name: 'Next',
        last_name: null,
        role: 'Volunteer',
      }),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (getDocs as jest.Mock).mockResolvedValue({ docs: mockVolunteers });
  });

  function renderVolunteerWithUser(user: any) {
    return render(
      <BrowserRouter>
        <UserContext.Provider value={user}>
          <VolunteerList />
        </UserContext.Provider>
      </BrowserRouter>
    );
  }

  test('renders title, filter, sort, and search inputs', () => {
    renderVolunteerWithUser({ email: 'user@test.com' });

    expect(screen.getByRole('heading', { name: /volunteer list/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Filter By')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sort by')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  test('shows "Fetching..." initially', () => {
    (getDocs as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderVolunteerWithUser({ email: 'user@test.com' });
    expect(screen.getByText(/fetching/i)).toBeInTheDocument();
  });

  test('renders volunteer cards after fetching', async () => {
    renderVolunteerWithUser({ email: 'user@test.com' });
    await waitFor(() => {
      expect(screen.getByText(/Admin, Test/i)).toBeInTheDocument();
      expect(screen.getByText(/Volunteer, Another/i)).toBeInTheDocument();
    });
  });

  test('filters by admin type', async () => {
    renderVolunteerWithUser({ email: 'user@test.com' });
    await waitFor(() => screen.getByText(/Another/i));

    fireEvent.change(screen.getByDisplayValue('Filter By'), {
      target: { value: 'admin' },
    });

    expect(screen.getByText(/Admin, Test/i)).toBeInTheDocument();
    expect(screen.queryByText(/Volunteer, Another/i)).not.toBeInTheDocument();
  });

  test('filters by non-admin volunteers', async () => {
    renderVolunteerWithUser({ email: 'user@test.com' });
    await waitFor(() => screen.getByText(/Test/i));

    fireEvent.change(screen.getByDisplayValue('Filter By'), {
      target: { value: 'volunteer' },
    });

    expect(screen.getByText(/Volunteer, Another/i)).toBeInTheDocument();
    expect(screen.queryByText(/Admin, Test/i)).not.toBeInTheDocument();
  });

  test('sorts volunteers by first name', async () => {
    renderVolunteerWithUser({ email: 'user@test.com' });
    await waitFor(() => screen.getByText(/Test/i));

    fireEvent.change(screen.getByDisplayValue('Sort by'), {
      target: { value: 'first' },
    });
    
    const profileCards = screen.getAllByRole('link');
    expect(profileCards[0]).toHaveTextContent(/Another/i);
    expect(profileCards[1]).toHaveTextContent(/Test/i);
  });

  test('sorts volunteers by last name', async () => {
    renderVolunteerWithUser({ email: 'user@test.com' });
    await waitFor(() => screen.getByText(/Another/i));

    fireEvent.change(screen.getByDisplayValue('Sort by'), {
      target: { value: 'last' },
    });

    const profileCards = screen.getAllByRole('link');
    expect(profileCards[0]).toHaveTextContent(/Admin/i);
    expect(profileCards[1]).toHaveTextContent(/Volunteer/i);
  });

  test('sorts volunteers by age', async () => {
    renderVolunteerWithUser({ email: 'user@test.com' });
    await waitFor(() => screen.getByText(/Test/i));

    fireEvent.change(screen.getByDisplayValue('Sort by'), {
      target: { value: 'age' },
    });
    
    const profileCards = screen.getAllByRole('link');
    expect(profileCards[0]).toHaveTextContent(/Another/i); // 1995 is younger
    expect(profileCards[1]).toHaveTextContent(/Test/i); // 1990 is older
  });

  test('searches volunteer by name substring', async () => {
    renderVolunteerWithUser({ email: 'user@test.com' });
    await waitFor(() => screen.getByText(/Test/i));

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Another' } });

    await waitFor(() => {
      expect(screen.getByText(/Volunteer, Another/i)).toBeInTheDocument();
      expect(screen.queryByText(/Admin, Test/i)).not.toBeInTheDocument();
    });
  });

  test('skips profiles with missing essential values', async () => {
    renderVolunteerWithUser({ email: 'user@test.com' });

    await waitFor(() => {
      expect(screen.getByText(/Admin, Test/i)).toBeInTheDocument();
      expect(screen.getByText(/Volunteer, Another/i)).toBeInTheDocument();
      expect(screen.queryByText(/Next/i)).not.toBeInTheDocument();
    });
  });
});