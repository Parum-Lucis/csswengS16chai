export function generateRandomPassword(pass_length: number) {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    return Array.from(crypto.getRandomValues(new Uint32Array(pass_length)))
        .map((x) => chars[x % chars.length])
        .join('')
}