import { HttpsError } from "firebase-functions/https";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
}));

jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn(),
}));

jest.mock("firebase-functions/logger", () => ({
  log: jest.fn(),
  warn: jest.fn(),
}));

const mockCsvHelpers = {
  escapeField: jest.fn((field) => `"${String(field).replace(/"/g, '""')}"`),
  formatDate: jest.fn((timestamp) => {
    if (timestamp.toDate().toISOString().startsWith("1990-01-01")) {
      return "01/01/1990";
    }
    if (timestamp.toDate().toISOString().startsWith("1995-05-15")) {
      return "05/15/1995";
    }
    return "N/A";
  }),
};
jest.mock("../csv/helpers", () => ({
  csvHelpers: mockCsvHelpers,
}));

const mockVolunteerData = [{
  docID: "vol1",
  email: "john.doe@example.com",
  first_name: "John",
  last_name: "Doe",
  sex: "M",
  birthdate: { toDate: () => new Date("1990-01-01T00:00:00.000Z") },
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
  birthdate: { toDate: () => new Date("1995-05-15T00:00:00.000Z") },
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

const mockFirestore = {
  collection: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve(mockVolunteerSnapshot)),
  })),
};

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
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
    (getAuth as jest.Mock).mockReturnValue({});
    // Isolate modules to ensure a clean import with mocks applied
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
    expect(mockFirestore.collection).toHaveBeenCalledWith("volunteers");
    expect(result).toEqual(expectedCsv);
  });

  it("should throw HttpsError if no volunteers are found", async () => {
    (mockFirestore.collection as jest.Mock).mockReturnValue({
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
