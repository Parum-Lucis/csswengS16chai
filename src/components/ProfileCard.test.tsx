/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ProfileCard from './ProfileCard';

describe('ProfileCard Component', () => {
  const mockProfile = {
    firstName: 'Jane',
    lastName: 'Doe',
    age: 25,
    sex: 'F',
  };

  test('renders name as "LastName, FirstName" by default', () => {
    render(<ProfileCard {...mockProfile} sort="last" />);
    expect(screen.getByText('DOE, Jane')).toBeInTheDocument();
  });

  test('renders name as "FirstName LastName" when sort is "first"', () => {
    render(<ProfileCard {...mockProfile} sort="first" />);
    expect(screen.getByText('JANE Doe')).toBeInTheDocument();
  });

  test('displays the correct age and sex', () => {
    render(<ProfileCard {...mockProfile} sort="last" />);
    expect(screen.getByText('Age: 25')).toBeInTheDocument();
    expect(screen.getByText('Sex: F')).toBeInTheDocument();
  });
});