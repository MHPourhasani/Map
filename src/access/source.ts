import { isAuthSession, type AuthSession } from "./users";

export interface AuthSource {
    /** Synchronous initial read (used for the first render). */
    read(): AuthSession | null;
    /** Persists a new session (or clears it on logout). */
    write(session: AuthSession | null): void;
    /**
     * Optional: notify when the session changes in another tab (e.g. logout).
     * Returns an unsubscribe function.
     */
    subscribe?(onChange: (session: AuthSession | null) => void): () => void;
}

const STORAGE_KEY = "pm.auth-session";

/** Local demo source: persists the logged-in session in localStorage. */
export const localSessionSource: AuthSource = {
    read() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed: unknown = JSON.parse(raw);
            if (isAuthSession(parsed)) return parsed;
        } catch {
            // storage unavailable or tampered — fall through to logged-out
        }
        return null;
    },
    write(session) {
        try {
            if (session) {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
            } else {
                window.localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            // ignore storage failures; in-memory state still works
        }
    },
    subscribe(onChange) {
        const handler = (event: StorageEvent) => {
            if (event.key !== STORAGE_KEY) return;
            if (event.newValue === null) {
                onChange(null);
                return;
            }
            try {
                const parsed: unknown = JSON.parse(event.newValue);
                onChange(isAuthSession(parsed) ? parsed : null);
            } catch {
                onChange(null);
            }
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    },
};
