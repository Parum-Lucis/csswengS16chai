/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ToastContainer, toast } from 'react-toastify';
import { collection, doc, getDocs, query, updateDoc, where, Timestamp } from 'firebase/firestore';
import { addDays, subDays, addHours } from 'date-fns';
import { DeletedEventList } from '../admin/DeletedEventList';
import { eventConverter } from '../../util/converters';

jest.mock('../../util/converters', () => ({
  eventConverter: {
    toFirestore: (data: any) => data,
    fromFirestore: (snapshot: any, options: any) => snapshot.data(options),
  },
}));

jest.mock('../../firebase/firebaseConfig', () => ({
  db: {},
}));

const mockQueryObject = {
  withConverter: jest.fn().mockReturnThis(),
};

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((...args) => ({ path: args.join('/') })),
  doc: jest.fn((db, collection, docId) => ({
    path: `${collection}/${docId}`,
  })),
  getDocs: jest.fn(),
  query: jest.fn(() => mockQueryObject),
  where: jest.fn(),
  updateDoc: jest.fn(),
  Timestamp: {
    fromDate: (date: Date) => ({
      toDate: () => date,
      toMillis: () => date.getTime(),
    }),
  },
}));

jest.mock('react-toastify', () => ({
  ...jest.requireActual('react-toastify'),
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const now = new Date();
const mockEvents = [
  {
    docID: 'event-done',
    name: 'Charity Gala',
    description: 'A fundraising event from last week.',
    location: 'Grand Hall',
    start_date: Timestamp.fromDate(subDays(now, 7)),
    end_date: Timestamp.fromDate(subDays(now, 6)),
    time_to_live: Timestamp.fromDate(addDays(now, 23)),
  },
  {
    docID: 'event-pending',
    name: 'Future Marathon',
    description: 'Annual city marathon.',
    location: 'City Streets',
    start_date: Timestamp.fromDate(addDays(now, 10)),
    end_date: Timestamp.fromDate(addDays(now, 10)),
    time_to_live: Timestamp.fromDate(addDays(now, 20)),
  },
];

describe('DeletedEventList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockEvents.map(event => ({ data: () => event, id: event.docID })),
    });
  });

  test('renders loading state and then displays deleted events', async () => {
    render(<DeletedEventList />);
    await waitFor(() => {
      expect(screen.getByText('Charity Gala')).toBeInTheDocument();
      expect(screen.getByText('Future Marathon')).toBeInTheDocument();
    });
  });

  test('filters events to show only "Done" events', async () => {
    render(<DeletedEventList />);
    await screen.findByText('Charity Gala'); // Wait for initial render

    const filterSelect = screen.getByDisplayValue('Filter By');
    fireEvent.change(filterSelect, { target: { value: 'done' } });

    await waitFor(() => {
      expect(screen.getByText('Charity Gala')).toBeInTheDocument();
      expect(screen.queryByText('Future Marathon')).not.toBeInTheDocument();
    });
  });

  test('sorts events by name in A-Z order', async () => {
    render(<DeletedEventList />);
    await screen.findByText('Charity Gala');

    const sortSelect = screen.getByDisplayValue('Sort by');
    fireEvent.change(sortSelect, { target: { value: 'name' } });

    await waitFor(() => {
      const eventCards = screen.getAllByText(/Days Left:/);
      expect(eventCards[0].parentElement?.textContent).toContain('Charity Gala');
      expect(eventCards[1].parentElement?.textContent).toContain('Future Marathon');
    });
  });

  test('searches for an event and displays only the match', async () => {
    render(<DeletedEventList />);
    await screen.findByText('Charity Gala');

    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'marathon' } });

    await waitFor(() => {
      expect(screen.getByText('Future Marathon')).toBeInTheDocument();
      expect(screen.queryByText('Charity Gala')).not.toBeInTheDocument();
    });
  });

  test('restores an event when the restore button is clicked', async () => {
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
    render(
      <>
        <DeletedEventList />
        <ToastContainer />
      </>
    );
    await screen.findByText('Charity Gala');

    const restoreButton = screen.getByRole('button', { name: /Restore Charity Gala/i });
    fireEvent.click(restoreButton);

    await waitFor(() => {
      expect(screen.queryByText('Charity Gala')).not.toBeInTheDocument();
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { time_to_live: null });
      expect(toast.success).toHaveBeenCalledWith('successfully restored Charity Gala');
    });
  });

  test('displays "Nothing to show" when no deleted events are found', async () => {
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });
    render(<DeletedEventList />);
    await waitFor(() => {
      expect(screen.getByText('Nothing to show.')).toBeInTheDocument();
    });
  });
});