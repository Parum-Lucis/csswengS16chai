/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import ForgetMeNot from './ForgetMeNot';
import { YourProfile } from './YourProfile';
import { UserContext } from '../context/userContext';
import { ToastContainer } from 'react-toastify';
import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword, sendPasswordResetEmail, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

jest.mock('firebase/auth');
jest.mock('../firebase/firebaseConfig', () => ({
  auth: {
    setPersistence: jest.fn(),
    onAuthStateChanged: jest.fn(callback => {
      callback(null);
      return jest.fn();
    }),
  },
}));

jest.mock('./YourProfile', () => ({
  YourProfile: () => <div>Your Profile Page</div>,
}));

// renders the login and forgetmenot within a router for integration testing.
const renderLoginModule = (initialRoute = '/') => {
  return render(
    <UserContext.Provider value={null}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forget-password" element={<ForgetMeNot />} />
          <Route path="/view-profile" element={<YourProfile />} />
        </Routes>
        <ToastContainer />
      </MemoryRouter>
    </UserContext.Provider>
  );
};

describe('Login Module Integration Test Suite', () => {
  beforeEach(() => {
    (signInWithEmailAndPassword as jest.Mock).mockClear();
    (sendPasswordResetEmail as jest.Mock).mockClear();
    (auth.setPersistence as jest.Mock).mockClear();
  });

  test('navigation between login and forget password', async () => {
    renderLoginModule('/');

    fireEvent.click(screen.getByText(/forgot password\?/i));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/back to login/i));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });
  });

  test('successful login flow remember me checked', async () => {
    const mockUser = { uid: '123', email: 'test@success.com' };
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: mockUser });
    
    const { container } = renderLoginModule('/');

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'test@success.com' } });
    // cant find password input by label, might be better to change the label in login.tsx
    fireEvent.change(container.querySelector('input[name="pw"]')!, { target: { value: 'password123' } });
    fireEvent.click(screen.getByLabelText(/remember me/i));
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@success.com', 'password123');
      expect(auth.setPersistence).toHaveBeenCalledWith(browserLocalPersistence);
    });
  });

  test('successful login flow remember me unchecked', async () => {
    const mockUser = { uid: '123', email: 'test@success.com' };
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: mockUser });

    const { container } = renderLoginModule('/');

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'test@success.com' } });
    // cant find password input by label, might be better to change the label in login.tsx
    fireEvent.change(container.querySelector('input[name="pw"]')!, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(auth.setPersistence).toHaveBeenCalledWith(browserSessionPersistence);
    });
  });

  test('failed login flow with error message', async () => {
    const mockError = new FirebaseError('auth/invalid-credential', 'Invalid credentials');
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

    const { container } = renderLoginModule('/');

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'test@fail.com' } });
    // cant find password input by label, might be better to change the label in login.tsx
    fireEvent.change(container.querySelector('input[name="pw"]')!, { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Something is wrong with your email or password/i)).toBeInTheDocument();
    });
  });

  test('successful password reset flow', async () => {
    (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

    renderLoginModule('/forget-password');

    fireEvent.change(screen.getByLabelText(/enter email/i), { target: { value: 'reset@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'reset@test.com');
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });
  });
});