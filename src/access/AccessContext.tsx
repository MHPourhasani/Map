import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_ACCESS_LEVEL, capabilitiesOf, type AccessLevel, type Capability } from "./model";
import { localSessionSource, type AuthSource } from "./source";
import { authenticate, type AuthSession } from "./users";

export interface AccessValue {
    /** Effective level: the logged-in tier, or the public default when logged out. */
    level: AccessLevel;
    /** Active session, or null when logged out. */
    session: AuthSession | null;
    /** True when a user is logged in. */
    isAuthenticated: boolean;
    /** Validate credentials against the pre-defined accounts. */
    login: (username: string, password: string) => boolean;
    /** Clear the session. */
    logout: () => void;
    /** Capability check — the only thing feature code should depend on. */
    can: (capability: Capability) => boolean;
}
const AccessContext = createContext<AccessValue | null>(null);

export function AccessProvider({ children, source = localSessionSource }: { children: ReactNode; source?: AuthSource }) {
    const [session, setSessionState] = useState<AuthSession | null>(() => source.read());

    useEffect(() => source.subscribe?.(setSessionState), [source]);

    const login = useCallback(
        (username: string, password: string) => {
            const next = authenticate(username, password);
            if (!next) return false;
            setSessionState(next);
            source.write(next);
            return true;
        },
        [source],
    );

    const logout = useCallback(() => {
        setSessionState(null);
        source.write(null);
    }, [source]);

    const value = useMemo<AccessValue>(() => {
        const level: AccessLevel = session?.level ?? DEFAULT_ACCESS_LEVEL;
        const granted = capabilitiesOf(level);
        return {
            level,
            session,
            isAuthenticated: session !== null,
            login,
            logout,
            can: (capability) => granted.has(capability),
        };
    }, [session, login, logout]);

    return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess(): AccessValue {
    const value = useContext(AccessContext);
    if (!value) throw new Error("useAccess must be used inside <AccessProvider>");
    return value;
}
