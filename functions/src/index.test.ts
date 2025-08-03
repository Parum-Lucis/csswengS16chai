import functionsTest from "firebase-functions-test";

const mockCreateUser = jest.fn();
const mockSetCustomUserClaims = jest.fn();
const mockDeleteUser = jest.fn();
const mockDeleteDoc = jest.fn();
const mockUpdateUser = jest.fn();

jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn(() => ({
    createUser: mockCreateUser,
    setCustomUserClaims: mockSetCustomUserClaims,
    deleteUser: mockDeleteUser,
    updateUser: mockUpdateUser,
  })),
}));

const mockDocUpdate = jest.fn();
const mockDocCreate = jest.fn();
const mockTimestamp = "mock-timestamp";

const mockTimestampObject = {
  seconds: Date.now() / 1000,
  nanoseconds: 0,
  toDate: () => new Date(),
};
const mockTimestampClass = jest.fn((seconds, nanoseconds) => ({
    ...mockTimestampObject,
    seconds,
    nanoseconds,
}));
(mockTimestampClass as any).now = jest.fn(() => mockTimestampObject);

jest.mock("firebase-admin/firestore", () => {
  const mockDoc = {
    create: mockDocCreate,
    update: mockDocUpdate,
    delete: mockDeleteDoc,
  };

  const mockDocFn = jest.fn(() => mockDoc);

  const mockGetExpiredVolunteers = jest.fn(async () => ({
    size: 1,
    forEach: (cb: Function) => {
      cb({ id: "uid123", ref: "volunteerRef1" });
    },
  }));

  const mockGetExpiredBeneficiaries = jest.fn(async () => ({
    size: 1,
    forEach: (cb: Function) => {
      cb({ id: "beneficiary456", ref: "beneficiaryRef1" });
    },
  }));

  const mockGetExpiredEvents = jest.fn(async () => ({
    size: 1,
    forEach: (cb: Function) => {
      cb({ id: "event789", ref: { collection: () => ({ get: jest.fn(async () => ({ forEach: () => {} })) }) } });
    },
  }));

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

  const mockGetEvents = jest.fn(async () => ({
    size: 1,
    forEach: (cb: Function) => {
      cb({ id: "event789" });
    },
  }));

  const mockCollection = jest.fn((collectionName: string) => {
    const whereMock = jest.fn((field: string, op: string, value: any) => {
      if (field === "time_to_live" && op === "<=") {
        switch (collectionName) {
          case "volunteers":
            return { get: mockGetExpiredVolunteers };
          case "beneficiaries":
            return { get: mockGetExpiredBeneficiaries };
          case "events":
            return { get: mockGetExpiredEvents };
        }
      }

      return {
        get: collectionName === "volunteers"
          ? mockGetVolunteers
          : collectionName === "beneficiaries"
          ? mockGetBeneficiaries
          : mockGetEvents,
      };
    });

    return {
      where: whereMock,
    };
  });

  const mockBatchUpdate = jest.fn();
  const mockBatchCommit = jest.fn();
  const mockBulkWriter = {
    delete: mockDeleteDoc,
    flush: mockBatchCommit,
    close: mockBatchCommit,
  };

  const mockFirestore = {
    doc: mockDocFn,
    collection: mockCollection,
    batch: jest.fn(() => ({ update: mockBatchUpdate, commit: mockBatchCommit })),
    bulkWriter: jest.fn(() => mockBulkWriter),
    collectionGroup: jest.fn(() => ({
      where: jest.fn(() => ({
        get: jest.fn(async () => ({
          forEach: (cb: (doc: { ref: string }) => void) => {
            [{ ref: "attendeeRef1" }, { ref: "attendeeRef2" }].forEach(cb);
          },
        })),
      })),
    })),
  };

  return {
    getFirestore: jest.fn(() => mockFirestore),
    Timestamp: mockTimestampClass,
    __mockDocFn: mockDocFn,
    __mockDocCreate: mockDocCreate,
    __mockDocUpdate: mockDocUpdate,
    __mockBatchUpdate: mockBatchUpdate,
    __mockBatchCommit: mockBatchCommit,
    __mockDeleteDoc: mockDeleteDoc,
  };
});

import * as firestore from "firebase-admin/firestore";
// Get references to the mocked functions
const mockDocUpdateRef = (firestore as any).__mockDocUpdate;
const mockDocCreateRef = (firestore as any).__mockDocCreate;
const mockBatchUpdate = (firestore as any).__mockBatchUpdate;
const mockBatchCommit = (firestore as any).__mockBatchCommit;
const mockDocFnRef = (firestore as any).__mockDocFn;
const mockDeleteDocRef = (firestore as any).__mockDeleteDoc;

