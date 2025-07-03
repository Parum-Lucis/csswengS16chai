import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { UserContext } from '../context/userContext';
import { VolunteerProfile } from './VolunteerProfile';
import { YourProfile } from './YourProfile';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  Timestamp: {
    fromDate: (date: Date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    }),
  },
}));

jest.mock('../firebase/firebaseConfig', () => ({
  auth: {
    signOut: jest.fn(),
  },
  db: {},
}));

const mockedNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockedNavigate,
}));

const mockVolunteer = {
  docID: 'test-vol-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  contact_number: '09123456789',
  address: '123 Main St',
  birthdate: { seconds: new Date('1990-01-01T00:00:00Z').getTime() / 1000, nanoseconds: 0 },
  sex: 'M',
  is_admin: false,
};

const mockDocRef = {};

function renderVolunteerProfile(user: any) {
  return render(
    <BrowserRouter>
      <UserContext.Provider value={user}>
        <VolunteerProfile />
        <ToastContainer />
      </UserContext.Provider>
    </BrowserRouter>
  );
}

function renderYourProfile(user: any) {
  return render(
    <BrowserRouter>
      <UserContext.Provider value={user}>
        <YourProfile />
        <ToastContainer />
      </UserContext.Provider>
    </BrowserRouter>
  );
}

describe('Update Volunteer Profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockVolunteer,
      id: 'test-vol-1',
    });
    (doc as jest.Mock).mockReturnValue(mockDocRef);
  });

  // Test cases for VolunteerProfile.tsx
  describe('VolunteerProfile Page', () => {
    test('renders volunteer data and allows editing', async () => {
      renderVolunteerProfile({ uid: 'test-uid' });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'new.email@example.com' } });

      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(updateDoc).toHaveBeenCalledWith(mockDocRef, {
          ...mockVolunteer,
          email: 'new.email@example.com',
        });
        expect(screen.getByText(/account update success/i)).toBeInTheDocument();
      });
    });

    test('discards changes when "Discard" is clicked', async () => {
        renderVolunteerProfile({ uid: 'test-uid' });

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'temp.email@example.com' } });

        fireEvent.click(screen.getByRole('button', { name: /discard/i }));

        await waitFor(() => {
          expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
        });
    });

    describe('Input Validation', () => {
        test('does not save if address is empty', async () => {
            renderVolunteerProfile({ uid: 'test-uid' });
    
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
            });
    
            fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
            const addressInput = screen.getByLabelText(/address/i);
            fireEvent.change(addressInput, { target: { value: '' } });
    
            fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    
            await waitFor(() => {
                expect(updateDoc).not.toHaveBeenCalled();
            });
        });

        test('does not save if email is empty', async () => {
            renderVolunteerProfile({ uid: 'test-uid' });
            await waitFor(() => { screen.getByRole('heading', { name: /Doe, John/i }) });
            fireEvent.click(screen.getByRole('button', { name: /edit/i }));
            fireEvent.change(screen.getByLabelText(/email/i), { target: { value: '' } });
            fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
            await waitFor(() => {
                expect(updateDoc).not.toHaveBeenCalled();
            });
        });

        test('does not save if contact number is empty', async () => {
            renderVolunteerProfile({ uid: 'test-uid' });
            await waitFor(() => { screen.getByRole('heading', { name: /Doe, John/i }) });
            fireEvent.click(screen.getByRole('button', { name: /edit/i }));
            fireEvent.change(screen.getByLabelText(/contact no/i), { target: { value: '' } });
            fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
            await waitFor(() => {
                expect(updateDoc).not.toHaveBeenCalled();
            });
        });

        test('does not save if sex is invalid', async () => {
            renderVolunteerProfile({ uid: 'test-uid' });
    
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
            });
    
            fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
            const sexInput = screen.getByLabelText(/sex/i);
            fireEvent.change(sexInput, { target: { value: 'X' } });
    
            fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    
            await waitFor(() => {
                expect(updateDoc).not.toHaveBeenCalled();
            });
        });
    });
  });

  // Test cases for YourProfile.tsx
  describe('YourProfile Page', () => {
    test('renders volunteer data and allows editing', async () => {
        renderYourProfile({ uid: 'test-uid' });

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'another.new.email@example.com' } });

        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
          expect(updateDoc).toHaveBeenCalledWith(mockDocRef, {
            ...mockVolunteer,
            email: 'another.new.email@example.com',
          });
          expect(screen.getByText(/account update success/i)).toBeInTheDocument();
        });
      });

      test('discards changes when "Discard" is clicked', async () => {
        renderYourProfile({ uid: 'test-uid' });

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'temp.email.again@example.com' } });

        fireEvent.click(screen.getByRole('button', { name: /discard/i }));

        await waitFor(() => {
            expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
        });
      });

      test('shows delete confirmation and deletes account', async () => {
        renderYourProfile({ uid: 'test-uid' });

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /delete account/i }));

        expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

        await waitFor(() => {
          expect(updateDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
            time_to_live: expect.any(Number)
          }));
          expect(screen.getByText(/account delete success/i)).toBeInTheDocument();
          expect(mockedNavigate).toHaveBeenCalledWith('/');
        });
      });

      describe('Input Validation', () => {
        test('does not save if address is empty', async () => {
            renderYourProfile({ uid: 'test-uid' });
    
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
            });
    
            fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
            const addressInput = screen.getByLabelText(/address/i);
            fireEvent.change(addressInput, { target: { value: '' } });
    
            fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    
            await waitFor(() => {
                expect(updateDoc).not.toHaveBeenCalled();
            });
        });

        test('does not save if email is empty', async () => {
            renderYourProfile({ uid: 'test-uid' });
            await waitFor(() => { screen.getByRole('heading', { name: /Doe, John/i }) });
            fireEvent.click(screen.getByRole('button', { name: /edit/i }));
            fireEvent.change(screen.getByLabelText(/email/i), { target: { value: '' } });
            fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
            await waitFor(() => {
                expect(updateDoc).not.toHaveBeenCalled();
            });
        });

        test('does not save if contact number is empty', async () => {
            renderYourProfile({ uid: 'test-uid' });
            await waitFor(() => { screen.getByRole('heading', { name: /Doe, John/i }) });
            fireEvent.click(screen.getByRole('button', { name: /edit/i }));
            fireEvent.change(screen.getByLabelText(/contact no/i), { target: { value: '' } });
            fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
            await waitFor(() => {
                expect(updateDoc).not.toHaveBeenCalled();
            });
        });

        test('does not save if sex is invalid', async () => {
            renderYourProfile({ uid: 'test-uid' });
    
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
            });
    
            fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
            const sexInput = screen.getByLabelText(/sex/i);
            fireEvent.change(sexInput, { target: { value: 'X' } });
    
            fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    
            await waitFor(() => {
                expect(updateDoc).not.toHaveBeenCalled();
            });
        });
      });
  });
});
