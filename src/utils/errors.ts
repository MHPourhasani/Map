import { isProviderError } from "../types/provider";
import type { MessageKey } from "../i18n/fa";
import { fa } from "../i18n/fa";

type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

/**
 * Converts any thrown error into a concise, user-facing Persian message.
 * Provider errors are mapped through the `error.*` message catalog.
 */
export function errorMessage(error: unknown, t: Translate): string {
    if (isProviderError(error)) {
        const key = `error.${error.code}` as MessageKey;
        if (key in fa) return t(key);
        return t("error.unknown");
    }
    if (error instanceof Error && error.message.trim().length > 0 && !isProviderError(error)) {
        return t("error.unknown");
    }
    return t("error.unknown");
}