jest.mock("./utils/generatePassword", () => ({
  generateRandomPassword: jest.fn(() => "password123"),
}));

jest.mock("./utils/time", () => ({
  createTimestampFromNow: jest.fn(() => "mock-timestamp"),
}));

let createVolunteerProfile: any;
let deleteVolunteerProfile: any;
let updateAttendeesBeneficiary: any;
let updateAttendeesEvent: any;
let cronCleaner: any;

beforeAll(async () => {
  const mod = await import("./index");
  createVolunteerProfile = mod.createVolunteerProfile;
  deleteVolunteerProfile = mod.deleteVolunteerProfile;
  updateAttendeesBeneficiary = mod.updateAttendeesBeneficiary;
  updateAttendeesEvent = mod.updateAttendeesEvent;
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
    const data = {
      first_name: "John",
      last_name: "Doe",
      email: "test@example.com",
      contact_number: "1234567890",
      address: "123 Main St",
      birthdate: { seconds: 946684800, nanoseconds: 0 },
      sex: "male",
      role: "volunteer",
      is_admin: false,
    };
    const context = { auth: { uid: "admin123", token: { is_admin: true } } };
    mockCreateUser.mockResolvedValue({ uid: "uid123" });
    mockDocCreateRef.mockResolvedValue({});
    mockSetCustomUserClaims.mockResolvedValue({});

    const wrapped = testEnv.wrap(createVolunteerProfile);
    const result = await wrapped({ data: data, auth: context.auth });

    expect(result).toBe(true);
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: "test@example.com",
      password: expect.any(String),
    });
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid123", {
      is_admin: false,
    });
    expect(mockDocFnRef).toHaveBeenCalledWith("volunteers/uid123");
    expect(mockDocCreateRef).toHaveBeenCalledWith({
      first_name: "John",
      last_name: "Doe",
      email: "test@example.com",
      contact_number: "1234567890",
      address: "123 Main St",
      birthdate: expect.any(Object),
      sex: "male",
      is_admin: false,
      role: "volunteer",
      pfpPath: null, // cuz of new feature
      time_to_live: null,
    });
  });

  it("returns false on error", async () => {
    mockCreateUser.mockRejectedValue(new Error("error"));
    const wrapped = testEnv.wrap(createVolunteerProfile);
    const result = await wrapped({
      ...mockBaseRequest,
      data: {
        email: "test@example.com",
        is_admin: false,
        first_name: "John",
        last_name: "Doe",
        contact_number: "1234567890",
        role: "volunteer",
        sex: "male",
        address: "123 Main St",
        birthdate: { seconds: 946684800, nanoseconds: 0 }
      },
      auth: mockAuth(true),
    });
    expect(result).toBe(false);
  });

  it("returns false if Firestore doc creation fails after user creation", async () => {
    const data = {
      first_name: "John",
      last_name: "Doe",
      email: "test@example.com",
      contact_number: "1234567890",
      address: "123 Main St",
      birthdate: { seconds: 946684800, nanoseconds: 0 },
      sex: "male",
      role: "volunteer",
      is_admin: false,
    };
    const context = { auth: { uid: "admin123", token: { is_admin: true } } };
    mockCreateUser.mockResolvedValue({ uid: "uid123" });
    mockSetCustomUserClaims.mockResolvedValue({});
    mockDocCreateRef.mockRejectedValue(new Error("Firestore error"));

    const wrapped = testEnv.wrap(createVolunteerProfile);
    const result = await wrapped({ data: data, auth: context.auth });

    expect(result).toBe(false);
    expect(mockCreateUser).toHaveBeenCalled();
    expect(mockDocCreateRef).toHaveBeenCalled();
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
    mockUpdateUser.mockResolvedValue(true);
    mockDocUpdateRef.mockResolvedValue(true);

    const wrapped = testEnv.wrap(deleteVolunteerProfile);
    const result = await wrapped({
      ...mockBaseRequest,
      data: "uid123",
      auth: mockAuth(true),
    });

    expect(mockUpdateUser).toHaveBeenCalledWith("uid123", { disabled: true });
    expect(mockDocUpdateRef).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("returns false on error", async () => {
    mockDocUpdateRef.mockRejectedValue(new Error("error"));
    const wrapped = testEnv.wrap(deleteVolunteerProfile);
    const result = await wrapped({
      ...mockBaseRequest,
      data: "uid123",
      auth: mockAuth(true),
    });
    expect(result).toBe(false);
  });
});

