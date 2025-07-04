import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BeneficiaryProfileCreation } from './ProfileCreation';
import { BeneficiaryProfile } from './BeneficiaryProfile';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { addDoc, collection, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { auth } from '../firebase/firebaseConfig'
import { ToastContainer } from 'react-toastify';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  addDoc: jest.fn(),
  doc: jest.fn(() => ({})),
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
        callback({ uid: 'test-uid', email: 'test@example.com' });
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

function renderBeneficiaryProfileCreation() {
  return render(
    <BrowserRouter>
      <BeneficiaryProfileCreation />
      <ToastContainer />
    </BrowserRouter>
  );
}

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

describe('Beneficiary Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders beneficiary creation form fields', () => {
    renderBeneficiaryProfileCreation();

    expect(screen.getByLabelText(/ID no./i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Birth Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sex/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Grade Level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
    expect(screen.getByText(/Guardian Information/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  test('shows error if all fields are not filled during creation', async () => {
    renderBeneficiaryProfileCreation();

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please fill up all fields!/i)).toBeInTheDocument();
    });
  });

  test('successfully creates a beneficiary with one guardian', async () => {
    (addDoc as jest.Mock).mockResolvedValue({ id: 'new-beneficiary-id' });

    renderBeneficiaryProfileCreation();

    fireEvent.change(screen.getByLabelText(/ID no./i), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/Birth Date/i), { target: { value: '2010-01-01' } });
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Sex/i), { target: { value: 'Male' } });
    fireEvent.change(screen.getByLabelText(/Grade Level/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main St' } });

    const guardian1Card = screen.getByText(/Guardian 1/i).closest('div');
    expect(guardian1Card).not.toBeNull();

    fireEvent.change(within(guardian1Card!).getByLabelText(/Name:/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(within(guardian1Card!).getByLabelText(/Relation:/i), { target: { value: 'Mother' } });
    fireEvent.change(within(guardian1Card!).getByLabelText(/Email:/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(within(guardian1Card!).getByLabelText(/Contact Number:/i), { target: { value: '09123456789' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
        expect(addDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            accredited_id: 123,
            first_name: 'John',
            last_name: 'Doe',
          })
        );
      expect(screen.getByText(/Success!/i)).toBeInTheDocument();
    });
  });

  test('successfully creates a waitlisted beneficiary (no ID)', async () => {
    (addDoc as jest.Mock).mockResolvedValue({ id: 'new-beneficiary-id' });

    renderBeneficiaryProfileCreation();

    // No ID entered
    fireEvent.change(screen.getByLabelText(/Birth Date/i), { target: { value: '2010-01-01' } });
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Sex/i), { target: { value: 'Male' } });
    fireEvent.change(screen.getByLabelText(/Grade Level/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main St' } });

    const guardian1Card = screen.getByText(/Guardian 1/i).closest('div');
    expect(guardian1Card).not.toBeNull();
    fireEvent.change(within(guardian1Card!).getByLabelText(/Name:/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(within(guardian1Card!).getByLabelText(/Relation:/i), { target: { value: 'Mother' } });
    fireEvent.change(within(guardian1Card!).getByLabelText(/Email:/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(within(guardian1Card!).getByLabelText(/Contact Number:/i), { target: { value: '09123456789' } });


    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          accredited_id: NaN,
          is_waitlisted: true,
        })
      );
      expect(screen.getByText(/Success!/i)).toBeInTheDocument();
    });
  });

  test('shows error for invalid email format for guardian', async () => {
    renderBeneficiaryProfileCreation();
  
    fireEvent.change(screen.getByLabelText(/ID no./i), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/Birth Date/i), { target: { value: '2010-01-01' } });
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Sex/i), { target: { value: 'Male' } });
    fireEvent.change(screen.getByLabelText(/Grade Level/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main St' } });
  
    const guardian1Card = screen.getByText(/Guardian 1/i).closest('div');
    expect(guardian1Card).not.toBeNull();
  
    fireEvent.change(within(guardian1Card!).getByLabelText(/Name:/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(within(guardian1Card!).getByLabelText(/Relation:/i), { target: { value: 'Mother' } });
    fireEvent.change(within(guardian1Card!).getByLabelText(/Email:/i), { target: { value: 'invalid-email' } });
    fireEvent.change(within(guardian1Card!).getByLabelText(/Contact Number:/i), { target: { value: '09123456789' } });
  
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
  
    await waitFor(() => {
      expect(screen.getByText(/Please input a proper email/i)).toBeInTheDocument();
    });
  });

  test('shows error for invalid contact number format for guardian', async () => {
    renderBeneficiaryProfileCreation();

    fireEvent.change(screen.getByLabelText(/ID no./i), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/Birth Date/i), { target: { value: '2010-01-01' } });
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Sex/i), { target: { value: 'Male' } });
    fireEvent.change(screen.getByLabelText(/Grade Level/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main St' } });

    const guardian1Card = screen.getByText(/Guardian 1/i).closest('div');
    expect(guardian1Card).not.toBeNull();

    fireEvent.change(within(guardian1Card!).getByLabelText(/Name:/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(within(guardian1Card!).getByLabelText(/Relation:/i), { target: { value: 'Mother' } });
    fireEvent.change(within(guardian1Card!).getByLabelText(/Email:/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(within(guardian1Card!).getByLabelText(/Contact Number:/i), { target: { value: '123' } }); // Too short

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please input a valid phone number/i)).toBeInTheDocument();
    });
  });

  test('should allow adding up to 3 guardians', async () => {
    renderBeneficiaryProfileCreation();

    const addButton = screen.getByRole('button', { name: '+' });

    fireEvent.click(addButton);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/Guardian 2/i)).toBeInTheDocument();
      expect(screen.getByText(/Guardian 3/i)).toBeInTheDocument();
    });

    fireEvent.click(addButton);
    await waitFor(() => {
      expect(screen.getByText(/Cannot add more than 3 guardians!/i)).toBeInTheDocument();
    });
  });

  test('should allow removing guardians down to 1', async () => {
    renderBeneficiaryProfileCreation();
  
    const addButton = screen.getByRole('button', { name: '+' });
    const subtractButton = screen.getByRole('button', { name: '-' });
  
    fireEvent.click(addButton);
    fireEvent.click(addButton);
  
    await screen.findByText(/Guardian 3/i);
  
    fireEvent.click(subtractButton);
    await waitFor(() => {
      expect(screen.queryByText(/Guardian 3/i)).not.toBeInTheDocument();
    });
  
    fireEvent.click(subtractButton);
    await waitFor(() => {
      expect(screen.queryByText(/Guardian 2/i)).not.toBeInTheDocument();
    });
  
    fireEvent.click(subtractButton);
    await waitFor(() => {
      expect(screen.getByText(/Cannot have 0 guardians!/i)).toBeInTheDocument();
    });
  });
});

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
        (getDoc as jest.Mock).mockReturnValue(new Promise(() => {}));
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

    test('redirects to login if no user is logged in', async () => {
        (auth.onAuthStateChanged as jest.Mock).mockImplementation(callback => {
            callback(null);
            return jest.fn();
        });
        renderBeneficiaryProfile();
        await waitFor(() => {
            expect(mockedNavigate).toHaveBeenCalledWith('/');
        });
    });
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
    
        // use querySelector to avoid issues with duplicate IDs
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
          expect(mockedNavigate).toHaveBeenCalledWith('/');
        });
      });
    
      test('shows error for invalid grade level during update', async () => {
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
});
