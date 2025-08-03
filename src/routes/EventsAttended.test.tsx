/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, within } from '@testing-library/react'; // Import 'within'
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BeneficiaryProfile } from './BeneficiaryProfile';
import { Timestamp } from 'firebase/firestore';
import '@testing-library/jest-dom';

jest.mock('../components/EventCard', () => {
  return jest.fn(({ attEvent }: any) => (
    <div data-testid="event-card">
      <p>{attEvent.event_name}</p>
      <p>{attEvent.attended ? 'Present' : 'Absent'}</p>
      <p>{attEvent.who_attended}</p>
    </div>
  ));
});
jest.mock('../components/GuardianCard', () => jest.fn(() => <div>Guardian Card</div>));
jest.mock('../components/ProfilePicture', () => ({
  ProfilePictureInput: jest.fn(() => <div>Profile Picture</div>),
}));
jest.mock('../firebase/firebaseConfig', () => ({
  db: {},
  store: {},
  auth: {},
}));
const mockBeneficiaryId = 'bene-123';
const mockEvents = [
  { docID: 'event-1', event_name: 'Summer Art Camp', attended: true, who_attended: 'Beneficiary', event_start: Timestamp.fromDate(new Date('2025-07-15')), beneficiaryID: mockBeneficiaryId },
  { docID: 'event-2', event_name: 'Reading Workshop', attended: false, who_attended: 'Parent', event_start: Timestamp.fromDate(new Date('2025-06-20')), beneficiaryID: mockBeneficiaryId },
  { docID: 'event-3', event_name: 'Annual Christmas Party', attended: false, who_attended: 'Family', event_start: Timestamp.fromDate(new Date('2025-12-20')), beneficiaryID: mockBeneficiaryId },
  { docID: 'event-4', event_name: 'Field Trip to Museum', attended: true, who_attended: 'Parent', event_start: Timestamp.fromDate(new Date('2025-05-10')), beneficiaryID: mockBeneficiaryId },
];
const mockBeneficiaryDoc = { id: mockBeneficiaryId, exists: () => true, data: () => ({ first_name: 'Juan', last_name: 'Dela Cruz', birthdate: Timestamp.fromDate(new Date('2015-01-01')), sex: 'M', grade_level: '5', address: '123 Main St', guardians: [], accredited_id: 12345, }), };
const mockAttendedEventsDocs = { forEach: (callback: (doc: object) => void) => { mockEvents.forEach(event => { callback({ data: () => event, ref: { parent: { parent: { id: event.docID } } }, }); }); }, };
jest.mock('firebase/firestore', () => ({ ...jest.requireActual('firebase/firestore'), getDoc: jest.fn(() => Promise.resolve(mockBeneficiaryDoc)), getDocs: jest.fn(() => Promise.resolve(mockAttendedEventsDocs)), doc: jest.fn((...args) => ({ withConverter: jest.fn(() => ({ path: args.join('/') })), })), collectionGroup: jest.fn(), query: jest.fn(), where: jest.fn(), }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn(), }, }));

const renderComponent = () => {
  render(
    <MemoryRouter initialEntries={[`/beneficiary/${mockBeneficiaryId}`]}>
      <Routes>
        <Route path="/beneficiary/:docId" element={<BeneficiaryProfile />} />
      </Routes>
    </MemoryRouter>
  );
};


describe('BeneficiaryProfile - Event Record Feature', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initially render all events attended by the beneficiary', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByTestId('event-card')).toHaveLength(4);
    });
  });

  test('should filter events by "Who Attended" (e.g., Parent)', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getAllByTestId('event-card')).toHaveLength(4));

    const eventRecordSection = screen.getByRole('heading', { name: /event record/i }).parentElement as HTMLElement;
    const filterSelect = within(eventRecordSection).getAllByRole('combobox')[0];
    
    await userEvent.selectOptions(filterSelect, 'parent');

    await waitFor(() => {
        const eventCards = screen.getAllByTestId('event-card');
        expect(eventCards).toHaveLength(2);
        expect(screen.getByText('Reading Workshop')).toBeInTheDocument();
        expect(screen.getByText('Field Trip to Museum')).toBeInTheDocument();
    });
  });

  test('should filter events by "Attendance Status" (e.g., Present)', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getAllByTestId('event-card')).toHaveLength(4));

    const eventRecordSection = screen.getByRole('heading', { name: /event record/i }).parentElement as HTMLElement;
    const statusSelect = within(eventRecordSection).getAllByRole('combobox')[1];
    
    await userEvent.selectOptions(statusSelect, 'present');

    await waitFor(() => {
      const eventCards = screen.getAllByTestId('event-card');
      expect(eventCards).toHaveLength(2);
      expect(screen.getByText('Summer Art Camp')).toBeInTheDocument();
      expect(screen.getByText('Field Trip to Museum')).toBeInTheDocument();
    });
  });
  
  test('should filter for upcoming events', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getAllByTestId('event-card')).toHaveLength(4));

    const eventRecordSection = screen.getByRole('heading', { name: /event record/i }).parentElement as HTMLElement;
    const statusSelect = within(eventRecordSection).getAllByRole('combobox')[1];
    
    await userEvent.selectOptions(statusSelect, 'upcoming'); 
    
    await waitFor(() => {
        const eventCards = screen.getAllByTestId('event-card');
        expect(eventCards).toHaveLength(1);
        expect(screen.getByText('Annual Christmas Party')).toBeInTheDocument();
    });
  });

  test('should sort events by name (A-Z)', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getAllByTestId('event-card')).toHaveLength(4));

    const eventRecordSection = screen.getByRole('heading', { name: /event record/i }).parentElement as HTMLElement;
    const sortSelect = within(eventRecordSection).getAllByRole('combobox')[2];

    await userEvent.selectOptions(sortSelect, 'name');

    await waitFor(() => {
      const eventCards = screen.getAllByTestId('event-card');
      const eventNames = eventCards.map(card => card.querySelector('p')?.textContent);
      
      expect(eventNames).toEqual([
        'Annual Christmas Party',
        'Field Trip to Museum',
        'Reading Workshop',
        'Summer Art Camp',
      ]);
    });
  });
  
  test('should search for an event by name', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getAllByTestId('event-card')).toHaveLength(4));
    
    const eventRecordSection = screen.getByRole('heading', { name: /event record/i }).parentElement as HTMLElement;
    const searchInput = within(eventRecordSection).getByPlaceholderText('Search');
    
    await userEvent.type(searchInput, 'Camp');

    await waitFor(() => {
        const eventCards = screen.getAllByTestId('event-card');
        expect(eventCards).toHaveLength(1);
        expect(screen.getByText('Summer Art Camp')).toBeInTheDocument();
    });
  });

  test('should display a message when no events are recorded', async () => {
    (require('firebase/firestore').getDocs as jest.Mock).mockResolvedValueOnce({
        forEach: () => {},
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No Events Recorded!')).toBeInTheDocument();
    });
  });
});