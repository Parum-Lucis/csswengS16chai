import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from './Login';
import { BrowserRouter } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { waitFor } from '@testing-library/react';
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
  render(
    <BrowserRouter>
      <>
        <Login />
        <ToastContainer /> {/* Important: render the toast container */}
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

  test('shows error if username/password is missing', async () => {
    renderLogin(); 

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/please input your username and password/i)
      ).toBeInTheDocument();
    });
  });

  test('successful login attempts to call firebase', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
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
