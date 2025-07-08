/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgetMeNot from './ForgetMeNot';
import { BrowserRouter } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { UserContext } from '../context/userContext';
import { ToastContainer } from 'react-toastify';

jest.mock('firebase/auth', () => ({
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('../firebase/firebaseConfig', () => ({
  auth: {},
}));

const mockedNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockedNavigate,
}));

function renderForgetMeNot(user: any = null) {
  return render(
    <BrowserRouter>
      <UserContext.Provider value={user}>
        <ForgetMeNot />
        <ToastContainer />
      </UserContext.Provider>
    </BrowserRouter>
  );
}

describe('ForgetMeNot Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the initial form correctly', () => {
    renderForgetMeNot();
    expect(screen.getByLabelText(/enter email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  test('calls sendPasswordResetEmail and navigates on valid email submission', async () => {
    (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

    renderForgetMeNot();

    const emailInput = screen.getByLabelText(/enter email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'test@example.com');
      expect(mockedNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles error when sendPasswordResetEmail fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    (sendPasswordResetEmail as jest.Mock).mockRejectedValue({
      code: 'auth/invalid-email',
      message: 'Invalid email',
    });

    renderForgetMeNot();

    const emailInput = screen.getByLabelText(/enter email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'invalid-email');
      expect(consoleErrorSpy).toHaveBeenCalledWith('auth/invalid-email');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid email');
    });

    consoleErrorSpy.mockRestore();
  });

  test('redirects to /view-profile if user is already logged in', async () => {
    const user = { uid: 'test-uid', email: 'test@example.com' };
    renderForgetMeNot(user);

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/view-profile');
    });
  });

  test('form progresses to the next step on continue', async () => {
    renderForgetMeNot();

    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
        expect(screen.getByLabelText(/enter confirmation code/i)).toBeInTheDocument();
    });
  });
});