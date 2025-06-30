import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react'; 
import { BrowserRouter } from 'react-router-dom';
import { BeneficiaryList } from './ProfileList';
import { UserContext } from '../context/userContext';
import { collection, getDocs } from 'firebase/firestore';

// ✅ Mock Firestore methods used in ProfileList.tsx
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

// ✅ Mock firebaseConfig to prevent loading the real one
jest.mock('../firebase/firebaseConfig', () => ({
  db: {}, // dummy object; won't be used because getDocs is already mocked
}));

// ✅ Mock react-router navigate
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => jest.fn(),
}));

// 🔧 Mock data returned by Firestore
const mockProfiles = [
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

describe('BeneficiaryList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDocs as jest.Mock).mockResolvedValue({ docs: mockProfiles });
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

  test('renders profile cards after fetching', async () => {
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

  test('sorts profiles by first name', async () => {
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

  test('sorts profiles by last name', async () => {
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

  test('sorts profiles by age', async () => {
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

  test('searches profiles by name substring', async () => {
    renderWithUser({ email: 'user@test.com' });

    await waitFor(() => screen.getByText(/Test/i));

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Another' } });

    expect(screen.getByText(/Another/i)).toBeInTheDocument();
    expect(screen.queryByText(/Test/i)).not.toBeInTheDocument();
  });
});
