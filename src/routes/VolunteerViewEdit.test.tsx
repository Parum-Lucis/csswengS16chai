/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { UserContext } from '../util/userContext';
import { VolunteerProfile } from './VolunteerProfile';
import { YourProfile } from './YourProfile';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { callDeleteVolunteerProfile } from '../firebase/cloudFunctions';

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => `mock-uuid-${Math.random()}`,
  },
  configurable: true,
});

const mockedNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockedNavigate,
  useParams: () => ({ docId: 'test-vol-1' }),
}));

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

jest.mock('../firebase/cloudFunctions', () => ({
    callDeleteVolunteerProfile: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  ...jest.requireActual('firebase/auth'),
  signOut: jest.fn(),
}));

// had to put as unknown because it cause errors
const mockedCallDelete = callDeleteVolunteerProfile as unknown as jest.Mock;

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

const mockDocRef = {
  withConverter: jest.fn(),
};

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
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
    (doc as jest.Mock).mockReturnValue(mockDocRef);
    mockDocRef.withConverter.mockReturnThis();
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

      fireEvent.click(screen.getByRole('button', { name: /save/i }));

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

    test('shows delete confirmation and deletes another user account', async () => {
      mockedCallDelete.mockResolvedValue({ data: true });
      renderVolunteerProfile({ uid: 'admin-id' });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
      expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));
      
      await waitFor(() => {
        expect(mockedCallDelete).toHaveBeenCalledWith('test-vol-1');
        expect(screen.getByText(/account delete success/i)).toBeInTheDocument();
        expect(mockedNavigate).toHaveBeenCalledWith('../');
      });
    });

    test('does not save if address is empty', async () => {
        renderVolunteerProfile({ uid: 'test-uid' });

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        const addressInput = screen.getByLabelText(/address/i);
        fireEvent.change(addressInput, { target: { value: '' } });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(updateDoc).not.toHaveBeenCalled();
            expect(screen.getByText(/please fill up all fields/i)).toBeInTheDocument();
        });
    });

    test('does not save if a field contains only white spaces', async () => {
        renderVolunteerProfile({ uid: 'test-uid' });
        await waitFor(() => { screen.getByRole('heading', { name: /Doe, John/i }) });

        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        const addressInput = screen.getByLabelText(/address/i);
        fireEvent.change(addressInput, { target: { value: '   ' } });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(updateDoc).not.toHaveBeenCalled();
            expect(screen.getByText(/please fill up all fields/i)).toBeInTheDocument();
        });
    });

    test('does not save if email is empty', async () => {
        renderVolunteerProfile({ uid: 'test-uid' });
        await waitFor(() => { screen.getByRole('heading', { name: /Doe, John/i }) });
        fireEvent.click(screen.getByRole('button', { name: /edit/i }));
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        await waitFor(() => {
            expect(updateDoc).not.toHaveBeenCalled();
            expect(screen.getByText(/please fill up all fields/i)).toBeInTheDocument();
        });
    });

    test('does not save if email format is invalid', async () => {
        renderVolunteerProfile({ uid: 'test-uid' });
        await waitFor(() => { screen.getByRole('heading', { name: /Doe, John/i }) });

        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email-format' } });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(updateDoc).not.toHaveBeenCalled();
            expect(screen.getByText(/please input a proper email/i)).toBeInTheDocument();
        });
    });

    test('does not save if contact number is empty', async () => {
        renderVolunteerProfile({ uid: 'test-uid' });
        await waitFor(() => { screen.getByRole('heading', { name: /Doe, John/i }) });
        fireEvent.click(screen.getByRole('button', { name: /edit/i }));
        fireEvent.change(screen.getByLabelText(/contact no/i), { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        await waitFor(() => {
            expect(updateDoc).not.toHaveBeenCalled();
            expect(screen.getByText(/please fill up all fields/i)).toBeInTheDocument();
        });
    });

    // test('does not save if sex is invalid', async () => {
    //     renderVolunteerProfile({ uid: 'test-uid' });

    //     await waitFor(() => {
    //         expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
    //     });

    //     fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    //     const sexInput = screen.getByLabelText(/sex/i);
    //     fireEvent.change(sexInput, { target: { value: 'X' } });

    //     fireEvent.click(screen.getByRole('button', { name: /save/i }));

    //     await waitFor(() => {
    //         expect(updateDoc).not.toHaveBeenCalled();
    //         expect(screen.getByText(/invalid sex input/i)).toBeInTheDocument();
    //     });
    // });
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

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

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
        mockedCallDelete.mockResolvedValue({ data: true });
        renderYourProfile({ uid: 'test-vol-1' });

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /delete account/i }));

        expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

        await waitFor(() => {
          expect(mockedCallDelete).toHaveBeenCalledWith('test-vol-1');
          expect(screen.getByText(/account delete success/i)).toBeInTheDocument();
          expect(mockedNavigate).toHaveBeenCalledWith('/');
        });
      });

    test('handles self-deletion correctly when an admin deletes their own profile', async () => {
      mockedCallDelete.mockResolvedValue({ data: true });
      renderVolunteerProfile({ uid: 'test-vol-1' });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /delete account/i }));

      expect(screen.getByText(/this is your own account. You will be/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

      await waitFor(() => {
        expect(mockedCallDelete).toHaveBeenCalledWith('test-vol-1');
        expect(screen.getByText(/account delete success!/i)).toBeInTheDocument();
        expect(jest.requireMock('firebase/auth').signOut).toHaveBeenCalled();
        expect(mockedNavigate).toHaveBeenCalledWith('/');
      });
    });

      test('does not save if address is empty', async () => {
          renderYourProfile({ uid: 'test-uid' });

          await waitFor(() => {
              expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
          });

          fireEvent.click(screen.getByRole('button', { name: /edit/i }));

          const addressInput = screen.getByLabelText(/address/i);
          fireEvent.change(addressInput, { target: { value: '' } });

          fireEvent.click(screen.getByRole('button', { name: /save/i }));

          await waitFor(() => {
              expect(updateDoc).not.toHaveBeenCalled();
              expect(screen.getByText(/please fill up all fields/i)).toBeInTheDocument();
          });
      });

      test('does not save if a field contains only white spaces', async () => {
          renderYourProfile({ uid: 'test-uid' });
          await waitFor(() => { screen.getByRole('heading', { name: /Doe, John/i }) });

          fireEvent.click(screen.getByRole('button', { name: /edit/i }));

          const addressInput = screen.getByLabelText(/address/i);
          fireEvent.change(addressInput, { target: { value: '   ' } });

          fireEvent.click(screen.getByRole('button', { name: /save/i }));

          await waitFor(() => {
              expect(updateDoc).not.toHaveBeenCalled();
              expect(screen.getByText(/please fill up all fields/i)).toBeInTheDocument();
          });
      });

      test('does not save if email is empty', async () => {
          renderYourProfile({ uid: 'test-uid' });
          await waitFor(() => { screen.getByRole('heading', { name: /Doe, John/i }) });
          fireEvent.click(screen.getByRole('button', { name: /edit/i }));
          fireEvent.change(screen.getByLabelText(/email/i), { target: { value: '' } });
          fireEvent.click(screen.getByRole('button', { name: /save/i }));
          await waitFor(() => {
              expect(updateDoc).not.toHaveBeenCalled();
              expect(screen.getByText(/please fill up all fields/i)).toBeInTheDocument();
          });
      });

      test('does not save if email format is invalid', async () => {
          renderYourProfile({ uid: 'test-uid' });
          await waitFor(() => { screen.getByRole('heading', { name: /Doe, John/i }) });

          fireEvent.click(screen.getByRole('button', { name: /edit/i }));

          fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'another-invalid-email' } });

          fireEvent.click(screen.getByRole('button', { name: /save/i }));

          await waitFor(() => {
              expect(updateDoc).not.toHaveBeenCalled();
              expect(screen.getByText(/please input a proper email/i)).toBeInTheDocument();
          });
      });

      test('does not save if contact number is empty', async () => {
          renderYourProfile({ uid: 'test-uid' });
          await waitFor(() => { screen.getByRole('heading', { name: /Doe, John/i }) });
          fireEvent.click(screen.getByRole('button', { name: /edit/i }));
          fireEvent.change(screen.getByLabelText(/contact no/i), { target: { value: '' } });
          fireEvent.click(screen.getByRole('button', { name: /save/i }));
          await waitFor(() => {
              expect(updateDoc).not.toHaveBeenCalled();
              expect(screen.getByText(/please fill up all fields/i)).toBeInTheDocument();
          });
      });

      // test('does not save if sex is invalid', async () => {
      //     renderYourProfile({ uid: 'test-uid' });

      //     await waitFor(() => {
      //         expect(screen.getByRole('heading', { name: /Doe, John/i })).toBeInTheDocument();
      //     });

      //     fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      //     const sexInput = screen.getByLabelText(/sex/i);
      //     fireEvent.change(sexInput, { target: { value: 'X' } });

      //     fireEvent.click(screen.getByRole('button', { name: /save/i }));

      //     await waitFor(() => {
      //         expect(updateDoc).not.toHaveBeenCalled();
      //         expect(screen.getByText(/invalid sex input/i)).toBeInTheDocument();
      //     });
      // });
  });
});