import { Timestamp } from "firebase-admin/firestore";
import { exportBeneficiaries as originalExportBeneficiaries } from "../csv/beneficiaries";
import { exportEvents as originalExportEvents, exportAttendees as originalExportAttendees } from "../csv/events";
import { exportVolunteers as originalExportVolunteers } from "../csv/volunteers";
import { HttpsError } from "firebase-functions/https";

jest.mock("firebase-admin/app", () => ({
    initializeApp: jest.fn(),
}));

jest.mock("firebase-admin/firestore", () => {
    const originalModule = jest.requireActual("firebase-admin/firestore");
    
    const subCollectionMock = {
        get: jest.fn().mockResolvedValue({ empty: false, docs: [{ data: () => ({ beneficiaryID: 'bene1' }) }] }),
    };

    const docMock = {
        create: jest.fn().mockResolvedValue(true),
        set: jest.fn().mockResolvedValue(true),
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ /* mock event data */ }) }),
        collection: jest.fn(() => subCollectionMock),
    };

    const collectionMock = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: [] }),
        doc: jest.fn(() => docMock),
    };

    return {
        ...originalModule,
        getFirestore: jest.fn(() => ({
            collection: jest.fn(() => collectionMock),
            doc: jest.fn(() => docMock),
            batch: jest.fn(() => ({
                set: jest.fn(),
                commit: jest.fn().mockResolvedValue(true),
            })),
        })),
        Timestamp: {
            fromDate: (date: Date) => ({
                toDate: () => date,
                toMillis: () => date.getTime(),
            }),
        },
    };
});


jest.mock("firebase-admin/auth", () => ({
    getAuth: jest.fn(() => ({
        createUser: jest.fn().mockResolvedValue({ uid: "test-uid" }),
        setCustomUserClaims: jest.fn().mockResolvedValue(true),
    })),
}));


jest.mock("firebase-functions/logger", () => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
}));

jest.mock("firebase-functions/https", () => ({
    onCall: jest.fn((handler) => handler),
    HttpsError: class HttpsError extends Error {
        code: string;
        constructor(code: string, message: string) {
            super(message);
            this.name = 'HttpsError';
            this.code = code;
        }
    },
}));

type MockRequest = {
    auth: { uid: string; token: { is_admin: boolean; }; } | null;
    data: string;
};

const exportBeneficiaries = originalExportBeneficiaries as unknown as (req: MockRequest) => Promise<string | boolean>;
const exportEvents = originalExportEvents as unknown as (req: MockRequest) => Promise<string | boolean>;
const exportAttendees = originalExportAttendees as unknown as (req: MockRequest) => Promise<string | boolean>;
const exportVolunteers = originalExportVolunteers as unknown as (req: MockRequest) => Promise<string | boolean>;

const mockAdminRequest: MockRequest = {
    auth: {
        uid: "admin-uid",
        token: {
            is_admin: true,
        },
    },
    data: "", // csv data will be added per test
};

const mockUnauthorizedRequest: MockRequest = {
    auth: null,
    data: "",
};


