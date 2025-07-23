/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BeneficiaryProfile } from './BeneficiaryProfile';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ToastContainer } from 'react-toastify';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})), // Return a mock object
  addDoc: jest.fn(),
  doc: jest.fn(() => ({})), // Return a mock object
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  Timestamp: {
    fromMillis: jest.fn((ms) => ({
      seconds: Math.floor(ms / 1000),
      nanoseconds: (ms % 1000) * 1_000_000,
      toDate: () => new Date(ms),
    })),
    fromDate: jest.fn((date: Date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1_000_000,
      toDate: () => date,
    })),
  },
}));

jest.mock('../firebase/firebaseConfig', () => ({
  db: {},
  auth: {
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(callback => {
      callback({ uid: 'test-uid', email: 'test@example.com' }); // Simulate logged-in user
      return jest.fn();
    }),
  },
}));

const mockedNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockedNavigate,
  useParams: () => ({ docId: 'test-beneficiary-id' }),
}));

function renderBeneficiaryProfile(initialDocId = 'test-beneficiary-id') {
  return render(
    <MemoryRouter initialEntries={[`/beneficiary-profile/${initialDocId}`]}>
      <Routes>
        <Route path="/beneficiary-profile/:docId" element={<BeneficiaryProfile />} />
        <Route path="/" element={<div>Login Page</div>} />
      </Routes>
      <ToastContainer />
    </MemoryRouter>
  );
}

describe('Retrieve Beneficiary Profile', () => {
  const mockBeneficiaryData = {
    accredited_id: 123,
    first_name: 'Test',
    last_name: 'Beneficiary',
    address: '456 Test Ave',
    birthdate: Timestamp.fromDate(new Date('2015-05-10')),
    grade_level: 3,
    sex: 'Female',
    guardians: [
      { name: 'Parent One', relation: 'Father', email: 'parent1@example.com', contact_number: '09123456789' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockBeneficiaryData,
      id: 'test-beneficiary-id',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });


  test('displays "Fetching..." while data is loading', async () => {
    (getDoc as jest.Mock).mockReturnValue(new Promise(() => { }));
    renderBeneficiaryProfile();
    expect(screen.getByText(/Fetching.../i)).toBeInTheDocument();
  });

  test('displays beneficiary information after fetching', async () => {
    renderBeneficiaryProfile();

    await waitFor(() => {
      expect(screen.getByText('Beneficiary, Test')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2015-05-10')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Female')).toBeInTheDocument();
      expect(screen.getByDisplayValue('3')).toBeInTheDocument();
      expect(screen.getByDisplayValue('456 Test Ave')).toBeInTheDocument();

      const guardian1Card = screen.getByText(/Guardian 1/i).closest('div');
      expect(guardian1Card).not.toBeNull();

      expect(within(guardian1Card!).getByDisplayValue('Parent One')).toBeInTheDocument();
      expect(within(guardian1Card!).getByDisplayValue('Father')).toBeInTheDocument();
      expect(within(guardian1Card!).getByDisplayValue('parent1@example.com')).toBeInTheDocument();
      expect(within(guardian1Card!).getByDisplayValue('09123456789')).toBeInTheDocument();
    });
  });

  // NOTE: Individual pages/components are no longer responsible for navigating away
  // if a user is not logged in.
  // test('redirects to login if no user is logged in', async () => {
  //     (auth.onAuthStateChanged as jest.Mock).mockImplementation(callback => {
  //         callback(null);
  //         return jest.fn();
  //     });
  //     renderBeneficiaryProfile();
  //     await waitFor(() => {
  //         expect(mockedNavigate).toHaveBeenCalledWith('/');
  //     });
  // });
});

