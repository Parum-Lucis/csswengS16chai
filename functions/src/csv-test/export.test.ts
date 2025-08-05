import { HttpsError } from "firebase-functions/https";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";

// Mock the firebase-admin/firestore module, encapsulating all related mocks to prevent hoisting issues.
jest.mock("firebase-admin/firestore", () => {
  const originalModule = jest.requireActual("firebase-admin/firestore");

  // Create a mock Timestamp class that can be used with `instanceof`
  class MockTimestamp {
    constructor(private date: Date) {}
    toDate() {
      return this.date;
    }
    toMillis() {
      return this.date.getTime();
    }
    
    // Static methods
    static fromDate(date: Date) {
      return new MockTimestamp(date);
    }
    
    static fromMillis(millis: number) {
      return new MockTimestamp(new Date(millis));
    }
    
    static now() {
      return new MockTimestamp(new Date());
    }
  }

  const mockVolunteerData = [{
    docID: "vol1",
    email: "john.doe@example.com",
    first_name: "John",
    last_name: "Doe",
    sex: "M",
    birthdate: new MockTimestamp(new Date("1990-01-01T00:00:00.000Z")),
    contact_number: "09123456789",
    address: "123 Main St.",
    is_admin: true,
    time_to_live: null,
  }, {
    docID: "vol2",
    email: "jane.smith@example.com",
    first_name: "Jane",
    last_name: "Smith",
    sex: "F",
    birthdate: new MockTimestamp(new Date("1995-05-15T00:00:00.000Z")),
    contact_number: "09987654321",
    address: "456 Side Ave.",
    is_admin: false,
    time_to_live: null,
  }, ];

  const mockVolunteerSnapshot = {
    docs: mockVolunteerData.map((data) => ({
      data: () => data
    })),
  };

  // Updated mock event data - some with time_to_live: null (active) and some with timestamps (inactive)
  const mockEventData = [{
    docID: "event1",
    name: "Community Cleanup",
    description: "Help clean up the neighborhood park.",
    start_date: new MockTimestamp(new Date("2025-06-20T08:00:00.000Z")),
    end_date: new MockTimestamp(new Date("2025-06-20T12:00:00.000Z")),
    location: "Park St. and Main St.",
    time_to_live: null, // Active event
  }, {
    docID: "event2",
    name: "Tree Planting",
    description: "Planting trees in the new green space.",
    start_date: new MockTimestamp(new Date("2025-07-10T10:00:00.000Z")),
    end_date: new MockTimestamp(new Date("2025-07-10T14:00:00.000Z")),
    location: "City Green Space",
    time_to_live: null, // Active event
  }, {
    docID: "event3",
    name: "Deleted Event",  
    description: "This event should be filtered out.",
    start_date: new MockTimestamp(new Date("2025-08-01T09:00:00.000Z")),
    end_date: new MockTimestamp(new Date("2025-08-01T13:00:00.000Z")),
    location: "Somewhere",
    time_to_live: new MockTimestamp(new Date("2025-01-01T00:00:00.000Z")), // Inactive event (should be filtered out)
  }];

  const mockEventSnapshot = {
    docs: mockEventData.map((data) => ({
      data: () => data,
      ...data // Spread the data directly on the doc object too
    })),
  };

  const mockFirestore = {
    collection: jest.fn((collectionName: string) => {
      switch (collectionName) {
        case "volunteers":
          return {
            get: jest.fn(() => Promise.resolve(mockVolunteerSnapshot)),
          };
        case "events":
          return {
            get: jest.fn(() => Promise.resolve(mockEventSnapshot)),
          };
        default:
          return {
            get: jest.fn(() => Promise.resolve({ docs: [] })),
          };
      }
    }),
    doc: jest.fn((docID) => {
      const data = mockEventData.find(d => d.docID === docID);
      return {
        get: jest.fn(() => Promise.resolve({
          exists: !!data,
          data: () => data,
        })),
      };
    }),
  };

  return {
    ...originalModule,
    getFirestore: jest.fn(() => mockFirestore),
    Timestamp: MockTimestamp,
  };
});

jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn(),
}));

jest.mock("firebase-functions/logger", () => ({
  log: jest.fn(),
  warn: jest.fn(),
}));

