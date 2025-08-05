/**
 * @jest-environment jsdom
 */
import { importBeneficiaries as originalImportBeneficiaries } from "../csv/beneficiaries";
import { importEvents as originalImportEvents } from "../csv/events";
import { importVolunteers as originalImportVolunteers } from "../csv/volunteers";
import { HttpsError } from "firebase-functions/https";

jest.mock("firebase-admin/app", () => ({
    initializeApp: jest.fn(),
}));

jest.mock("firebase-admin/firestore", () => {
    const originalModule = jest.requireActual("firebase-admin/firestore");
    const docMock = {
        create: jest.fn().mockResolvedValue(true),
        set: jest.fn().mockResolvedValue(true),
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

jest.mock("../utils/generatePassword", () => ({
    generateRandomPassword: jest.fn(() => "mockedPassword123"),
}));

type MockRequest = {
    auth: { uid: string; token: { is_admin: boolean; }; } | null;
    data: string;
};

type ImportResult = {
    imported: number;
    skipped: number;
};

const importBeneficiaries = originalImportBeneficiaries as unknown as (req: MockRequest) => Promise<ImportResult>;
const importEvents = originalImportEvents as unknown as (req: MockRequest) => Promise<ImportResult>;
const importVolunteers = originalImportVolunteers as unknown as (req: MockRequest) => Promise<ImportResult | boolean>;


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


describe("CSV Import Functionality", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("importBeneficiaries", () => {
        const validHeader = "Child Number (ID),First Name,Last Name,Sex,Birthdate,Grade Level,Address,Name (Guardian 1),Relation (Guardian 1),Contact Number (Guardian 1),Email (Guardian 1)\n";

        it("should successfully import valid beneficiary data", async () => {
            const csvData = validHeader + '101,John,Doe,M,01/15/2010,5,"123 Main St, City",Jane Doe,Mother,09123456789,jane.doe@email.com';
            mockAdminRequest.data = csvData;
            
            const result = await importBeneficiaries(mockAdminRequest);
            expect(result.imported).toBe(1);
            expect(result.skipped).toBe(0);
        });

        it("should skip a beneficiary with a missing first name", async () => {
            const csvData = validHeader + '102,,Doe,F,02/20/2011,4,"456 Oak Ave",,Father,09987654321,';
            mockAdminRequest.data = csvData;

            await expect(importBeneficiaries(mockAdminRequest)).rejects.toThrow(HttpsError);
        });

        it("should skip a beneficiary with an invalid birthdate", async () => {
            const csvData = validHeader + '103,Alice,Smith,F,invalid-date,3,"789 Pine Ln",Bob Smith,Father,09112223344,';
             mockAdminRequest.data = csvData;
            
            await expect(importBeneficiaries(mockAdminRequest)).rejects.toThrow(HttpsError);
        });
        
        it("should skip a beneficiary with an invalid contact number", async () => {
            const csvData = validHeader + '104,Tom,Jones,M,03/10/2012,2,"321 Elm St",Mary Jones,Mother,12345,';
            mockAdminRequest.data = csvData;

            await expect(importBeneficiaries(mockAdminRequest)).rejects.toThrow(HttpsError);
        });

        it("should throw an error if csv contains only a header", async () => {
            const csvData = validHeader;
            mockAdminRequest.data = csvData;

            await expect(importBeneficiaries(mockAdminRequest)).rejects.toThrow("CSV must contain at least one data row.");
        });

        it("should deny access to unauthenticated users", async () => {
            const csvData = validHeader + '101,John,Doe,M,01/15/2010,5,"123 Main St",Jane Doe,Mother,09123456789,jane.doe@email.com';
            mockUnauthorizedRequest.data = csvData;

            await expect(importBeneficiaries(mockUnauthorizedRequest)).rejects.toThrow("Authentication and admin privileges required!");
        });
    });

    describe("importEvents", () => {
        const validHeader = "Name,Description,Date,Start Time,End Time,Location\n";

        it("should successfully import valid event data", async () => {
            const csvData = validHeader + '"Community Pantry","Food distribution event","2025-12-25","09:00","12:00","Community Hall"';
            mockAdminRequest.data = csvData;

            const result = await importEvents(mockAdminRequest);
            expect(result.imported).toBe(1);
            expect(result.skipped).toBe(0);
        });

        it("should skip an event with missing required fields (e.g., name)", async () => {
            const csvData = validHeader + ',"Food distribution event","2025-12-25","09:00","12:00","Community Hall"';
            mockAdminRequest.data = csvData;

            await expect(importEvents(mockAdminRequest)).rejects.toThrow("No valid events to import.");
        });

        it("should skip an event with an invalid time format", async () => {
            const csvData = validHeader + '"Christmas Party","Annual party","2025-12-24","invalid-time","17:00","Main Office"';
            mockAdminRequest.data = csvData;
            
            await expect(importEvents(mockAdminRequest)).rejects.toThrow("No valid events to import.");
        });

        it("should throw an error if csv contains only a header", async () => {
            const csvData = validHeader;
            mockAdminRequest.data = csvData;

            await expect(importEvents(mockAdminRequest)).rejects.toThrow("CSV must contain at least one data row.");
        });
    });

    describe("importVolunteers", () => {
        const validHeader = "Email,First Name,Last Name,Sex,Birthdate,Contact Number,Address,Admin\n";

        it("should successfully import a valid volunteer", async () => {
            const csvData = validHeader + "volunteer@example.com,Peter,Pan,M,1995-05-20,09123456789,Neverland,FALSE";
            mockAdminRequest.data = csvData;

            const result = await importVolunteers(mockAdminRequest);
            expect(result).toEqual({ imported: 1, skipped: 0 });
        });
        
        it("should successfully import a valid admin", async () => {
            const csvData = validHeader + "admin@example.com,Wendy,Darling,F,1992-08-15,09987654321,London,TRUE";
            mockAdminRequest.data = csvData;

            const result = await importVolunteers(mockAdminRequest);
            expect(result).toEqual({ imported: 1, skipped: 0 });
        });

        it("should skip a volunteer with an invalid email", async () => {
            const csvData = validHeader + "invalid-email,Captain,Hook,M,1980-01-01,09112223344,Jolly Roger,FALSE";
            mockAdminRequest.data = csvData;

            await expect(importVolunteers(mockAdminRequest)).rejects.toThrow("No valid volunteers to import.");
        });

        it("should skip a volunteer with a missing required field (e.g., last name)", async () => {
            const csvData = validHeader + "smee@example.com,Smee,,M,1975-03-10,09223334455,Jolly Roger,FALSE";
            mockAdminRequest.data = csvData;

            await expect(importVolunteers(mockAdminRequest)).rejects.toThrow("No valid volunteers to import.");
        });

        it("should throw an error if csv contains only a header", async () => {
            const csvData = validHeader;
            mockAdminRequest.data = csvData;

            await expect(importVolunteers(mockAdminRequest)).rejects.toThrow("CSV must contain at least one data row.");
        });

        it("should deny access to non-admin users", async () => {
            const csvData = validHeader + "volunteer@example.com,Peter,Pan,M,1995-05-20,09123456789,Neverland,FALSE";
            const mockNonAdminRequest = { ...mockAdminRequest, auth: { uid: 'non-admin', token: { is_admin: false } } };
            mockNonAdminRequest.data = csvData;
            
            const result = await importVolunteers(mockNonAdminRequest);
            expect(result).toBe(false);
        });
    });
});
