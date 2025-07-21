import functionsTest from "firebase-functions-test";

const mockCreateUser = jest.fn();
const mockSetCustomUserClaims = jest.fn();
const mockDeleteUser = jest.fn();
const mockDeleteDoc = jest.fn();

jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn(() => ({
    createUser: mockCreateUser,
    setCustomUserClaims: mockSetCustomUserClaims,
    deleteUser: mockDeleteUser,
  })),
}));

jest.mock("firebase-admin/firestore", () => {
  const mockDocUpdate = jest.fn();
  const mockDocCreate = jest.fn();
  const mockTimestamp = "mock-timestamp";

  const mockDoc = {
    create: mockDocCreate,
    update: mockDocUpdate,
    delete: mockDeleteDoc,
  };

  const mockGetVolunteers = jest.fn(async () => ({
    size: 1,
    forEach: (cb: Function) => {
      cb({ id: "uid123" });
    },
  }));

  const mockGetBeneficiaries = jest.fn(async () => ({
    size: 1,
    forEach: (cb: Function) => {
      cb({ id: "beneficiary456" });
    },
  }));

  const mockCollection = jest.fn((collectionName: string) => ({
    where: jest.fn(() => ({
      get:
        collectionName === "volunteers"
          ? mockGetVolunteers
          : mockGetBeneficiaries,
    })),
  }));

  const mockFirestore = {
    doc: jest.fn(() => mockDoc),
    collection: mockCollection,
  };

  return {
    getFirestore: jest.fn(() => mockFirestore),
    Timestamp: {
      now: jest.fn(() => mockTimestamp),
    },
    __mockDocCreate: mockDocCreate,
    __mockDocUpdate: mockDocUpdate,
  };
});

import * as firestore from "firebase-admin/firestore";
const mockDocUpdate = (firestore as any).__mockDocUpdate;
const mockDocCreate = (firestore as any).__mockDocCreate;

jest.mock("./utils/generatePassword", () => ({
  generateRandomPassword: jest.fn(() => "password123"),
}));

jest.mock("./utils/time", () => ({
  createTimestampFromNow: jest.fn(() => "mock-timestamp"),
}));

let createVolunteerProfile: any;
let deleteVolunteerProfile: any;
let deleteBeneficiaryProfile: any;
let deleteEvent: any;
let updateAttendees: any;
let cronCleaner: any;
beforeAll(async () => {
  const mod = await import("./index");
  createVolunteerProfile = mod.createVolunteerProfile;
  deleteVolunteerProfile = mod.deleteVolunteerProfile;
  deleteBeneficiaryProfile = mod.deleteBeneficiaryProfile;
  deleteEvent = mod.deleteEvent;
  updateAttendees = mod.updateAttendees;
  cronCleaner = mod.cronCleaner;
});

const testEnv = functionsTest();

const mockAuth = (isAdmin: boolean) => ({
  uid: "test-uid",
  token: {
    is_admin: isAdmin,
    aud: "audience",
    auth_time: 1234567890,
    exp: 1234567890,
    firebase: {
      identities: {},
      sign_in_provider: "password",
    },
    iat: 1234567890,
    iss: "issuer",
    sub: "sub",
    uid: "test-uid",
  },
});

const mockBaseRequest = {
  rawRequest: {} as any,
  acceptsStreaming: false,
};

describe("Create Volunteer Profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns false if not authenticated", async () => {
    const wrapped = testEnv.wrap(createVolunteerProfile);
    const result = await wrapped({
      ...mockBaseRequest,
      data: { email: "test@example.com", is_admin: false },
    });
    expect(result).toBe(false);
  });

  it("returns false if not admin", async () => {
    const wrapped = testEnv.wrap(createVolunteerProfile);
    const result = await wrapped({
      ...mockBaseRequest,
      data: { email: "test@example.com", is_admin: false },
      auth: mockAuth(false),
    });
    expect(result).toBe(false);
  });

  it("creates user and document when admin", async () => {
    mockCreateUser.mockResolvedValue({ uid: "uid123" });
    mockDocCreate.mockResolvedValue(true);

    const wrapped = testEnv.wrap(createVolunteerProfile);
    const result = await wrapped({
      ...mockBaseRequest,
      data: { email: "test@example.com", is_admin: false },
      auth: mockAuth(true),
    });

    expect(mockCreateUser).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid123", {
      is_admin: false,
    });
    expect(mockDocCreate).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("returns false on error", async () => {
    mockCreateUser.mockRejectedValue(new Error("error"));
    const wrapped = testEnv.wrap(createVolunteerProfile);
    const result = await wrapped({
      ...mockBaseRequest,
      data: { email: "test@example.com", is_admin: false },
      auth: mockAuth(true),
    });
    expect(result).toBe(false);
  });

  it("returns false if Firestore doc creation fails after user creation", async () => {
    mockCreateUser.mockResolvedValue({ uid: "uid123" });
    mockDocCreate.mockRejectedValue(new Error("Firestore error"));

    const wrapped = testEnv.wrap(createVolunteerProfile);
    const result = await wrapped({
      ...mockBaseRequest,
      data: { email: "test@example.com", is_admin: false },
      auth: mockAuth(true),
    });

    expect(result).toBe(false);
    expect(mockCreateUser).toHaveBeenCalled();
    expect(mockDocCreate).toHaveBeenCalled();
  });
});