const mockCsvHelpers = {
  escapeField: jest.fn((field) => `"${String(field).replace(/"/g, '""')}"`),
  formatDate: jest.fn((timestampOrDate) => {
    let dateObj;
    if (timestampOrDate instanceof (require("firebase-admin/firestore").Timestamp)) {
      dateObj = timestampOrDate.toDate();
    } else {
      dateObj = timestampOrDate;
    }
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }),
  formatTime: jest.fn((date) => {
    const hr = String(date.getUTCHours()).padStart(2, '0');
    const min = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hr}:${min}`;
  }),
};
jest.mock("../csv/helpers", () => ({
  csvHelpers: mockCsvHelpers,
}));

const mockAdminRequest = {
  data: {},
  auth: {
    token: {
      is_admin: true,
    },
    uid: "admin-uid",
  },
};

const mockNonAdminRequest = {
  data: {},
  auth: {
    token: {
      is_admin: false,
    },
    uid: "non-admin-uid",
  },
};

const mockUnauthenticatedRequest = {
  data: {},
  auth: null,
};

describe("exportVolunteers", () => {
  let exportVolunteers: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (getAuth as jest.Mock).mockReturnValue({});
    jest.isolateModules(() => {
      ({ exportVolunteers } = require("../csv/volunteers"));
    });
  });

  it("should successfully export volunteers to a CSV string", async () => {
    const expectedHeaders = `"Email","First Name","Last Name","Sex","Birthdate","Contact Number","Address","Admin"`;
    const expectedRows = [
      `"john.doe@example.com","John","Doe","M","01/01/1990","09123456789","123 Main St.","TRUE"`,
      `"jane.smith@example.com","Jane","Smith","F","05/15/1995","09987654321","456 Side Ave.","FALSE"`,
    ];
    const expectedCsv = `${expectedHeaders}\r\n${expectedRows.join("\r\n")}`;
    const result = await exportVolunteers.run(mockAdminRequest as any);
    expect(getFirestore().collection).toHaveBeenCalledWith("volunteers");
    expect(result).toEqual(expectedCsv);
  });

  it("should throw HttpsError if no volunteers are found", async () => {
    (getFirestore().collection as jest.Mock).mockReturnValue({
      get: jest.fn(() => Promise.resolve({
        docs: []
      })),
    });
    await expect(exportVolunteers.run(mockAdminRequest as any)).rejects.toThrow(
      new HttpsError("not-found", "There are no volunteers to export.")
    );
  });

  it("should return false if the user is not authenticated", async () => {
    const result = await exportVolunteers.run(mockUnauthenticatedRequest as any);
    expect(result).toBe(false);
  });

  it("should return false if the user is not an admin", async () => {
    const result = await exportVolunteers.run(mockNonAdminRequest as any);
    expect(result).toBe(false);
  });
});

describe("exportEvents", () => {
  let exportEvents: any;
  let mockFirestore: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuth as jest.Mock).mockReturnValue({});
    
    // Get the mocked firestore instance and ensure it has our event data
    mockFirestore = getFirestore();
    
    // Re-setup the collection mock for events specifically for this test
    const originalCollection = mockFirestore.collection;
    mockFirestore.collection = jest.fn((collectionName: string) => {
      if (collectionName === "events") {
        return {
          get: jest.fn(() => Promise.resolve({
            docs: [
              {
                data: () => ({
                  docID: "event1",
                  name: "Community Cleanup",
                  description: "Help clean up the neighborhood park.",
                  start_date: new (require("firebase-admin/firestore").Timestamp)(new Date("2025-06-20T08:00:00.000Z")),
                  end_date: new (require("firebase-admin/firestore").Timestamp)(new Date("2025-06-20T12:00:00.000Z")),
                  location: "Park St. and Main St.",
                  time_to_live: null,
                }),
                time_to_live: null, // Also set it directly on the doc object
              },
              {
                data: () => ({
                  docID: "event2",
                  name: "Tree Planting",
                  description: "Planting trees in the new green space.",
                  start_date: new (require("firebase-admin/firestore").Timestamp)(new Date("2025-07-10T10:00:00.000Z")),
                  end_date: new (require("firebase-admin/firestore").Timestamp)(new Date("2025-07-10T14:00:00.000Z")),
                  location: "City Green Space",
                  time_to_live: null,
                }),
                time_to_live: null, // Also set it directly on the doc object
              }
            ]
          })),
        };
      }
      return originalCollection(collectionName);
    });
    
    jest.isolateModules(() => {
      ({ exportEvents } = require("../csv/events"));
    });
  });

  it("should successfully export events to a CSV string", async () => {
    const expectedHeaders = `"Name","Description","Date","Start Time","End Time","Location"`;
    const expectedRows = [
      `"Community Cleanup","Help clean up the neighborhood park.","06/21/2025","16:00","20:00","Park St. and Main St."`,
      `"Tree Planting","Planting trees in the new green space.","07/11/2025","18:00","22:00","City Green Space"`,
    ];
    const expectedCsv = `${expectedHeaders}\r\n${expectedRows.join("\r\n")}`;
    const result = await exportEvents.run(mockAdminRequest as any);
    expect(getFirestore().collection).toHaveBeenCalledWith("events");
    expect(result).toEqual(expectedCsv);
  });

  it("should throw HttpsError if no events are found", async () => {
    (getFirestore().collection as jest.Mock).mockReturnValue({
      get: jest.fn(() => Promise.resolve({
        docs: []
      })),
    });
    await expect(exportEvents.run(mockAdminRequest as any)).rejects.toThrow(
      new HttpsError("not-found", "There are no events to export.")
    );
  });

  it("should return false if the user is not authenticated", async () => {
    const result = await exportEvents.run(mockUnauthenticatedRequest as any);
    expect(result).toBe(false);
  });
});