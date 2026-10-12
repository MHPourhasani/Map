import type { AccessLevel } from "./model";

/**
 * Pre-defined local accounts (demo auth, no backend): each username maps to a
 * fixed password + level, and the level alone drives visibility via capabilities.
 */
export interface LocalAccount {
    username: string;
    /** Plain-text demo password (not for production use). */
    password: string;
    level: AccessLevel;
}

export const LOCAL_ACCOUNTS: readonly LocalAccount[] = [
    { username: "user-basic", password: "1234", level: "basic" },
    { username: "user-standard", password: "1234", level: "standard" },
    { username: "user-vip", password: "1234", level: "vip" },
    { username: "user-vip2p", password: "1234", level: "vip" },
] as const;

export interface AuthSession {
    username: string;
    level: AccessLevel;
}

/** Case-sensitive username match + exact password match. Returns session or null. */
export function authenticate(username: string, password: string): AuthSession | null {
    const normalizedUsername = username.trim();
    if (!normalizedUsername || !password) return null;
    const account = LOCAL_ACCOUNTS.find((entry) => entry.username === normalizedUsername);
    if (!account || account.password !== password) return null;
    return { username: account.username, level: account.level };
}

export function isAuthSession(value: unknown): value is AuthSession {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return (
        typeof candidate.username === "string" &&
        candidate.username.length > 0 &&
        (candidate.level === "basic" || candidate.level === "standard" || candidate.level === "vip")
    );
}