describe("Delete Volunteer Profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns false if not authenticated", async () => {
    const wrapped = testEnv.wrap(deleteVolunteerProfile);
    const result = await wrapped({
      ...mockBaseRequest,
      data: "uid123",
    });
    expect(result).toBe(false);
  });

  it("updates volunteer document with time_to_live", async () => {
    mockDocUpdate.mockResolvedValue(true);
    const wrapped = testEnv.wrap(deleteVolunteerProfile);
    const result = await wrapped({
      ...mockBaseRequest,
      data: "uid123",
      auth: mockAuth(true),
    });
    expect(mockDocUpdate).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("returns false on error", async () => {
    mockDocUpdate.mockRejectedValue(new Error("error"));
    const wrapped = testEnv.wrap(deleteVolunteerProfile);
    const result = await wrapped({
      ...mockBaseRequest,
      data: "uid123",
      auth: mockAuth(true),
    });
    expect(result).toBe(false);
  });
});

describe("Delete Beneficiary Profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns false if not authenticated", async () => {
    const wrapped = testEnv.wrap(deleteBeneficiaryProfile);
    const result = await wrapped({
      ...mockBaseRequest,
      data: "uid123",
    });
    expect(result).toBe(false);
  });

  it("updates beneficiary document with time_to_live", async () => {
    mockDocUpdate.mockResolvedValue(true);
    const wrapped = testEnv.wrap(deleteBeneficiaryProfile);
    const result = await wrapped({
      ...mockBaseRequest,
      data: "uid123",
      auth: mockAuth(true),
    });
    expect(mockDocUpdate).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("returns false on error", async () => {
    mockDocUpdate.mockRejectedValue(new Error("error"));
    const wrapped = testEnv.wrap(deleteBeneficiaryProfile);
    const result = await wrapped({
      ...mockBaseRequest,
      data: "uid123",
      auth: mockAuth(true),
    });
    expect(result).toBe(false);
  });
});

describe("Delete Event", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns false if not authenticated", async () => {
    const wrapped = testEnv.wrap(deleteEvent);
    const result = await wrapped({ ...mockBaseRequest, data: "event123" });
    expect(result).toBe(false);
  });

  it("updates event document with time_to_live", async () => {
    mockDocUpdate.mockResolvedValue(true);
    const wrapped = testEnv.wrap(deleteEvent);
    const result = await wrapped({ ...mockBaseRequest, data: "event123", auth: mockAuth(true) });
    expect(mockDocUpdate).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("returns false on error", async () => {
    mockDocUpdate.mockRejectedValue(new Error("error"));
    const wrapped = testEnv.wrap(deleteEvent);
    const result = await wrapped({ ...mockBaseRequest, data: "event123", auth: mockAuth(true) });
    expect(result).toBe(false);
  });
});

describe("Update Attendees", () => {
  const mockBatchUpdate = jest.fn();
  const mockBatchCommit = jest.fn();
  const mockBatch = {
    update: mockBatchUpdate,
    commit: mockBatchCommit,
  };

  const mockAttendeeDocs = [
    { ref: "attendeeRef1" },
    { ref: "attendeeRef2" },
  ];

  beforeAll(() => {
    (firestore as any).getFirestore().batch = jest.fn(() => mockBatch);

    (firestore as any).getFirestore().collectionGroup = jest.fn(() => ({
      where: jest.fn(() => ({
        get: jest.fn(async () => ({
          forEach: (cb: (doc: { ref: string }) => void) =>
            mockAttendeeDocs.forEach(cb),
        })),
      })),
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates attendee documents with new beneficiary name", async () => {
    const wrapped = (updateAttendees as any).run;

    const event = {
      data: {
        before: { data: () => ({ first_name: "Old", last_name: "Name" }) },
        after: { data: () => ({ first_name: "John", last_name: "Doe" }) },
      },
    };

    await wrapped(event as any, { params: { docID: "beneficiary123" } } as any);

    expect(mockBatchUpdate).toHaveBeenCalledTimes(mockAttendeeDocs.length);
    mockAttendeeDocs.forEach((doc) => {
      expect(mockBatchUpdate).toHaveBeenCalledWith(doc.ref, {
        first_name: "John",
        last_name: "Doe",
      });
    });
    expect(mockBatchCommit).toHaveBeenCalled();
  });

  it("does nothing if no attendees found", async () => {
    const wrapped = (updateAttendees as any).run;

    (firestore as any).getFirestore().collectionGroup = jest.fn(() => ({
      where: jest.fn(() => ({
        get: jest.fn(async () => ({
          forEach: (_cb: (doc: { ref: string }) => void) => {}, // No calls
        })),
      })),
    }));

    const event = {
      data: {
        before: { data: () => ({ first_name: "Old", last_name: "Name" }) },
        after: { data: () => ({ first_name: "John", last_name: "Doe" }) },
      },
    };

    await wrapped(event as any, { params: { docID: "beneficiary123" } } as any);

    expect(mockBatchUpdate).not.toHaveBeenCalled();
    expect(mockBatchCommit).toHaveBeenCalled();
  });
});

describe("cronCleaner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes expired volunteer accounts", async () => {
    const wrapped = (cronCleaner as any).run;
    await wrapped({});
    expect(mockDeleteUser).toHaveBeenCalledWith("uid123");
    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it("deletes expired beneficiary accounts", async () => {
    const wrapped = (cronCleaner as any).run;
    await wrapped({});
    expect(mockDeleteDoc).toHaveBeenCalled();
    expect(mockDeleteDoc).toHaveBeenCalledTimes(3);
  });

  it("deletes expired event accounts", async () => {
    const wrapped = (cronCleaner as any).run;
    await wrapped({});
    expect(mockDeleteDoc).toHaveBeenCalledTimes(3); 
  });
});
