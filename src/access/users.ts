import { isAccessLevel } from "./model.ts";
import { AccessLevel, type AccessLevel as AccessLevelType } from "./enums.ts";

export interface LocalAccount {
    username: string;
    password: string;
    level: AccessLevelType;
}

// Demo accounts only: plain-text passwords, not for production
export const LOCAL_ACCOUNTS: readonly LocalAccount[] = [
    { username: "user-basic", password: "1234", level: AccessLevel.BASIC },
    { username: "user-standard", password: "1234", level: AccessLevel.STANDARD },
    { username: "user-vip", password: "1234", level: AccessLevel.VIP },
    { username: "user-vip2p", password: "1234", level: AccessLevel.VIP },
] as const;

export interface AuthSession {
    username: string;
    level: AccessLevelType;
}

export function authenticate(username: string, password: string): AuthSession | null {
    const normalizedUsername = username.trim();
    if (!normalizedUsername || !password) return null;
    const account = LOCAL_ACCOUNTS.find((entry) => entry.username === normalizedUsername);
    if (!account || account.password !== password) return null;
    return { username: account.username, level: account.level };
}

export function isAuthSession(value: unknown): value is AuthSession {
    if (typeof value !== "object" || value === null) return false;
    const { username, level } = value as Record<string, unknown>;
    return typeof username === "string" && username.length > 0 && isAccessLevel(level);
}
