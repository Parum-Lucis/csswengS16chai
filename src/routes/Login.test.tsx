/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import { BrowserRouter } from 'react-router-dom';
import { signInWithEmailAndPassword, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { ToastContainer } from 'react-toastify';
import { FirebaseError } from 'firebase/app'; // added this for case 5 & 6

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

describe('Login Page', () => {
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

  test('shows error if password is incorrect for existing user', async () => {
    const mockError = new FirebaseError(
      'auth/invalid-credential', 
      'Firebase: Error (auth/invalid-credential).'
    );
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

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
        el.textContent?.includes('Something is wrong with your email or password.')
      );
      expect(match).toBe(true);
    });
  });

  test('shows error if username is not in database', async () => {
    const mockError = new FirebaseError(
      'auth/invalid-credential',
      'Firebase: Error (auth/invalid-credential).'
    );
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

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
        el.textContent?.includes('Something is wrong with your email or password.')
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

  // ===== new test cases for remember me ===== //

  test('sets persistence to browserLocalPersistence when "Remember Me" is checked on succesful login', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    const { container } = renderLogin(); // so we can use querySelector to get password

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'test@example.com' },
    });
    
    const passwordInput = container.querySelector('input[name="pw"]');
    fireEvent.change(passwordInput!, {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByLabelText(/remember me/i)); // check yung remember me
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(auth.setPersistence).toHaveBeenCalledWith(browserLocalPersistence);
    });
  });

  test('sets persistence to browserSessionPersistence when "Remember Me" is unchecked', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    const { container } = renderLogin();

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'test@example.com' },
    });
    
    const passwordInput = container.querySelector('input[name="pw"]');
    fireEvent.change(passwordInput!, {
      target: { value: 'password123' },
    });

    // its unchecked by default but to be sure we uncheck if checked
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i) as HTMLInputElement;
    if (rememberMeCheckbox.checked) {
      fireEvent.click(rememberMeCheckbox);
    }

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(auth.setPersistence).toHaveBeenCalledWith(browserSessionPersistence);
    });
  });

  test('redirects to /view-profile if user is already logged in', async () => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation(callback => {
      callback({ uid: 'test-uid', email: 'test@example.com' });
      return jest.fn();
    });

    renderLogin();

    await waitFor(() => {
      expect(window.location.pathname).toBe('/view-profile');
    });
  });
});