describe('Beneficiary Update', () => {
  const mockBeneficiaryData = {
    accredited_id: 123,
    first_name: 'Test',
    last_name: 'Beneficiary',
    address: '456 Test Ave',
    birthdate: Timestamp.fromDate(new Date('2015-05-10')),
    grade_level: 3,
    sex: 'Female',
    guardians: [
      { name: 'Parent One', relation: 'Father', email: 'parent1@example.com', contact_number: '09123456789' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockBeneficiaryData,
      id: 'test-beneficiary-id',
    });
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: jest.fn() },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('allows editing and saving changes to beneficiary profile', async () => {
    renderBeneficiaryProfile();

    await waitFor(() => expect(screen.getByText('Beneficiary, Test')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    const addressInput = screen.getByLabelText(/Address:/i);
    fireEvent.change(addressInput, { target: { value: '789 New St' } });

    const gradeLevelInput = screen.getByLabelText(/Grade Level:/i);
    fireEvent.change(gradeLevelInput, { target: { value: '4' } });

    const sexInput = screen.getByLabelText(/Sex:/i);
    fireEvent.change(sexInput, { target: { value: 'Male' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          address: '789 New St',
          grade_level: 4,
          sex: 'Male'
        })
      );
      expect(screen.getByText(/Account update success!/i)).toBeInTheDocument();
    });
  });

  test('allows adding and saving new guardian information', async () => {
    renderBeneficiaryProfile();

    await waitFor(() => expect(screen.getByText('Beneficiary, Test')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.click(screen.getByRole('button', { name: '+' }));

    const guardian2Container = await screen.findByText(/Guardian 2/i);
    const guardian2Card = guardian2Container.closest('div');
    expect(guardian2Card).not.toBeNull();

    // Use querySelector to avoid issues with duplicate IDs
    const nameInput = guardian2Card!.querySelector('input[name="ParentName"]');
    const relationInput = guardian2Card!.querySelector('input[name="Relation"]');
    const emailInput = guardian2Card!.querySelector('input[name="email"]');
    const contactInput = guardian2Card!.querySelector('input[name="ParentcNum"]');

    expect(nameInput).toBeInTheDocument();
    expect(relationInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(contactInput).toBeInTheDocument();

    fireEvent.change(nameInput!, { target: { value: 'New Guardian' } });
    fireEvent.change(relationInput!, { target: { value: 'Aunt' } });
    fireEvent.change(emailInput!, { target: { value: 'new@example.com' } });
    fireEvent.change(contactInput!, { target: { value: '09987654321' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          guardians: expect.arrayContaining([
            expect.objectContaining({ name: 'Parent One' }),
            expect.objectContaining({ name: 'New Guardian' }),
          ]),
        })
      );
    });
  });

  test('shows error if guardian fields are incomplete during update', async () => {
    renderBeneficiaryProfile();

    await waitFor(() => expect(screen.getByText('Beneficiary, Test')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.click(screen.getByRole('button', { name: '+' }));

    const guardian2Container = await screen.findByText(/Guardian 2/i);
    const guardian2Card = guardian2Container.closest('div');
    expect(guardian2Card).not.toBeNull();

    const nameInput = guardian2Card!.querySelector('input[name="ParentName"]');
    const relationInput = guardian2Card!.querySelector('input[name="Relation"]');
    const contactInput = guardian2Card!.querySelector('input[name="ParentcNum"]');

    fireEvent.change(nameInput!, { target: { value: 'New Guardian' } });
    fireEvent.change(relationInput!, { target: { value: 'Aunt' } });
    fireEvent.change(contactInput!, { target: { value: '09987654321' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please fill up all fields for Guardian 2/i)).toBeInTheDocument();
    });
  });

  test('shows error for invalid guardian contact number during update', async () => {
    renderBeneficiaryProfile();

    await waitFor(() => expect(screen.getByText('Beneficiary, Test')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    const guardianCard = screen.getByText(/Guardian 1/i).closest('div');
    const contactInput = guardianCard!.querySelector('input[name="ParentcNum"]');

    fireEvent.change(contactInput!, { target: { value: '12345' } }); // Invalid number

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please input a proper contact number for Guardian 1/i)).toBeInTheDocument();
    });
  });


  test('allows discarding changes to beneficiary profile', async () => {
    renderBeneficiaryProfile();

    await waitFor(() => expect(screen.getByText('Beneficiary, Test')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    const addressInput = screen.getByLabelText(/Address:/i);
    fireEvent.change(addressInput, { target: { value: 'Temp Address' } });

    fireEvent.click(screen.getByRole('button', { name: /discard/i }));

    await waitFor(() => {
      expect(addressInput).toHaveValue('456 Test Ave');
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });
  });

  test('opens and closes delete confirmation modal', async () => {
    renderBeneficiaryProfile();

    await waitFor(() => expect(screen.getByText('Beneficiary, Test')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Confirm Deletion/i)).not.toBeInTheDocument();
    })
  });

  test('confirms account deletion and navigates to login', async () => {
    renderBeneficiaryProfile();

    await waitFor(() => expect(screen.getByText('Beneficiary, Test')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          time_to_live: expect.any(Number),
        })
      );
      expect(screen.getByText(/Account delete success!/i)).toBeInTheDocument();
      expect(mockedNavigate).toHaveBeenCalledWith('/beneficiary');
    });
  });

  test('shows error for invalid grade level (too high) during update', async () => {
    renderBeneficiaryProfile();

    await waitFor(() => expect(screen.getByText('Beneficiary, Test')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    const gradeLevelInput = screen.getByLabelText(/Grade Level:/i);
    fireEvent.change(gradeLevelInput, { target: { value: '13' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please put a valid Grade Number/i)).toBeInTheDocument();
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  test('shows error for invalid grade level (zero) during update', async () => {
    renderBeneficiaryProfile();

    await waitFor(() => expect(screen.getByText('Beneficiary, Test')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    const gradeLevelInput = screen.getByLabelText(/Grade Level:/i);
    fireEvent.change(gradeLevelInput, { target: { value: '0' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please put a valid Grade Number/i)).toBeInTheDocument();
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });
});