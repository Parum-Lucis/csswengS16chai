/**
 * Determine the mobile operating system.
 * This function returns one of 'iOS', 'Android', 'Windows Phone', or 'unknown'.
 * Taken from: https://stackoverflow.com/questions/21741841/detecting-ios-android-operating-system
 *
 * @returns "Windows Phone" | "Android" | "iOS" | "unknown"
 */
export function getMobileOperatingSystem() {
    const { userAgent } = navigator;

    // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
        return "Windows Phone";
    }

    if (/android/i.test(userAgent)) {
        return "Android";
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent)) {
        return "iOS";
    }

    return "unknown";
}