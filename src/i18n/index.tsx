import { createContext, useContext, useMemo, type ReactNode } from "react";
import { fa, type MessageKey } from "./fa";

export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

function translateWith(catalog: Partial<Record<MessageKey, string>>): Translate {
    return (key, params) => {
        const template = catalog[key] ?? fa[key] ?? key;
        return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
            params && Object.hasOwn(params, name) ? String(params[name]) : placeholder,
        );
    };
}

const I18nContext = createContext<Translate>(translateWith(fa));

/** Persian is the only locale today; a new locale only needs its own catalog passed here */
export function I18nProvider({ catalog = fa, children }: { catalog?: Partial<Record<MessageKey, string>>; children: ReactNode }) {
    const t = useMemo(() => translateWith(catalog), [catalog]);
    return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
}

export function useT(): Translate {
    return useContext(I18nContext);
}
