/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Calendar } from './Calendar';
import { UserContext } from '../context/userContext';
import { collection, getDocs, Timestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    fromDate: (date: Date) => ({
      toDate: () => date,
    }),
  },
}));

jest.mock('../firebase/firebaseConfig', () => ({
  db: {},
}));

const mockedNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockedNavigate,
}));

const mockEvents = [
  {
    id: '1',
    data: () => ({
      name: 'Test Event 1',
      description: 'Description 1',
      start_date: Timestamp.fromDate(new Date('2025-07-17T10:00:00Z')),
      end_date: Timestamp.fromDate(new Date('2025-07-17T12:00:00Z')),
      location: 'Location 1',
      attendees: [],
    }),
  },
  {
    id: '2',
    data: () => ({
      name: 'Test Event 2',
      description: 'Description 2',
      start_date: Timestamp.fromDate(new Date('2025-07-17T14:00:00Z')),
      end_date: Timestamp.fromDate(new Date('2025-07-17T16:00:00Z')),
      location: 'Location 2',
      attendees: [],
    }),
  },
  {
    id: '3',
    data: () => ({
      name: 'Another Event',
      description: 'Description 3',
      start_date: Timestamp.fromDate(new Date('2025-07-18T10:00:00Z')),
      end_date: Timestamp.fromDate(new Date('2025-07-18T12:00:00Z')),
      location: 'Location 3',
      attendees: [],
    }),
  },
];

function renderCalendar(user: any) {
  return render(
    <BrowserRouter>
      <UserContext.Provider value={user}>
        <Calendar />
      </UserContext.Provider>
    </BrowserRouter>
  );
}

