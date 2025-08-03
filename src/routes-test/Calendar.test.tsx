/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Calendar } from '../routes/Calendar';
import { UserContext } from '../util/userContext';
import { getDocs, Timestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn((collectionRef) => collectionRef),
  where: jest.fn(),
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

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    warn: jest.fn(),
  },
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

    test('displays event indicators on calendar days with events', async () => {
      renderCalendar({ uid: 'test-user' });

      await waitFor(() => {
        // Check for event indicators (small dots) on days with events
        const day17Button = screen.getByRole('button', { name: /17/ });
        const eventIndicator = day17Button.querySelector('span.bg-primary');
        expect(eventIndicator).toBeInTheDocument();
      });
    });

    test('handles corrupted event data gracefully', async () => {
      const mockCorruptedEvents = [
        {
          id: '1',
          data: () => {
            throw new Error('Corrupted data');
          },
        },
        ...mockEvents,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockCorruptedEvents,
        forEach: (callback: (doc: any) => void) => {
          mockCorruptedEvents.forEach(callback);
        },
      });

      const { toast } = require('react-toastify');
      renderCalendar({ uid: 'test-user' });

      await waitFor(() => {
        expect(toast.warn).toHaveBeenCalledWith('One or more events failed to load.');
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

    test('displays previous month days in gray', async () => {
      renderCalendar({ uid: 'test-user' });
      
      await waitFor(() => {
        // July 2025 starts on Tuesday, so June 29, 30 should be visible in gray
        const prevMonthDays = screen.getAllByText('30').filter(el => 
          el.classList.contains('text-gray-400')
        );
        expect(prevMonthDays.length).toBeGreaterThan(0);
      });
    });

    test('displays next month days in gray', async () => {
      renderCalendar({ uid: 'test-user' });
      
      await waitFor(() => {
        // August days should appear in gray at the end of July calendar
        const nextMonthDays = screen.getAllByText('1').filter(el => 
          el.classList.contains('text-gray-400')
        );
        expect(nextMonthDays.length).toBeGreaterThan(0);
      });
    });

    test('highlights current date with primary color', async () => {
      renderCalendar({ uid: 'test-user' });
      
      await waitFor(() => {
        const currentDateButton = screen.getByRole('button', { name: /17/ });
        expect(currentDateButton).toHaveClass('text-primary');
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
          expect(screen.getByText('17')).toHaveClass('bg-white');
        });

        fireEvent.click(screen.getByText('18'));

        await waitFor(() => {
          expect(screen.getByText('18')).toHaveClass('bg-white');
          expect(screen.getByText('17')).not.toHaveClass('bg-white');
        });
    });

    test('clicking on previous month day navigates to previous month and selects that day', async () => {
      renderCalendar({ uid: 'test-user' });
      
      await waitFor(() => {
        expect(screen.getByText('July 2025')).toBeInTheDocument();
      });

      // Click on a grayed out day from previous month
      const prevMonthDay = screen.getAllByText('30').find(el => 
        el.classList.contains('text-gray-400')
      );
      
      if (prevMonthDay) {
        fireEvent.click(prevMonthDay);
        
        await waitFor(() => {
          expect(screen.getByText('June 2025')).toBeInTheDocument();
          expect(screen.getByText('30')).toHaveClass('bg-white');
        });
      }
    });

    test('clicking on next month day navigates to next month and selects that day', async () => {
      renderCalendar({ uid: 'test-user' });
      
      await waitFor(() => {
        expect(screen.getByText('July 2025')).toBeInTheDocument();
      });

      const nextMonthDay = screen.getAllByText('2').find(el => 
        el.classList.contains('text-gray-400')
      );
      
      expect(nextMonthDay).toBeDefined();
      
      fireEvent.click(nextMonthDay!);
      
      await waitFor(() => {
        expect(screen.getByText('August 2025')).toBeInTheDocument();
        const selectedDay = screen.getAllByText('2').find(el => 
          !el.classList.contains('text-gray-400') && el.classList.contains('bg-white')
        );
        expect(selectedDay).toBeDefined();
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

    test('handles year change when navigating from January to December', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-01-15T12:00:00Z'));
      renderCalendar({ uid: 'test-user' });
  
      await waitFor(() => expect(screen.getByText('January 2025')).toBeInTheDocument());
  
      const prevMonthButton = screen.getByLabelText(/go to previous month/i);
      fireEvent.click(prevMonthButton);
  
      await waitFor(() => {
        expect(screen.getByText('December 2024')).toBeInTheDocument();
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

    describe('Event Display and Interaction', () => {
      test('updates events display when selecting different dates', async () => {
        renderCalendar({ uid: 'test-user' });
        
        // Initially on July 17 with events
        await waitFor(() => {
          expect(screen.getByText('Test Event 1')).toBeInTheDocument();
          expect(screen.getByText('Test Event 2')).toBeInTheDocument();
        });

        // Click on July 18 which has a different event
        fireEvent.click(screen.getByText('18'));

        await waitFor(() => {
          expect(screen.getByText('Another Event')).toBeInTheDocument();
          expect(screen.queryByText('Test Event 1')).not.toBeInTheDocument();
          expect(screen.queryByText('Test Event 2')).not.toBeInTheDocument();
        });
      });

      test('preserves selected date when minimizing and expanding calendar', async () => {
        renderCalendar({ uid: 'test-user' });
        
        // Select a different date
        fireEvent.click(screen.getByText('18'));
        
        await waitFor(() => {
          expect(screen.getByText('18')).toHaveClass('bg-white');
        });

        // Minimize calendar
        const minimizeButton = screen.getByLabelText(/minimize or expand calendar/i);
        fireEvent.click(minimizeButton);

        // Expand calendar
        fireEvent.click(minimizeButton);

        await waitFor(() => {
          expect(screen.getByText('18')).toHaveClass('bg-white');
        });
      });

      test('filters events correctly by date, month, and year', async () => {
        const eventsInDifferentYear = [
          {
            id: '4',
            data: () => ({
              name: 'Event Next Year',
              description: 'Description 4',
              start_date: Timestamp.fromDate(new Date('2026-07-17T10:00:00Z')),
              end_date: Timestamp.fromDate(new Date('2026-07-17T12:00:00Z')),
              location: 'Location 4',
              attendees: [],
            }),
          },
        ];

        (getDocs as jest.Mock).mockResolvedValue({
          docs: [...mockEvents, ...eventsInDifferentYear],
          forEach: (callback: (doc: any) => void) => {
            [...mockEvents, ...eventsInDifferentYear].forEach(callback);
          },
        });

        renderCalendar({ uid: 'test-user' });
        
        // Should only show events from current year/month/date
        await waitFor(() => {
          expect(screen.getByText('Test Event 1')).toBeInTheDocument();
          expect(screen.queryByText('Event Next Year')).not.toBeInTheDocument();
        });
      });
    });

    describe('UI State Management', () => {
      test('minimize button rotates icon correctly', async () => {
        renderCalendar({ uid: 'test-user' });
        
        const minimizeButton = screen.getByLabelText(/minimize or expand calendar/i);
        
        // Initially not rotated
        expect(minimizeButton).toHaveClass('rotate-0');
        
        fireEvent.click(minimizeButton);
        
        await waitFor(() => {
          expect(minimizeButton).toHaveClass('rotate-180');
        });
        
        fireEvent.click(minimizeButton);
        
        await waitFor(() => {
          expect(minimizeButton).toHaveClass('rotate-0');
        });
      });

      test('calendar expands automatically when navigating months while minimized', async () => {
        renderCalendar({ uid: 'test-user' });
        
        // Minimize calendar
        const minimizeButton = screen.getByLabelText(/minimize or expand calendar/i);
        fireEvent.click(minimizeButton);
        
        await waitFor(() => {
          expect(minimizeButton).toHaveClass('rotate-180');
        });

        // Navigate to next month
        const nextMonthButton = screen.getByLabelText(/go to next month/i);
        fireEvent.click(nextMonthButton);

        await waitFor(() => {
          expect(minimizeButton).toHaveClass('rotate-0');
        });
      });

      test('today button styling and behavior', async () => {
        renderCalendar({ uid: 'test-user' });
        
        const todayButton = screen.getByText('today');
        expect(todayButton).toHaveClass('bg-gradient-to-r', 'from-emerald-300', 'to-green-500');
        
        // Navigate away from current month
        const nextMonthButton = screen.getByLabelText(/go to next month/i);
        fireEvent.click(nextMonthButton);
        
        await waitFor(() => {
          expect(screen.getByText('August 2025')).toBeInTheDocument();
        });
        
        // Click today button
        fireEvent.click(todayButton);
        
        await waitFor(() => {
          expect(screen.getByText('July 2025')).toBeInTheDocument();
          expect(screen.getByText('17')).toHaveClass('bg-white');
        });
      });
    });
});