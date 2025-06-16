import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import { BrowserRouter } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { ToastContainer } from 'react-toastify';

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  browserLocalPersistence: {},
  browserSessionPersistence: {},
}));

jest.mock('../firebase/firebaseConfig', () => ({
  auth: {
    setPersistence: jest.fn(),
    onAuthStateChanged: jest.fn(),
  },
}));

function renderLogin() {
  return render(
    <BrowserRouter>
      <>
        <Login />
        <ToastContainer />
      </>
    </BrowserRouter>
  );
}

describe('Login Component', () => {
  test('renders login form fields', () => {
    renderLogin();

    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes[0]).toBeInTheDocument(); // Username field
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument(); // optional
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot password\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  test('shows error if both username and password is missing', async () => {
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/please input your username and password/i)
      ).toBeInTheDocument();
    });
  });

  test('shows error if username is missing', async () => {
    const { container } = renderLogin();

    const passwordInput = container.querySelector('input[name="pw"]');
    expect(passwordInput).toBeInTheDocument();

    fireEvent.change(passwordInput!, {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/please input your username and password/i)
      ).toBeInTheDocument();
    });
  });

  test('shows error if password is missing', async () => {
    renderLogin();

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'test@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/please input your username and password/i)
      ).toBeInTheDocument();
    });
  });

  test('shows error if password is incorrect for existing user', async () => { //needs fixing
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({
      code: 'auth/invalid-credential',
    });

    const { container } = renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = container.querySelector('input[name="pw"]');

    fireEvent.change(usernameInput, {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(passwordInput!, {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      const alerts = document.body.querySelectorAll('[role="alert"]');
      const match = Array.from(alerts).some((el) =>
        el.textContent?.includes('Something went wrong. Please try again.')
      );
      expect(match).toBe(true);
    });
  });

  test('shows error if username is not in database', async () => { //needs fixing
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({
      code: 'auth/invalid-credential',
    });

    const { container } = renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = container.querySelector('input[name="pw"]');

    fireEvent.change(usernameInput, {
      target: { value: 'unknownuser@example.com' },
    });
    fireEvent.change(passwordInput!, {
      target: { value: 'somepassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      const alerts = document.body.querySelectorAll('[role="alert"]');
      const match = Array.from(alerts).some((el) =>
        el.textContent?.includes('Something went wrong. Please try again.')
      );
      expect(match).toBe(true);
    });
  });

  test('successful login attempts to call firebase', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    const { container } = renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = container.querySelector('input[name="pw"]');

    fireEvent.change(usernameInput, {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(passwordInput!, {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
    });
  });
});
