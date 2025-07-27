/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgetMeNot from './ForgetMeNot';
import { BrowserRouter } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { UserContext } from '../util/userContext';
import { ToastContainer, toast } from 'react-toastify';

jest.mock('firebase/auth', () => ({
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('../firebase/firebaseConfig', () => ({
  auth: {},
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
  ToastContainer: () => <div data-testid="toast-container" />,
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
    expect(screen.getByRole('button', { name: /submit email/i })).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  test('shows error toast for invalid email format', async () => {
    renderForgetMeNot();

    const emailInput = screen.getByLabelText(/enter email/i);
    const form = emailInput.closest('form')!;
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please input a proper email.');
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  test('calls sendPasswordResetEmail with correct parameters on valid email submission', async () => {
    (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

    renderForgetMeNot();

    const emailInput = screen.getByLabelText(/enter email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /submit email/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        auth, 
        'test@example.com',
        { url: "https://chai-met.firebaseapp.com/" }
      );
      expect(toast.success).toHaveBeenCalledWith('Password reset email sent');
    });
  });

  test('handles error when sendPasswordResetEmail fails', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    (sendPasswordResetEmail as jest.Mock).mockRejectedValue({
      code: 'auth/invalid-email',
      message: 'Invalid email',
    });

    renderForgetMeNot();

    const emailInput = screen.getByLabelText(/enter email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /submit email/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        auth, 
        'test@example.com',
        { url: "https://chai-met.firebaseapp.com/" }
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('auth/invalid-email');
      expect(consoleLogSpy).toHaveBeenCalledWith('Invalid email');
    });

    consoleLogSpy.mockRestore();
  });

  test('navigates to login page when Back to Login is clicked', () => {
    renderForgetMeNot();

    const backButton = screen.getByText(/back to login/i);
    fireEvent.click(backButton);

    expect(mockedNavigate).toHaveBeenCalledWith('/');
  });

  test('disables button during form submission and keeps it disabled on success', async () => {
    (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

    renderForgetMeNot();

    const emailInput = screen.getByLabelText(/enter email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /submit email/i });
    const form = emailInput.closest('form')!;
    
    expect(submitButton).not.toBeDisabled();
    
    fireEvent.submit(form);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Password reset email sent');
    });

    expect(submitButton).toBeDisabled();
  });

  test('makes email input readonly and progresses form state after successful submission', async () => {
    (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

    renderForgetMeNot();

    const emailInput = screen.getByLabelText(/enter email/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(emailInput.readOnly).toBe(false);

    const submitButton = screen.getByRole('button', { name: /submit email/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput.readOnly).toBe(true);
      expect(emailInput).toHaveClass('bg-gray-300');
    });
  });

  test('form handles multiple state progressions', async () => {
    (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

    renderForgetMeNot();

    const emailInput = screen.getByLabelText(/enter email/i);
    const form = emailInput.closest('form')!;
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    fireEvent.submit(form);

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    });

    fireEvent.submit(form);

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1); 
    });

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    fireEvent.submit(form);

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith('HIII');
      expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1); 
    });

    consoleLogSpy.mockRestore();
  });
});