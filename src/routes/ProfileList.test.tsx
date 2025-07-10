import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BeneficiaryList } from './ProfileList';
import { UserContext } from '../util/userContext';
import { collection, getDocs } from 'firebase/firestore';
import { VolunteerList } from './ProfileList';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('../firebase/firebaseConfig', () => ({
  db: {},
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => jest.fn(),
}));

describe('Beneficiary List Page', () => {
  const mockBeneficiaries = [
    {
      id: '1',
      data: () => ({
        first_name: 'Test',
        last_name: 'User',
        sex: 'M',
        birthdate: { toDate: () => new Date('2010-01-01') },
        accredited_id: '123',
      }),
    },
    {
      id: '2',
      data: () => ({
        first_name: 'Another',
        last_name: 'Student',
        sex: 'F',
        birthdate: { toDate: () => new Date('2012-06-01') },
        accredited_id: null,
      }),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getDocs as jest.Mock).mockResolvedValue({ docs: mockBeneficiaries });
  });

  function renderWithUser(user: any) {
    return render(
      <BrowserRouter>
        <UserContext.Provider value={user}>
          <BeneficiaryList />
        </UserContext.Provider>
      </BrowserRouter>
    );
  }

  test('renders title, filter, sort, and search inputs', () => {
    renderWithUser({ email: 'user@test.com' });

    expect(screen.getByRole('heading', { name: /profile list/i })).toBeInTheDocument();

    expect(screen.getByDisplayValue('Filter By')).toBeInTheDocument();

    expect(screen.getByDisplayValue('Sort by')).toBeInTheDocument();

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  test('shows "Fetching..." initially', () => {
    renderWithUser({ email: 'user@test.com' });
    expect(screen.getByText(/fetching/i)).toBeInTheDocument();
  });

  test('renders beneficiary cards after fetching', async () => {
    renderWithUser({ email: 'user@test.com' });

    await waitFor(() => {
      expect(screen.getByText(/Test/i)).toBeInTheDocument();
      expect(screen.getByText(/User/i)).toBeInTheDocument();

      const matches = screen.getAllByText(/Student/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  test('filters by student type', async () => {
    renderWithUser({ email: 'user@test.com' });

    await waitFor(() => screen.getByText(/Test/i));

    fireEvent.change(screen.getByDisplayValue('Filter By'), {
      target: { value: 'student' },
    });

    expect(screen.getByText(/Test/i)).toBeInTheDocument();
    expect(screen.queryByText(/Another/i)).not.toBeInTheDocument();
  });

  test('filters by waitlist type', async () => {
    renderWithUser({ email: 'user@test.com' });

    await waitFor(() => screen.getByText(/Another/i));

    fireEvent.change(screen.getByDisplayValue('Filter By'), {
      target: { value: 'waitlist' },
    });

    expect(screen.getByText(/Another/i)).toBeInTheDocument();
    expect(screen.queryByText(/Test/i)).not.toBeInTheDocument();
  });

  test('sorts beneficiaries by first name', async () => {
    renderWithUser({ email: 'user@test.com' });

    await waitFor(() => screen.getByText(/Test/i));

    fireEvent.change(screen.getByDisplayValue('Sort by'), {
      target: { value: 'first' },
    });

    const profileCards = screen.getAllByText(/(Test|Another)/i);
    const firstNames = profileCards.map(card => card.textContent?.split(' ')[0].toLowerCase());

    expect(firstNames[0]).toBe('another'); // A comes before T
    expect(firstNames[1]).toBe('test');
  });

  test('sorts beneficiaries by last name', async () => {
    renderWithUser({ email: 'user@test.com' });

    await waitFor(() => screen.getByText(/Another/i));

    fireEvent.change(screen.getByDisplayValue('Sort by'), {
      target: { value: 'last' },
    });

    const profileCards = screen.getAllByText((content) =>
      content.includes('Test') || content.includes('Another')
    );

    const names = profileCards.map(card => card.textContent?.toLowerCase() || '');

    expect(names[0]).toContain('student, another');
    expect(names[1]).toContain('user, test');
  });

  test('sorts beneficiaries by age', async () => {
    renderWithUser({ email: 'user@test.com' });

    await waitFor(() => screen.getByText(/Test/i));

    fireEvent.change(screen.getByDisplayValue('Sort by'), {
      target: { value: 'age' },
    });

    const profileCards = screen.getAllByText(/(Test|Another)/i);
    const namesInOrder = profileCards.map(card => card.textContent?.toLowerCase());

    // In mock data: Another Student is YOUNGER than Test User
    expect(namesInOrder[0]).toContain('another');
    expect(namesInOrder[1]).toContain('test');
  });

  test('searches beneficiaries by name substring', async () => {
    renderWithUser({ email: 'user@test.com' });

    await waitFor(() => screen.getByText(/Test/i));

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Another' } });

    expect(screen.getByText(/Another/i)).toBeInTheDocument();
    expect(screen.queryByText(/Test/i)).not.toBeInTheDocument();
  });
});

describe('Volunteer List Page', () => {
  const mockVolunteers = [
    {
      id: '1', data: () => ({
        first_name: 'Another',
        last_name: 'Admin',
        birthdate: new Date('2015-01-01'),
        sex: 'F',
        is_admin: true
      })
    },
    {
      id: '2', data: () => ({
        first_name: 'Test',
        last_name: 'Volunteer',
        birthdate: new Date('2010-01-01'),
        sex: 'M',
        is_admin: false
      })
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
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

    expect(screen.getByRole('heading', { name: /profile list/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Filter By')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sort by')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  test('shows "Fetching..." initially', () => {
    renderVolunteerWithUser({ email: 'user@test.com' });
    expect(screen.getByText(/fetching/i)).toBeInTheDocument();
  });

  test('renders volunteer cards after fetching', async () => {
    renderVolunteerWithUser({ email: 'user@test.com' });

    await waitFor(() => {
      expect(screen.getByText(/Another/i)).toBeInTheDocument();
      expect(screen.getByText(/Test/i)).toBeInTheDocument();

      const matches = screen.getAllByText(/Admin|Volunteer/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  test('filters by admin type', async () => {
    renderVolunteerWithUser({ email: 'user@test.com' });

    await waitFor(() => screen.getByText(/Another/i));

    fireEvent.change(screen.getByDisplayValue('Filter By'), {
      target: { value: 'admin' },
    });

    expect(screen.getByText(/Another/i)).toBeInTheDocument();
    expect(screen.queryByText(/Test/i)).not.toBeInTheDocument();
  });

  test('filters by non-admin volunteers', async () => {
    renderVolunteerWithUser({ email: 'user@test.com' });

    await waitFor(() => screen.getByText(/Test/i));

    fireEvent.change(screen.getByDisplayValue('Filter By'), {
      target: { value: 'volunteer' },
    });

    expect(screen.getByText(/Test/i)).toBeInTheDocument();
    expect(screen.queryByText(/Another/i)).not.toBeInTheDocument();
  });

  test('sorts volunteers by first name', async () => {
    renderVolunteerWithUser({ email: 'user@test.com' });

    await waitFor(() => screen.getByText(/Test/i));

    fireEvent.change(screen.getByDisplayValue('Sort by'), {
      target: { value: 'first' },
    });

    const profileCards = screen.getAllByText(/(Test|Another)/i);
    const firstNames = profileCards.map(card => card.textContent?.split(' ')[0].toLowerCase());

    expect(firstNames[0]).toBe('another'); // A comes before T
    expect(firstNames[1]).toBe('test');
  });

  test('sorts volunteers by last name', async () => {
    renderVolunteerWithUser({ email: 'user@test.com' });

    await waitFor(() => screen.getByText(/Another/i));

    fireEvent.change(screen.getByDisplayValue('Sort by'), {
      target: { value: 'last' },
    });

    const profileCards = screen.getAllByText((content) =>
      content.includes('Test') || content.includes('Another')
    );

    const names = profileCards.map(card => card.textContent?.toLowerCase() || '');

    expect(names[0]).toContain('admin, another');     // A comes before V
    expect(names[1]).toContain('volunteer, test');
  });

  test('sorts volunteers by age', async () => {
    renderVolunteerWithUser({ email: 'user@test.com' });

    await waitFor(() => screen.getByText(/Test/i));

    fireEvent.change(screen.getByDisplayValue('Sort by'), {
      target: { value: 'age' },
    });

    const profileCards = screen.getAllByText(/(Test|Another)/i);
    const namesInOrder = profileCards.map(card => card.textContent?.toLowerCase());

    // Assuming Another Admin is YOUNGER than Test Volunteer
    expect(namesInOrder[0]).toContain('another');
    expect(namesInOrder[1]).toContain('test');
  });

  test('searches volunteer by name substring', async () => {
    renderVolunteerWithUser({ email: 'user@test.com' });

    await waitFor(() => screen.getByText(/Test/i));

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Another' } });

    expect(screen.getByText(/Another/i)).toBeInTheDocument();
    expect(screen.queryByText(/Test/i)).not.toBeInTheDocument();
  });
});

