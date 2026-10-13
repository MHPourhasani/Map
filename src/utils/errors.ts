import i18n from "i18next";
import { isProviderError } from "../providers/providerError";
import type { MessageKey } from "../i18n/fa";

type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

export function errorMessage(error: unknown, t: Translate): string {
    const key = isProviderError(error) ? `error.${error.code}` : "error.unknown";
    return i18n.exists(key) ? t(key as MessageKey) : t("error.unknown");
}
