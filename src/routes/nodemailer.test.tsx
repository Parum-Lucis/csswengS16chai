import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
type CallableContext = {
  data: any;
  auth: any;
  rawRequest?: any;
  context?: any;
  instanceIdToken?: string;
};
import * as nodemailer from 'nodemailer';
import mjml2html from 'mjml';
import { formatInTimeZone } from 'date-fns-tz';
import { Timestamp } from 'firebase/firestore';

let callableSendEmailReminderHandler: (data: CallableContext) => Promise<any>;

jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
  };

  return {
    firestore: jest.fn(() => mockFirestore),
    initializeApp: jest.fn(),
  };
});

jest.mock('firebase-functions', () => ({
  https: {
    onCall: jest.fn((handler) => {
      callableSendEmailReminderHandler = handler;
      return handler;
    }),
  },
  logger: {
    log: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('firebase/firestore', () => {
  const mockFirestoreInstance = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
  };

  return {
    getFirestore: jest.fn(() => mockFirestoreInstance),
    Timestamp: jest.fn((seconds, nanoseconds) => new Date(seconds * 1000 + nanoseconds / 1000000)),
  };
});

const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({
  sendMail: mockSendMail,
}));
jest.mock('nodemailer', () => ({
  createTransport: mockCreateTransport,
}));

jest.mock('mjml', () => jest.fn(() => ({ html: '<html>Mocked HTML Email</html>' })));

jest.mock('date-fns-tz', () => ({
  formatInTimeZone: jest.fn((date, timezone, formatStr) => {
    if (formatStr.includes('h:mm')) return '10:00 AM';
    if (formatStr.includes('MMMM')) return 'January 1, 2024';
    return 'Mock Date';
  }),
}));

describe('sendEmailReminder', () => {
  const originalEnv = process.env;

  beforeAll(() => {
    admin.initializeApp();
    require('../../functions/src/event/sendEmail');
  });

  beforeEach(() => {
    jest.clearAllMocks();

    process.env = {
      ...originalEnv,
      EMAIL: 'test@example.com',
      APP_PASSWORD: 'test_password',
    };

    mockSendMail.mockResolvedValue({
      messageId: 'mock-message-id',
      accepted: ['attendee1@example.com'],
    });

    (admin.firestore().collection as jest.Mock).mockReturnThis();
    (admin.firestore().collection('').get as jest.Mock).mockResolvedValue({
      forEach: (callback: (data: any) => void) => {
        callback({ data: () => ({ email: 'attendee1@example.com', docID: 'att1', beneficiaryID: 'b1', event_name: 'Test Event', event_start: new Timestamp(Date.now()/1000, 0), first_name: 'John', last_name: 'Doe', contact_number: '123' }) });
        callback({ data: () => ({ email: 'attendee2@example.com', docID: 'att2', beneficiaryID: 'b2', event_name: 'Test Event', event_start: new Timestamp(Date.now()/1000, 0), first_name: 'Jane', last_name: 'Doe' , contact_number: '456'}) });
      }
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should create a nodemailer transporter with correct credentials', async () => {
    const mockEventData = {
      docID: 'event123',
      name: 'Test Event',
      description: 'A test event description.',
      start_date: new Timestamp(Date.now() / 1000, 0),
      end_date: new Timestamp((Date.now() + 3600000) / 1000, 0),
      location: 'Test Location',
    };

    const req = { data: mockEventData, auth: null, context: {} };
    await callableSendEmailReminderHandler(req as CallableContext);

    expect(mockCreateTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: {
        user: 'test@example.com',
        pass: 'test_password',
      },
    });
  });

  it('should query Firestore for event attendees', async () => {
    const mockEventData = {
      docID: 'event456',
      name: 'Another Test Event',
      description: 'Another test description.',
      start_date: new Timestamp(Date.now() / 1000, 0),
      end_date: new Timestamp((Date.now() + 3600000) / 1000, 0),
      location: 'Another Location',
    };

    const req = { data: mockEventData, auth: null, context: {} };
    await callableSendEmailReminderHandler(req as CallableContext);

    expect(admin.firestore().collection).toHaveBeenCalledWith('events/event456/attendees');
    expect(admin.firestore().collection('events/event456/attendees').get).toHaveBeenCalled();
  });

  it('should send an email to all attendees listed in Firestore', async () => {
    const mockEventData = {
      docID: 'event789',
      name: 'Email Test Event',
      description: 'This is an email test.',
      start_date: new Timestamp(Date.now() / 1000, 0),
      end_date: new Timestamp((Date.now() + 3600000) / 1000, 0),
      location: 'Email Location',
    };

    const mockAttendees = [
      { data: () => ({ email: 'first@example.com', docID: 'att3', beneficiaryID: 'b3', event_name: 'Test', event_start: new Timestamp(0,0), first_name: 'First', last_name: 'One', contact_number: '1' }) },
      { data: () => ({ email: 'second@example.com', docID: 'att4', beneficiaryID: 'b4', event_name: 'Test', event_start: new Timestamp(0,0), first_name: 'Second', last_name: 'Two', contact_number: '2' }) },
    ];
    (admin.firestore().collection(`events/${mockEventData.docID}/attendees`).get as jest.Mock).mockResolvedValueOnce({
      forEach: (callback: (data: any) => void) => {
        mockAttendees.forEach(att => callback(att));
      }
    });

    const req = { data: mockEventData, auth: null, context: {} };
    await callableSendEmailReminderHandler(req as CallableContext);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'CHAI-TAGUIG',
        bcc: ['first@example.com', 'second@example.com'],
        subject: 'Event Reminder for Email Test Event',
        text: expect.stringContaining('This is a reminder to attend the event titled Email Test Event'),
        html: '<html>Mocked HTML Email</html>',
        attachments: expect.arrayContaining([
            expect.objectContaining({
                filename: 'CHAI.jpg',
                path: './public/CHAI.jpg',
                cid: 'CHAI'
            })
        ])
      })
    );
  });

  it('should generate email HTML using mjml2html with correct content', async () => {
    const mockEventData = {
      docID: 'eventMJML',
      name: 'MJML Test Event',
      description: 'MJML description.',
      start_date: new Timestamp(Date.now() / 1000, 0),
      end_date: new Timestamp((Date.now() + 3600000) / 1000, 0),
      location: 'MJML Location',
    };

    const req = { data: mockEventData, auth: null, context: {} };
    await callableSendEmailReminderHandler(req as CallableContext);

    expect(mjml2html).toHaveBeenCalledTimes(1);
    const mjmlConfig = (mjml2html as jest.Mock).mock.calls[0][0];
    const mjmlConfigString = JSON.stringify(mjmlConfig);
    expect(mjmlConfigString).toContain('Event Reminder for MJML Test Event');
    expect(mjmlConfigString).toContain('MJML description.');
    expect(mjmlConfigString).toContain('10:00 AM');
    expect(mjmlConfigString).toContain('January 1, 2024');
  });

  it('should return true if emails are accepted', async () => {
    const mockEventData = {
      docID: 'eventSuccess',
      name: 'Success Event',
      description: 'Success.',
      start_date: new Timestamp(Date.now() / 1000, 0),
      end_date: new Timestamp((Date.now() + 3600000) / 1000, 0),
      location: 'Success Location',
    };

    mockSendMail.mockResolvedValueOnce({
      messageId: 'success-id',
      accepted: ['attendee@example.com'],
    });

    const req = { data: mockEventData, auth: null, context: {} };
    const result = await callableSendEmailReminderHandler(req as CallableContext);

    expect(result).toBe(true);
  });

  it('should return false if no emails are accepted', async () => {
    const mockEventData = {
      docID: 'eventFailure',
      name: 'Failure Event',
      description: 'Failure.',
      start_date: new Timestamp(Date.now() / 1000, 0),
      end_date: new Timestamp((Date.now() + 3600000) / 1000, 0),
      location: 'Failure Location',
    };

    mockSendMail.mockResolvedValueOnce({
      messageId: 'failure-id',
      accepted: [],
    });

    const req = { data: mockEventData, auth: null, context: {} };
    const result = await callableSendEmailReminderHandler(req as CallableContext);

    expect(result).toBe(false);
  });

  it('should log message ID and info on successful send', async () => {
    const mockEventData = {
      docID: 'eventLog',
      name: 'Log Event',
      description: 'Logging test.',
      start_date: new Timestamp(Date.now() / 1000, 0),
      end_date: new Timestamp((Date.now() + 3600000) / 1000, 0),
      location: 'Log Location',
    };

    const mockInfo = {
      messageId: 'logged-message-id',
      accepted: ['attendee@example.com'],
    };
    mockSendMail.mockResolvedValueOnce(mockInfo);

    const req = { data: mockEventData, auth: null, context: {} };
    await callableSendEmailReminderHandler(req as CallableContext);

    expect(functions.logger.log).toHaveBeenCalledWith('Message sent:', mockInfo.messageId);
    expect(functions.logger.log).toHaveBeenCalledWith(mockInfo);
  });

  it('should handle errors during email sending gracefully', async () => {
    const mockEventData = {
      docID: 'eventError',
      name: 'Error Event',
      description: 'Error handling test.',
      start_date: new Timestamp(Date.now() / 1000, 0),
      end_date: new Timestamp((Date.now() + 3600000) / 1000, 0),
      location: 'Error Location',
    };

    const mockError = new Error('Nodemailer failed to send');
    mockSendMail.mockRejectedValueOnce(mockError);

    const req = { data: mockEventData, auth: null, context: {} };
    await expect(callableSendEmailReminderHandler(req as CallableContext)).rejects.toThrow('Nodemailer failed to send');
    expect(functions.logger.log).not.toHaveBeenCalledWith('Message sent:', expect.any(String));
  });
});