describe('Calendar Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockEvents,
      forEach: (callback: (doc: any) => void) => {
        mockEvents.forEach(callback);
      },
    });
    // current date to be July 17, 2025
    jest.useFakeTimers().setSystemTime(new Date('2025-07-17T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Display Events', () => {
    test('fetches and displays events for the selected date', async () => {
      renderCalendar({ uid: 'test-user' });

      await waitFor(() => {
        expect(screen.getByText('Test Event 1')).toBeInTheDocument();
        expect(screen.getByText('Test Event 2')).toBeInTheDocument();
        expect(screen.queryByText('Another Event')).not.toBeInTheDocument();
      });
    });

    test('shows "No Events!" message when no events are scheduled for the selected date', async () => {
      renderCalendar({ uid: 'test-user' });
      // date with no events
      fireEvent.click(screen.getByText('19'));

      await waitFor(() => {
        expect(screen.getByText('No Events!')).toBeInTheDocument();
      });
    });

    test('handles an empty list of events from the database', async () => {
        // override the mock for this specific test
        (getDocs as jest.Mock).mockResolvedValue({ docs: [], forEach: () => {} });
        renderCalendar({ uid: 'test-user' });
    
        await waitFor(() => {
          expect(screen.getByText('July 2025')).toBeInTheDocument();
          expect(screen.getByText('No Events!')).toBeInTheDocument();
        });
    });
  });

  describe('Calendar Render', () => {
    test('renders the calendar with the correct month and year', async () => {
      renderCalendar({ uid: 'test-user' });
      await waitFor(() => {
        expect(screen.getByText('July 2025')).toBeInTheDocument();
      });
    });

    test('renders the days of the week headers', async () => {
      renderCalendar({ uid: 'test-user' });
      await waitFor(() => {
        expect(screen.getByText('Sun')).toBeInTheDocument();
        expect(screen.getByText('Mon')).toBeInTheDocument();
        expect(screen.getByText('Tue')).toBeInTheDocument();
        expect(screen.getByText('Wed')).toBeInTheDocument();
        expect(screen.getByText('Thu')).toBeInTheDocument();
        expect(screen.getByText('Fri')).toBeInTheDocument();
        expect(screen.getByText('Sat')).toBeInTheDocument();
      });
    });

    test('minimizes to show only the selected week', async () => {
        renderCalendar({ uid: 'test-user' });
        await waitFor(() => expect(screen.getByText('July 2025')).toBeInTheDocument());
    
        const minimizeButton = screen.getByLabelText(/minimize or expand calendar/i);
        fireEvent.click(minimizeButton);
    
        await waitFor(() => {
          expect(screen.getByText('13')).toBeInTheDocument();
          expect(screen.getByText('19')).toBeInTheDocument();
          expect(screen.queryByText('12')).not.toBeInTheDocument();
        });
    });
    
    test('expands the calendar when navigating months while minimized', async () => {
        renderCalendar({ uid: 'test-user' });
        await waitFor(() => expect(screen.getByText('July 2025')).toBeInTheDocument());
    
        const minimizeButton = screen.getByLabelText(/minimize or expand calendar/i);
        fireEvent.click(minimizeButton);
    
        const nextMonthButton = screen.getByLabelText(/go to next month/i);
        fireEvent.click(nextMonthButton);
    
        await waitFor(() => {
          expect(screen.getByText('August 2025')).toBeInTheDocument();
          // prev test was too general
          const august31 = screen.getAllByText('31').find(el => !el.classList.contains('text-gray-400'));
          expect(august31).toBeInTheDocument();
        });
    });
  });

  describe('Date Navigation', () => {
    test('navigates to the previous month', async () => {
        renderCalendar({ uid: 'test-user' });
        await waitFor(() => {
          expect(screen.getByText('July 2025')).toBeInTheDocument();
        });
    
        const prevButton = screen.getByRole('button', { name: /previous month/i });
        fireEvent.click(prevButton);
    
        await waitFor(() => {
          expect(screen.getByText('June 2025')).toBeInTheDocument();
        });
    });
    
    test('navigates to the next month', async () => {
        renderCalendar({ uid: 'test-user' });
        await waitFor(() => {
          expect(screen.getByText('July 2025')).toBeInTheDocument();
        });
    
        const nextButton = screen.getByRole('button', { name: /next month/i });
        fireEvent.click(nextButton);
    
        await waitFor(() => {
          expect(screen.getByText('August 2025')).toBeInTheDocument();
        });
    });

    test('navigates to the current date when "today" is clicked', async () => {
        renderCalendar({ uid: 'test-user' });
        // go to a different month first
        const nextButton = screen.getByRole('button', { name: /next month/i });
        fireEvent.click(nextButton);
        await waitFor(() => {
        expect(screen.getByText('August 2025')).toBeInTheDocument();
        });
        
        fireEvent.click(screen.getByText('today'));
        await waitFor(() => {
        expect(screen.getByText('July 2025')).toBeInTheDocument();
        });
    });

    test('clicking on a day selects that day', async () => {
        renderCalendar({ uid: 'test-user' });
        await waitFor(() => {
          expect(screen.getByText('17')).toHaveClass('bg-secondary');
        });

        fireEvent.click(screen.getByText('18'));

        await waitFor(() => {
          expect(screen.getByText('18')).toHaveClass('bg-secondary');
          expect(screen.getByText('17')).not.toHaveClass('bg-secondary');
        });
    });

    test('handles year change when navigating from December to January', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-12-15T12:00:00Z'));
        renderCalendar({ uid: 'test-user' });
    
        await waitFor(() => expect(screen.getByText('December 2024')).toBeInTheDocument());
    
        const nextMonthButton = screen.getByLabelText(/go to next month/i);
        fireEvent.click(nextMonthButton);
    
        await waitFor(() => {
          expect(screen.getByText('January 2025')).toBeInTheDocument();
        });
    });
    
    test('correctly displays 29 days in February on a leap year', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-02-01T12:00:00Z'));
        renderCalendar({ uid: 'test-user' });
    
        await waitFor(() => {
          expect(screen.getByText('February 2024')).toBeInTheDocument();
          // prev test was too general
          const feb29 = screen.getAllByText('29').find(el => !el.classList.contains('text-gray-400'));
          expect(feb29).toBeInTheDocument();
        });
    });
    
    test('correctly displays 28 days in February on a non-leap year', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2025-02-01T12:00:00Z'));
        renderCalendar({ uid: 'test-user' });
    
        await waitFor(() => {
          expect(screen.getByText('February 2025')).toBeInTheDocument();
          // prev test was too general
          const feb28 = screen.getAllByText('28').find(el => !el.classList.contains('text-gray-400'));
          expect(feb28).toBeInTheDocument();
          // prev test was too general
          // verifies that no matching element was found without causing a type error
          const feb29 = screen.queryAllByText('29').find(el => !el.classList.contains('text-gray-400'));
          expect(feb29).toBeUndefined()
        });
      });
    });
});