const mockSetCustomUserClaims = jest.fn();
jest.mock("firebase-admin/auth", () => ({
  getAuth: () => ({
    setCustomUserClaims: mockSetCustomUserClaims,
  }),
}));

const mockDocUpdate = jest.fn();
const mockDoc = jest.fn(() => ({
  update: mockDocUpdate,
}));
jest.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    doc: mockDoc,
  }),
}));

const mockLoggerError = jest.fn();
jest.mock("firebase-functions/v2", () => ({
  logger: {
    error: mockLoggerError,
  },
}));

let capturedHandler: any;
jest.mock("firebase-functions/https", () => ({
  onCall: jest.fn((handler) => {
    capturedHandler = handler;
    return jest.fn(); 
  }),
}));

const TARGET_UID = "volunteerToPromoteUid";

import "../admin/promoteVolunteerToAdmin";

const callFunction = (data: string, auth?: any) => {
  const req = { data, auth };
  return capturedHandler(req);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSetCustomUserClaims.mockResolvedValue(undefined);
  mockDocUpdate.mockResolvedValue(undefined);
});

describe("Promote Volunteer To Admin", () => {
  test("returns false when no auth present", async () => {
    const result = await callFunction(TARGET_UID, undefined);
    expect(result).toBe(false);
    expect(mockSetCustomUserClaims).not.toHaveBeenCalled();
    expect(mockDocUpdate).not.toHaveBeenCalled();
  });

  test("returns false when caller not admin", async () => {
    const result = await callFunction(TARGET_UID, { token: { is_admin: false } });
    expect(result).toBe(false);
    expect(mockSetCustomUserClaims).not.toHaveBeenCalled();
    expect(mockDocUpdate).not.toHaveBeenCalled();
  });

  test("promotes volunteer when caller is admin", async () => {
    const result = await callFunction(TARGET_UID, { token: { is_admin: true } });
    expect(result).toBe(true);
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith(TARGET_UID, { is_admin: true });
    expect(mockDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(`volunteers/${TARGET_UID}`);
    expect(mockDocUpdate).toHaveBeenCalledWith({ is_admin: true, role: "Admin" });
  });

  test("returns false and logs error when setCustomUserClaims rejects", async () => {
    mockSetCustomUserClaims.mockRejectedValueOnce(new Error("setCustomUserClaims failed"));
    const result = await callFunction(TARGET_UID, { token: { is_admin: true } });
    expect(result).toBe(false);
    expect(mockLoggerError).toHaveBeenCalledWith(expect.any(Error));
    expect(mockLoggerError.mock.calls[0][0].message).toBe("setCustomUserClaims failed");
  });

  test("returns false and logs error when Firestore update rejects", async () => {
    mockDocUpdate.mockRejectedValueOnce(new Error("Firestore update failed"));
    const result = await callFunction(TARGET_UID, { token: { is_admin: true } });
    expect(result).toBe(false);
    expect(mockLoggerError).toHaveBeenCalledWith(expect.any(Error));
    expect(mockLoggerError.mock.calls[0][0].message).toBe("Firestore update failed");
  });

  test("returns false for invalid UID", async () => {
    mockSetCustomUserClaims.mockRejectedValueOnce(new Error("Invalid UID"));
    const result = await callFunction("invalidUid", { token: { is_admin: true } });
    expect(result).toBe(false);
    expect(mockLoggerError).toHaveBeenCalledWith(expect.any(Error));
    expect(mockLoggerError.mock.calls[0][0].message).toBe("Invalid UID");
  });

  test("idempotent-ish: multiple calls succeed", async () => {
    const r1 = await callFunction(TARGET_UID, { token: { is_admin: true } });
    const r2 = await callFunction(TARGET_UID, { token: { is_admin: true } });
    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(mockSetCustomUserClaims).toHaveBeenCalledTimes(2);
    expect(mockDocUpdate).toHaveBeenCalledTimes(2);
  });
});