describe("CSV Export Functionality", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("exportBeneficiaries", () => {
        it("should successfully export beneficiaries to a CSV string", async () => {
            const mockBeneficiaries = [
                {
                    accredited_id: 101,
                    first_name: "John",
                    last_name: "Doe",
                    sex: "M",
                    birthdate: Timestamp.fromDate(new Date("2010-01-15")),
                    grade_level: "5",
                    address: "123 Main St",
                    guardians: [{ name: "Jane Doe", relation: "Mother", contact_number: "09123456789", email: "jane@doe.com" }],
                    time_to_live: null,
                },
            ];
            const getFirestore = require("firebase-admin/firestore").getFirestore;
            getFirestore().collection().get.mockResolvedValue({ docs: mockBeneficiaries.map(b => ({ data: () => b })) });

            const result = await exportBeneficiaries(mockAdminRequest) as string;
            expect(typeof result).toBe("string");
            expect(result).toContain('"Child Number (ID)","First Name","Last Name"');
            expect(result).toContain('"101","John","Doe"');
            expect(result).toContain('01/15/2010');
        });

        it("should throw an error if no beneficiaries exist", async () => {
            const getFirestore = require("firebase-admin/firestore").getFirestore;
            getFirestore().collection().get.mockResolvedValue({ docs: [] });
            await expect(exportBeneficiaries(mockAdminRequest)).rejects.toThrow("There are no beneficiaries to export.");
        });

        it("should deny access to unauthenticated users", async () => {
            const result = await exportBeneficiaries(mockUnauthorizedRequest);
            expect(result).toBe(false);
        });
    });

    describe("exportEvents", () => {
        it("should successfully export events to a CSV string", async () => {
            const mockEvents = [
                {
                    name: "Community Pantry",
                    description: "Food distribution",
                    start_date: Timestamp.fromDate(new Date("2025-12-24T17:00:00Z")),
                    end_date: Timestamp.fromDate(new Date("2025-12-24T20:00:00Z")),
                    location: "Community Hall",
                    time_to_live: null,
                },
            ];
            const getFirestore = require("firebase-admin/firestore").getFirestore;
            getFirestore().collection().get.mockResolvedValue({ docs: mockEvents.map(e => ({ data: () => e })) });
            
            const result = await exportEvents(mockAdminRequest) as string;
            expect(typeof result).toBe("string");
            expect(result).toContain('"Name","Description","Date","Start Time","End Time","Location"');
            expect(result).toContain('"Community Pantry","Food distribution"');
            expect(result).toContain('12/25/2025');
            expect(result).toContain('09:00');
            expect(result).toContain('12:00');
        });

        it("should throw an error if no events exist", async () => {
            const getFirestore = require("firebase-admin/firestore").getFirestore;
            getFirestore().collection().get.mockResolvedValue({ docs: [] });
            await expect(exportEvents(mockAdminRequest)).rejects.toThrow("There are no events to export.");
        });
    });

    describe("exportAttendees", () => {
        it("should successfully export event attendees to a CSV string", async () => {
            const getFirestore = require("firebase-admin/firestore").getFirestore;
            getFirestore().collection().doc().get.mockResolvedValue({
                exists: true,
                data: () => ({
                    name: "Test Event",
                    description: "Test Desc",
                    start_date: Timestamp.fromDate(new Date("2025-01-01T02:00:00Z")),
                    end_date: Timestamp.fromDate(new Date("2025-01-01T05:00:00Z")),
                    location: "Test Location",
                }),
            });

            getFirestore().collection().doc().collection().get.mockResolvedValue({
                empty: false,
                docs: [{ data: () => ({ beneficiaryID: 'bene1', first_name: 'Att', last_name: 'Endee', attended: true }) }]
            });

            getFirestore().collection().where().get.mockResolvedValue({
                docs: [{ id: 'bene1', data: () => ({ accredited_id: 999 }) }]
            });

            mockAdminRequest.data = "event123";
            const result = await exportAttendees(mockAdminRequest) as string;
            expect(typeof result).toBe("string");
            expect(result).toContain('"Event Name","Description","Date"');
            expect(result).toContain('"Test Event","Test Desc"');
            expect(result).toContain('"Child Number (ID) ID","First Name","Last Name"');
            expect(result).toContain('"999","Att","Endee","","","Yes"');
        });

        it("should throw an error if event is not found", async () => {
            const getFirestore = require("firebase-admin/firestore").getFirestore;
            getFirestore().collection().doc().get.mockResolvedValue({ exists: false });
            mockAdminRequest.data = "non-existent-event";
            await expect(exportAttendees(mockAdminRequest)).rejects.toThrow("Event not found.");
        });
    });

    describe("exportVolunteers", () => {
        it("should successfully export volunteers to a CSV string", async () => {
            const mockVolunteers = [
                {
                    email: "volunteer@example.com",
                    first_name: "Peter",
                    last_name: "Pan",
                    sex: "M",
                    birthdate: Timestamp.fromDate(new Date("1995-05-20")),
                    contact_number: "09123456789",
                    address: "Neverland",
                    is_admin: false,
                    time_to_live: null,
                },
            ];
            const getFirestore = require("firebase-admin/firestore").getFirestore;
            getFirestore().collection().get.mockResolvedValue({ docs: mockVolunteers.map(v => ({ data: () => v })) });

            const result = await exportVolunteers(mockAdminRequest) as string;
            expect(typeof result).toBe("string");
            expect(result).toContain('"Email","First Name","Last Name","Sex","Birthdate","Contact Number","Address","Admin"');
            expect(result).toContain('"volunteer@example.com","Peter","Pan","M","05/20/1995","09123456789","Neverland","FALSE"');
        });

        it("should throw an error if no volunteers exist", async () => {
             const getFirestore = require("firebase-admin/firestore").getFirestore;
            getFirestore().collection().get.mockResolvedValue({ docs: [] });
            await expect(exportVolunteers(mockAdminRequest)).rejects.toThrow("There are no volunteers to export.");
        });

        it("should deny access to non-admin users", async () => {
            const mockNonAdminRequest = { ...mockAdminRequest, auth: { uid: 'non-admin', token: { is_admin: false } } };
            const result = await exportVolunteers(mockNonAdminRequest);
            expect(result).toBe(false);
        });
    });
});
