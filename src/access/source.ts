import { isAuthSession, type AuthSession } from "./users";

export interface AuthSource {
    read(): AuthSession | null;
    write(session: AuthSession | null): void;
    /** Optional: notifies when the session changes in another tab; returns an unsubscribe function */
    subscribe?(onChange: (session: AuthSession | null) => void): () => void;
}

const STORAGE_KEY = "pm.auth-session";

function parseSession(raw: string): AuthSession | null {
    try {
        const parsed: unknown = JSON.parse(raw);
        return isAuthSession(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

export const localSessionSource: AuthSource = {
    read() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? parseSession(raw) : null;
        } catch {
            // Storage is unavailable (private mode): treat as logged out
            return null;
        }
    },
    write(session) {
        try {
            if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
            else localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Storage is unavailable: the in-memory session still works
        }
    },
    subscribe(onChange) {
        const handler = (event: StorageEvent) => {
            if (event.key !== STORAGE_KEY) return;
            onChange(event.newValue === null ? null : parseSession(event.newValue));
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    },
};
