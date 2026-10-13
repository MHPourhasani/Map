import { useEffect, useMemo, type ReactNode } from "react";
import i18n, { t as translate } from "i18next";
import { I18nextProvider, initReactI18next, useTranslation } from "react-i18next";
import { fa, type MessageKey } from "./fa";
import { en } from "./en";

export const Language = {
    FA: "fa",
    EN: "en",
} as const;
export type Language = (typeof Language)[keyof typeof Language];

export const Direction = {
    RTL: "rtl",
    LTR: "ltr",
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];

export interface LanguageOption {
    code: Language;
    label: string;
    dir: Direction;
}

export const LANGUAGES: readonly LanguageOption[] = [
    { code: Language.FA, label: "فارسی", dir: Direction.RTL },
    { code: Language.EN, label: "English", dir: Direction.LTR },
] as const;

export const DEFAULT_LANGUAGE: Language = Language.FA;
const STORAGE_KEY = "pm.ui-language";

export function isLanguage(value: unknown): value is Language {
    return typeof value === "string" && LANGUAGES.some((language) => language.code === value);
}

export function resolveLanguage(raw: string | null): Language {
    return isLanguage(raw) ? raw : DEFAULT_LANGUAGE;
}

function readStoredLanguage(): Language {
    try {
        return resolveLanguage(window.localStorage.getItem(STORAGE_KEY));
    } catch {
        // Storage is unavailable (private mode): fall back to the default language.
        return DEFAULT_LANGUAGE;
    }
}

export function directionOf(language: Language): Direction {
    return LANGUAGES.find((entry) => entry.code === language)?.dir ?? Direction.LTR;
}

function applyDocumentDirection(language: Language): void {
    if (typeof document === "undefined") return;
    document.documentElement.lang = language;
    document.documentElement.dir = directionOf(language);
}

// Initialise i18next once, synchronously, with both catalogs bundled (no HTTP backend).
if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
        resources: {
            [Language.FA]: { translation: fa },
            [Language.EN]: { translation: en },
        },
        lng: readStoredLanguage(),
        fallbackLng: DEFAULT_LANGUAGE,
        defaultNS: "translation",
        interpolation: {
            // React already escapes; i18next escaping would double-encode the output.
            escapeValue: false,
        },
        returnNull: false,
    });
    applyDocumentDirection(resolveLanguage(i18n.language));
}

/** Switches the UI language, persists the choice and updates the <html> document direction. */
export async function changeLanguage(language: Language): Promise<void> {
    await i18n.changeLanguage(language);
    try {
        window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
        // Storage is unavailable: the choice just won't survive a reload.
    }
    applyDocumentDirection(language);
}

/** Typed translate function used across the app (kept for a stable, dependency-free call site). */
export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

export const translateWith = ((key: string, params?: Record<string, string | number>) =>
    translate(key, params as never) as unknown as string) as Translate;

/** Wires i18next into React. i18next is initialised at module load, so this just provides it. */
export function I18nProvider({ children }: { children: ReactNode }) {
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export function useT(): Translate {
    const { t } = useTranslation();
    return useMemo<Translate>(
        () => ((key: MessageKey, params?: Record<string, string | number>) => t(key, params as never) as unknown as string) as Translate,
        [t],
    );
}

/** Current UI language as a typed value; re-renders on change and keeps <html> direction in sync. */
export function useLanguage(): Language {
    const { i18n: instance } = useTranslation();
    const language = resolveLanguage(instance.language);
    useEffect(() => {
        applyDocumentDirection(language);
        const handler = () => applyDocumentDirection(resolveLanguage(instance.language));
        instance.on("languageChanged", handler);
        return () => {
            instance.off("languageChanged", handler);
        };
    }, [instance, language]);
    return language;
}

export { i18n };
