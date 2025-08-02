/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useNavigate } from 'react-router';
import { BeneficiaryList } from './ProfileList';
import { UserContext } from '../util/userContext';
import { collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';

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
  },
}));

describe('Beneficiary List Page', () => {
  const mockNavigate = jest.fn();
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
        accredited_id: NaN,
      }),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
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

    expect(screen.getByRole('heading', { name: /beneficiary list/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Filter By')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sort by')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  test('shows "Fetching..." initially', async () => {
    renderWithUser({ email: 'user@test.com' });
    expect(await screen.findByText(/USER, Test/i)).toBeInTheDocument();
    expect(await screen.findByText(/STUDENT, Another/i)).toBeInTheDocument();
  });

  test('renders beneficiary cards after fetching', async () => {
    renderWithUser({ email: 'user@test.com' });
    await waitFor(() => {
      expect(screen.getByText(/Test/i)).toBeInTheDocument();
      expect(screen.getByText(/User/i)).toBeInTheDocument();
      expect(screen.getByText(/Another/i)).toBeInTheDocument();
    });
  });

  test('shows "No profiles to show." when no data', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });
    renderWithUser({ email: 'user@test.com' });

    await waitFor(() => {
      expect(screen.getByText(/no profiles to show/i)).toBeInTheDocument();
    });
  });

  test('filters by student type', async () => {
    renderWithUser({ email: 'user@test.com' });
    await waitFor(() => screen.getByText(/Test/i));

    fireEvent.change(screen.getByDisplayValue('Filter By'), { target: { value: 'student' } });
    expect(screen.getByText(/Test/i)).toBeInTheDocument();
    expect(screen.queryByText(/Another/i)).not.toBeInTheDocument();
  });

  test('filters by waitlist type', async () => {
    renderWithUser({ email: 'user@test.com' });
    await waitFor(() => screen.getByText(/Another/i));

    fireEvent.change(screen.getByDisplayValue('Filter By'), { target: { value: 'waitlist' } });
    expect(screen.getByText(/Another/i)).toBeInTheDocument();
    expect(screen.queryByText(/Test/i)).not.toBeInTheDocument();
  });

  test('sorts beneficiaries by first name', async () => {
    renderWithUser({ email: 'user@test.com' });
    await waitFor(() => screen.getByText(/Test/i));

    fireEvent.change(screen.getByDisplayValue('Sort by'), { target: { value: 'first' } });
    const profileCards = screen.getAllByText(/(Test|Another)/i);
    const firstNames = profileCards.map((card) => card.textContent?.split(' ')[0].toLowerCase());
    expect(firstNames[0]).toBe('another');
    expect(firstNames[1]).toBe('test');
  });

  test('sorts beneficiaries by last name', async () => {
    renderWithUser({ email: 'user@test.com' });
    await waitFor(() => screen.getByText(/Another/i));

    fireEvent.change(screen.getByDisplayValue('Sort by'), { target: { value: 'last' } });
    const names = screen.getAllByText(/(Test|Another)/i).map((card) => card.textContent?.toLowerCase() || '');
    expect(names[0]).toContain('student, another');
    expect(names[1]).toContain('user, test');
  });

  test('sorts beneficiaries by age', async () => {
    renderWithUser({ email: 'user@test.com' });
    await waitFor(() => screen.getByText(/Test/i));

    fireEvent.change(screen.getByDisplayValue('Sort by'), { target: { value: 'age' } });
    const namesInOrder = screen.getAllByText(/(Test|Another)/i).map((card) => card.textContent?.toLowerCase());
    expect(namesInOrder[0]).toContain('another');
    expect(namesInOrder[1]).toContain('test');
  });

  test('searches beneficiaries by name substring', async () => {
    renderWithUser({ email: 'user@test.com' });

    await waitFor(() => screen.getByText(/Test/i));

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(screen.getByText(/Test/i)).toBeInTheDocument();
      expect(screen.queryByText(/Another/i)).not.toBeInTheDocument();
    });
  });

  test('searches beneficiaries by age', async () => {
    renderWithUser({ email: 'user@test.com' });
  
    expect(await screen.findByText(/USER, Test/i)).toBeInTheDocument();
    expect(await screen.findByText(/STUDENT, Another/i)).toBeInTheDocument();
  
    fireEvent.change(screen.getByDisplayValue('Sort by'), { target: { value: 'age' } });
    const namesInOrder = screen.getAllByText(/(Test|Another)/i).map((card) => card.textContent?.toLowerCase());
    expect(namesInOrder[0]).toContain('another');
    expect(namesInOrder[1]).toContain('test');
  });

  test('skips profiles with missing values', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const mockBeneficiariesWithMissingNames = [
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
          sex: 'F',
          birthdate: { toDate: () => new Date('2012-06-01') },
          accredited_id: NaN,
        }),
      },
      {
        id: '3',
        data: () => ({
          first_name: 'Valid',
          last_name: 'User',
          sex: 'M',
          birthdate: { toDate: () => new Date('2011-01-01') },
          accredited_id: NaN,
        }),
      },
    ];

    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: mockBeneficiariesWithMissingNames });

    renderWithUser({ email: 'user@test.com' });

    await waitFor(() => {
      expect(screen.getByText(/Test/i)).toBeInTheDocument();
      expect(screen.getByText(/Valid/i)).toBeInTheDocument();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching beneficiary: 2',
        'Missing name fields'
      );
      
      expect(toast.warn).toHaveBeenCalledWith('One or more profiles failed to load.');
    });

    consoleSpy.mockRestore();
  });

  // Moved to BeneficiaryIntegration.test.tsx because it requires navigation
  // test('navigates to profile on click', async () => {
  //   renderWithUser({ email: 'user@test.com' });

  //   const profileLink = await screen.findByText(/USER, Test/i);
  //   fireEvent.click(profileLink);

  //   expect(mockNavigate).toHaveBeenCalledWith('/view-beneficiary/1');
  // });
});

