/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ProfileCard from '../components/ProfileCard';
import { MemoryRouter } from 'react-router-dom';
import type { Volunteer } from '../../models/volunteerType';
import { Timestamp } from "firebase/firestore";

jest.mock('../firebase/firebaseConfig', () => ({
  db: {},
  auth: {},
  store: {}, // This is imported by ProfileCard, so it needs to be defined.
}));

jest.mock('firebase/storage', () => ({
  getBlob: jest.fn((_) => Promise.resolve(new Blob(["(⌐□_□)"], { type: "image/png" }))),
  ref: jest.fn(),
}));

describe('ProfileCard Component', () => {
  const mockProfile: Volunteer = {
    docID: 'xyz123',
    first_name: 'Jane',
    last_name: 'Doe',
    birthdate: Timestamp.fromDate(new Date('1998-01-01')),
    sex: 'F',
    pfpPath: "",
    // volunteer things
    address: '123 Main St',
    contact_number: '09123456789',
    email: 'jane.doe@example.com',
    is_admin: false,
    role: 'Volunteer',
    time_to_live: null,
  };

  test('renders name as "LastName, FirstName" by default', () => {
    render(
      <MemoryRouter>
        <ProfileCard profile={mockProfile} sort="last" />
      </MemoryRouter>
    );
    expect(screen.getByText('DOE, Jane')).toBeInTheDocument();
  });

  test('renders name as "FirstName LastName" when sort is "first"', () => {
    render(
      <MemoryRouter>
        <ProfileCard profile={mockProfile} sort="first" />
      </MemoryRouter>
    );
    expect(screen.getByText('JANE Doe')).toBeInTheDocument();
  });

  test('displays the correct age and sex', () => {
    render(
      <MemoryRouter>
        <ProfileCard profile={mockProfile} sort="last" />
      </MemoryRouter>
    );
    expect(screen.getByText('Age: 27')).toBeInTheDocument();
    expect(screen.getByText('Sex: F')).toBeInTheDocument();
  });
});