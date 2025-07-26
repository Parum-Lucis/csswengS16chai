/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BeneficiaryProfileCreation } from './ProfileCreation';
import { BrowserRouter } from 'react-router-dom';
import { addDoc } from 'firebase/firestore';
import { ToastContainer } from 'react-toastify';

// Mock Firebase
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

    test('shows error if a required field contains only whitespace', async () => {
        renderBeneficiaryProfileCreation();

        fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: '  ' } });
        // Fill other fields...
        fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText(/Birth Date/i), { target: { value: '2010-01-01' } });
        fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main St' } });
        fireEvent.change(screen.getByLabelText(/Grade Level/i), { target: { value: '5' } });
        const guardian1Card = screen.getByText(/Guardian 1/i).closest('div');
        fireEvent.change(within(guardian1Card!).getByLabelText(/Name:/i), { target: { value: 'Jane Doe' } });
        fireEvent.change(within(guardian1Card!).getByLabelText(/Relation:/i), { target: { value: 'Mother' } });
        fireEvent.change(within(guardian1Card!).getByLabelText(/Email:/i), { target: { value: 'jane@example.com' } });
        fireEvent.change(within(guardian1Card!).getByLabelText(/Contact Number:/i), { target: { value: '09123456789' } });


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
      expect(screen.getByText(/Please input a proper contact number for Guardian 1/i)).toBeInTheDocument();
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

  test('disables submit button after submission to prevent multiple submissions', async () => {
    (addDoc as jest.Mock).mockResolvedValue({ id: 'new-beneficiary-id' });

    renderBeneficiaryProfileCreation();

    fireEvent.change(screen.getByLabelText(/ID no./i), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/Birth Date/i), { target: { value: '2010-01-01' } });
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Sex/i), { target: { value: 'Male' } });
    fireEvent.change(screen.getByLabelText(/Grade Level/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main St' } });

    const guardian1Card = screen.getByText(/Guardian 1/i).closest('div')!;
    fireEvent.change(within(guardian1Card).getByLabelText(/Name:/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(within(guardian1Card).getByLabelText(/Relation:/i), { target: { value: 'Mother' } });
    fireEvent.change(within(guardian1Card).getByLabelText(/Email:/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(within(guardian1Card).getByLabelText(/Contact Number:/i), { target: { value: '09123456789' } });

    const button = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  test('re-enables submit button if there is a submission error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (addDoc as jest.MockedFunction<typeof addDoc>).mockRejectedValueOnce(new Error('Simulated error'));

    renderBeneficiaryProfileCreation();

    fireEvent.change(screen.getByLabelText(/ID no./i), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/Birth Date/i), { target: { value: '2010-01-01' } });
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Sex/i), { target: { value: 'Male' } });
    fireEvent.change(screen.getByLabelText(/Grade Level/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main St' } });

    const guardian1Card = screen.getByText(/Guardian 1/i).closest('div')!;
    fireEvent.change(within(guardian1Card).getByLabelText(/Name:/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(within(guardian1Card).getByLabelText(/Relation:/i), { target: { value: 'Mother' } });
    fireEvent.change(within(guardian1Card).getByLabelText(/Email:/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(within(guardian1Card).getByLabelText(/Contact Number:/i), { target: { value: '09123456789' } });

    const button = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  test('submit button can be used again after validation errors', async () => {
    renderBeneficiaryProfileCreation();

    const button = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Please fill up all fields!/i)).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });
});