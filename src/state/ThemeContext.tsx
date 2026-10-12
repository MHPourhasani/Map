import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { MapTheme } from "../map/styles";

const STORAGE_KEY = "pm.map-theme";

function readStoredTheme(): MapTheme {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "dark" || stored === "light") return stored;
    } catch {
        // Storage is unavailable (private mode): fall back to the default
    }
    return "light";
}

function storeTheme(theme: MapTheme): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        // Storage is unavailable: the choice just won't survive a reload
    }
}

interface ThemeValue {
    theme: MapTheme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<MapTheme>(readStoredTheme);

    const toggleTheme = useCallback(() => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        storeTheme(next);
    }, [theme]);

    const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
    const value = useContext(ThemeContext);
    if (!value) throw new Error("useTheme must be used inside <ThemeProvider>");
    return value;
}
