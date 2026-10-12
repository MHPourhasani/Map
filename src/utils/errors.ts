import { fa, type MessageKey } from "../i18n/fa";
import { isProviderError } from "../providers/providerError";

type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

export function errorMessage(error: unknown, t: Translate): string {
    const key = isProviderError(error) ? `error.${error.code}` : "error.unknown";
    return t(key in fa ? (key as MessageKey) : "error.unknown");
}
