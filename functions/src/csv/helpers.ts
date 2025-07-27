import { Timestamp } from "firebase-admin/firestore";

/**
 * Helper that splits a CSV string into non-empty lines.
 * Ignores first header.
 * Throws error if there are less than 2 lines (header + at least one data row).
 */
export function splitToLines(csv: string): string[] {
    const ignoreHeader = true; // adjust if need

    // remove blank rows
    csv = csv
        .split(/\r?\n/)
        .filter(line => line.split(",").some(cell => cell.trim() !== ""))
        .join("\n");
    csv = csv.replace(/\t/g, ",");
    const lines = csv.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
        throw new Error("CSV must contain at least one data row.");
    }
    return ignoreHeader ? lines.slice(1) : lines;
}

/**
 * Helper that properly capitalizes names.
 * Splits names by " " and "-".
 * Makes the first letter of each atomic name uppercase, while the rest are lowercase.
 */
export const capitalize = (str: string) =>
    str.split(" ").map(word =>
        word
            .split("-")
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join("-")
    ).join(" ");

/**
 * Helper that checks if contact_number is valid.
 * Requires number to be 11 characters and to start with "09".
 */
export const isValidContact = (num: string) =>
    num.length === 11 && num.startsWith("09");

// regex used for emails
export const emailRegEx = new RegExp(
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
); // from https://emailregex.com/, used elsewhere i think

// list of valid grade levels
export const validGradeLevels = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "n", "k"
];

export const isValidSex = (sex: string) => ['m', 'f'].includes(sex.toLowerCase());

// CSV helper functions
export const csvHelpers = {
    escapeField: (value: any): string => {
        if (value === null || value === undefined) return '""';
        const str = String(value);
        const escaped = str.replace(/"/g, '""');
        return `"${escaped}"`;
    },

    formatDate: (timestamp: Timestamp): string => {
        const dateObj = timestamp.toDate();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    },

    formatTime: (date: Date): string => {
        const hr = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${hr}:${min}`;
    },
    
    normalizeGradeLevel: (grade: string): string | null => {
        if (!grade) return null;
        const normalized = grade.toLowerCase().trim();
        if (normalized === 'nursery') return 'N';
        if (normalized === 'kindergarten') return 'K';
        if (validGradeLevels.includes(normalized)) return normalized;
        return null;
    }
};