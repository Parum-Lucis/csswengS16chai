import functionsTest from "firebase-functions-test";

const mockCreateUser = jest.fn();
const mockSetCustomUserClaims = jest.fn();

jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn(() => ({
    createUser: mockCreateUser,
    setCustomUserClaims: mockSetCustomUserClaims,
  })),
}));

jest.mock("firebase-admin/firestore", () => {
  const mockDocUpdate = jest.fn();
  const mockDocCreate = jest.fn();
  const mockTimestamp = "mock-timestamp";

  const mockDoc = {
    create: mockDocCreate,
    update: mockDocUpdate,
  };

  const mockFirestore = {
    doc: jest.fn(() => {
      console.log("🔍 firestore.doc() called");
      return mockDoc;
    }),
    collection: jest.fn(() => ({
      doc: jest.fn(() => {
        console.log("📁 firestore.collection().doc() called");
        return mockDoc;
      }),
    })),
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

// Dynamically import functions after mocks are in place
let createVolunteerProfile: any;
let deleteVolunteerProfile: any;
beforeAll(async () => {
  const mod = await import("./index");
  createVolunteerProfile = mod.createVolunteerProfile;
  deleteVolunteerProfile = mod.deleteVolunteerProfile;
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

  it("updates volunteer document with time_to_live", async () => { //Only test that fails for now
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
