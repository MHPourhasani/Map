import { createContext, useContext, useMemo, type ReactNode } from "react";
import { fa, type MessageKey } from "./fa";

export type Locale = "fa";
export type Direction = "rtl" | "ltr";

type Catalog = Partial<Record<MessageKey, string>>;

/**
 * English is intentionally left as a partial catalog. When the `Locale` union
 * grows to include `'en'`, register it in `dictionaries` below — missing keys
 * fall back to Persian automatically.
 */
export const enCatalog: Catalog = {
    "app.title": "Map & Router",
};

const dictionaries: Record<Locale, Catalog> = {
    fa,
};

export type MessageParams = Record<string, string | number>;

export interface I18nValue {
    locale: Locale;
    dir: Direction;
    t: (key: MessageKey, params?: MessageParams) => string;
}

function format(template: string, params?: MessageParams): string {
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
        Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
    );
}

export function createTranslator(locale: Locale): I18nValue["t"] {
    return (key, params) => {
        const catalog = dictionaries[locale] ?? {};
        const template = catalog[key] ?? fa[key] ?? key;
        return format(template, params);
    };
}

const faValue: I18nValue = {
    locale: "fa",
    dir: "rtl",
    t: createTranslator("fa"),
};

const I18nContext = createContext<I18nValue>(faValue);

export function I18nProvider({ children, locale = "fa" }: { children: ReactNode; locale?: Locale }) {
    const value = useMemo<I18nValue>(
        () => ({
            locale,
            dir: locale === "fa" ? "rtl" : "ltr",
            t: createTranslator(locale),
        }),
        [locale],
    );
    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
    return useContext(I18nContext);
}

export function useT(): I18nValue["t"] {
    return useI18n().t;
}
