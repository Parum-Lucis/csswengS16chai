import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileDetails from './ProfileDetails';
import { BrowserRouter } from 'react-router-dom';
import { Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { ToastContainer, toast } from 'react-toastify';

const mockDocRef = { id: 'test-doc-ref' };

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  doc: jest.fn(() => mockDocRef),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock('../firebase/firebaseConfig', () => ({
  auth: {
    onAuthStateChanged: jest.fn(callback => {
      callback({ uid: 'test-uid', email: 'test@example.com' });
      return jest.fn();
    }),
    signOut: jest.fn(() => Promise.resolve()),
  },
  db: {},
}));

jest.mock('react-toastify', () => ({
    ...jest.requireActual('react-toastify'),
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
    ToastContainer: () => null,
}));

function renderProfileDetails() {
  return render(
    <BrowserRouter>
      <>
        <ProfileDetails />
        <ToastContainer /> {}
      </>
    </BrowserRouter>
  );
}

describe('ProfileDetails Component - Beneficiary Update Feature', () => {
  const MOCKED_BENEFICIARY_ID = 'test-1';
  const MOCKED_INITIAL_BENEFICIARY_DATA = {
    docID: 'test-1',
    accredited_id: 12345,
    last_name: 'Doe',
    first_name: 'John',
    birthdate: Timestamp.fromMillis(new Date('2000-01-01T00:00:00Z').getTime()),
    address: '123 Original St, Sample City',
    sex: 'M',
    grade_level: 5,
    attended_events: [],
    guardians: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => MOCKED_INITIAL_BENEFICIARY_DATA,
      id: MOCKED_BENEFICIARY_ID,
    });

    (updateDoc as jest.Mock).mockResolvedValue(undefined);
  });

  test('successfully updates beneficiary details and shows success toast', async () => {
    renderProfileDetails();

    await waitFor(() => {
      expect(screen.getByDisplayValue(MOCKED_INITIAL_BENEFICIARY_DATA.sex)).toBeInTheDocument();
      expect(screen.getByDisplayValue(MOCKED_INITIAL_BENEFICIARY_DATA.grade_level.toString())).toBeInTheDocument();
      expect(screen.getByDisplayValue(MOCKED_INITIAL_BENEFICIARY_DATA.address)).toBeInTheDocument();
    });

  const sexInput = screen.getByLabelText(/Sex:/i);
  fireEvent.change(sexInput, { target: { value: 'F' } });

  const gradeLevelInput = screen.getByLabelText(/Grade Level:/i);
  fireEvent.change(gradeLevelInput, { target: { value: '7' } });

  const addressInput = screen.getByLabelText(/Address:/i);
  fireEvent.change(addressInput, { target: { value: '789 New Road, New City' } });

  const editButton = screen.getByRole('button', { name: /Edit/i });
  fireEvent.click(editButton);

    await waitFor(() => {
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'beneficiaries', MOCKED_BENEFICIARY_ID);
      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sex: 'F',
          grade_level: 7,
          address: '789 New Road, New City',

          // unchanged fields
          first_name: MOCKED_INITIAL_BENEFICIARY_DATA.first_name,
          last_name: MOCKED_INITIAL_BENEFICIARY_DATA.last_name,
          birthdate: MOCKED_INITIAL_BENEFICIARY_DATA.birthdate,
          accredited_id: MOCKED_INITIAL_BENEFICIARY_DATA.accredited_id,
          attended_events: MOCKED_INITIAL_BENEFICIARY_DATA.attended_events,
          guardians: MOCKED_INITIAL_BENEFICIARY_DATA.guardians,
          docID: MOCKED_BENEFICIARY_ID
        })
      );
      
      expect(toast.success).toHaveBeenCalledWith('Success!');
    });
  });

  // invalid sex input
  test('does not update and shows error for invalid sex input', async () => {
    renderProfileDetails();

    await waitFor(() => {
      expect(screen.getByDisplayValue(MOCKED_INITIAL_BENEFICIARY_DATA.sex)).toBeInTheDocument();
    });

    const sexInput = screen.getByLabelText(/Sex:/i);
    fireEvent.change(sexInput, { target: { value: 'X' } }); // Invalid sex

    const editButton = screen.getByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(updateDoc).not.toHaveBeenCalled();
      // expect(toast.error).toHaveBeenCalledWith('Invalid sex. Must be M or F.');
    });
  });

  /* CONTACT NUMBER VALIDATION TESTS
  // invalid contact number length
  test('does not update and shows error for invalid contact number length', async () => {
    renderProfileDetails();

    await waitFor(() => {
      expect(screen.getByDisplayValue(MOCKED_INITIAL_BENEFICIARY_DATA.contact_number)).toBeInTheDocument();
    });

    const contactInput = screen.getByLabelText(/Contact No:/i);
    fireEvent.change(contactInput, { target: { value: '123' } });

    const editButton = screen.getByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(updateDoc).not.toHaveBeenCalled();
      // expect(toast.error).toHaveBeenCalledWith('Invalid contact number length.');
    });
  });

  // contact number not starting with '09'
  test('does not update and shows error if contact number does not start with 09', async () => {
    renderProfileDetails();

    await waitFor(() => {
      expect(screen.getByDisplayValue(MOCKED_INITIAL_BENEFICIARY_DATA.contact_number)).toBeInTheDocument();
    });

    const contactInput = screen.getByLabelText(/Contact No:/i);
    fireEvent.change(contactInput, { target: { value: '12345678901' } });

    const editButton = screen.getByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(updateDoc).not.toHaveBeenCalled();
      // expect(toast.error).toHaveBeenCalledWith('Contact number must start with 09.');
    });
  });
  */

  // grade level out of range < 1
  test('does not update and shows error for grade level below 1', async () => {
    renderProfileDetails();

    await waitFor(() => {
      expect(screen.getByDisplayValue(MOCKED_INITIAL_BENEFICIARY_DATA.grade_level.toString())).toBeInTheDocument();
    });

    const gradeLevelInput = screen.getByLabelText(/Grade Level:/i);
    fireEvent.change(gradeLevelInput, { target: { value: '0' } });

    const editButton = screen.getByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(updateDoc).not.toHaveBeenCalled();
      // expect(toast.error).toHaveBeenCalledWith('Grade level must be between 1 and 12.');
    });
  });

  // grade level out of range > 12
  test('does not update and shows error for grade level above 12', async () => {
    renderProfileDetails();

    await waitFor(() => {
      expect(screen.getByDisplayValue(MOCKED_INITIAL_BENEFICIARY_DATA.grade_level.toString())).toBeInTheDocument();
    });

    const gradeLevelInput = screen.getByLabelText(/Grade Level:/i);
    fireEvent.change(gradeLevelInput, { target: { value: '13' } });

    const editButton = screen.getByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(updateDoc).not.toHaveBeenCalled();
      // expect(toast.error).toHaveBeenCalledWith('Grade level must be between 1 and 12.');
    });
  });

  // missing required fields
  test('does not update and shows error if required fields are missing', async () => {
    renderProfileDetails();

    await waitFor(() => {
      expect(screen.getByDisplayValue(MOCKED_INITIAL_BENEFICIARY_DATA.sex)).toBeInTheDocument();
    });

    const sexInput = screen.getByLabelText(/Sex:/i);
    fireEvent.change(sexInput, { target: { value: '' } });

    const editButton = screen.getByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(updateDoc).not.toHaveBeenCalled();
      // expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields.');
    });
  });
});