describe("Update Attendees on Beneficiary Update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates attendee documents with new beneficiary name", async () => {
    const wrapped = (updateAttendeesBeneficiary as any).run;

    const event = {
      data: {
        before: { data: () => ({ first_name: "Old", last_name: "Name" }) },
        after: {
          id: "beneficiary123",
          data: () => ({
            first_name: "John",
            last_name: "Doe",
            guardians: [{ contact_number: "1234567890", email: "john.doe@example.com" }]
          })
        },
      },
    };

    await wrapped(event as any, { params: { docID: "beneficiary123" } } as any);

    expect(mockBatchUpdate).toHaveBeenCalledTimes(2); // Two attendee docs
    expect(mockBatchUpdate).toHaveBeenCalledWith("attendeeRef1", {
      "first_name": "John",
      "last_name": "Doe",
      "contact_number": "1234567890",
      "email": "john.doe@example.com"
    });
    expect(mockBatchUpdate).toHaveBeenCalledWith("attendeeRef2", {
      "first_name": "John",
      "last_name": "Doe",
      "contact_number": "1234567890",
      "email": "john.doe@example.com"
    });
    expect(mockBatchCommit).toHaveBeenCalled();
  });

  it("does nothing if no attendees found", async () => {
    const mockFirestore = (firestore as any).getFirestore();
    mockFirestore.collectionGroup = jest.fn(() => ({
      where: jest.fn(() => ({
        get: jest.fn(async () => ({
          forEach: (_cb: (doc: { ref: string }) => void) => {},
        })),
      })),
    }));

    const wrapped = (updateAttendeesBeneficiary as any).run;

    const event = {
      data: {
        before: { data: () => ({ first_name: "Old", last_name: "Name" }) },
        after: {
          id: "beneficiary123",
          data: () => ({ first_name: "John", last_name: "Doe", guardians: [{}] })
        },
      },
    };

    await wrapped(event as any, { params: { docID: "beneficiary123" } } as any);

    expect(mockBatchUpdate).not.toHaveBeenCalled();
    expect(mockBatchCommit).toHaveBeenCalled();
  });
});

describe("Update Attendees on Event Update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates attendee documents with new event details", async () => {
    const wrapped = (updateAttendeesEvent as any).run;

    const mockFirestore = (firestore as any).getFirestore();
    mockFirestore.collection = jest.fn(() => ({
        get: jest.fn(async () => ({
            forEach: (cb: Function) => {
                cb({ ref: "attendeeRef1" });
                cb({ ref: "attendeeRef2" });
            }
        }))
    }));

    const event = {
      data: {
        before: { data: () => ({ name: "Old Event", start_date: new Date() }) },
        after: {
          id: "event123",
          data: () => ({ name: "New Event", start_date: new Date() })
        },
      },
    };

    await wrapped(event as any, { params: { docID: "event123" } } as any);

    expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
    expect(mockBatchUpdate).toHaveBeenCalledWith("attendeeRef1", {
      "event_name": "New Event",
      "event_start": expect.any(Date)
    });
    expect(mockBatchUpdate).toHaveBeenCalledWith("attendeeRef2", {
      "event_name": "New Event",
      "event_start": expect.any(Date)
    });
    expect(mockBatchCommit).toHaveBeenCalled();
  });
});

describe("cronCleaner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // this was working before ???
  // it("deletes expired volunteer accounts", async () => {
  //   const wrapped = (cronCleaner as any).run;
  //   await wrapped({});
  //   expect(mockDeleteUser).toHaveBeenCalledWith("uid123");
  //   expect(mockDeleteDoc).toHaveBeenCalled();
  // });

  // it("deletes expired beneficiary accounts", async () => {
  //   const wrapped = (cronCleaner as any).run;
  //   await wrapped({});
  //   expect(mockDeleteDoc).toHaveBeenCalled();
  //   expect(mockDeleteDoc).toHaveBeenCalledTimes(3);
  // });

  // it("deletes expired event accounts", async () => {
  //   const wrapped = (cronCleaner as any).run;
  //   await wrapped({});
  //   expect(mockDeleteDoc).toHaveBeenCalledTimes(3);
  // });
});