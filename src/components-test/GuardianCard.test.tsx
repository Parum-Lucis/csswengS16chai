/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import GuardianCard from '../components/GuardianCard';
import type { Guardian } from '@models/guardianType';

describe('GuardianCard Component', () => {
  const mockGuardians: Guardian[] = [
    { name: 'John Doe', 
      relation: 'Father', 
      email: 'john.doe@example.com', 
      contact_number: '09123456789' },
  ];

  const mockSetGuardians = jest.fn();

  test('renders in read-only mode when formState is true', () => {
    render(
      <GuardianCard
        formState={true}
        index={0}
        guardians={mockGuardians}
        setGuardians={mockSetGuardians}
      />
    );

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toHaveAttribute('readonly');

    expect(screen.getByDisplayValue('Father')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Father')).toHaveAttribute('readonly');

    expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john.doe@example.com')).toHaveAttribute('readonly');

    expect(screen.getByDisplayValue('09123456789')).toBeInTheDocument();
    expect(screen.getByDisplayValue('09123456789')).toHaveAttribute('readonly');
  });

  test('renders in editable mode when formState is false', () => {
    render(
      <GuardianCard
        formState={false}
        index={0}
        guardians={mockGuardians}
        setGuardians={mockSetGuardians}
      />
    );

    expect(screen.getByDisplayValue('John Doe')).not.toHaveAttribute('readonly');
    expect(screen.getByDisplayValue('Father')).not.toHaveAttribute('readonly');
    expect(screen.getByDisplayValue('john.doe@example.com')).not.toHaveAttribute('readonly');
    expect(screen.getByDisplayValue('09123456789')).not.toHaveAttribute('readonly');
  });

  test('calls setGuardians with updated value on input change', () => {
    render(
      <GuardianCard
        formState={false}
        index={0}
        guardians={mockGuardians}
        setGuardians={mockSetGuardians}
      />
    );

    const nameInput = screen.getByDisplayValue('John Doe');
    fireEvent.change(nameInput, { target: { value: 'John Smith' } });

    const updatedGuardians = [...mockGuardians];
    updatedGuardians[0] = { ...updatedGuardians[0], name: 'John Smith' };

    expect(mockSetGuardians).toHaveBeenCalledWith(updatedGuardians);
  });
});