import { ProviderError } from "../../types/provider";
import type { NeshanErrorBody } from "./types";

export const NESHAN_API_BASE = "https://api.neshan.org";

export type QueryValue = string | number | boolean | undefined;

function parseErrorBody(body: unknown): NeshanErrorBody | null {
    if (body !== null && typeof body === "object") return body as NeshanErrorBody;
    return null;
}

function providerStatusOf(body: NeshanErrorBody | null): string | undefined {
    if (body?.status !== undefined && body.status !== null) {
        return String(body.status);
    }
    if (body?.code !== undefined && body.code !== null) {
        return String(body.code);
    }
    return undefined;
}

function messageOf(body: NeshanErrorBody | null): string | undefined {
    if (typeof body?.message === "string" && body.message.length > 0) {
        return body.message;
    }
    if (typeof body?.error === "string" && body.error.length > 0) {
        return body.error;
    }
    return undefined;
}

/** Maps Neshan HTTP status / status strings to a typed `ProviderError` code. */
export function toProviderError(status: number, body: NeshanErrorBody | null): ProviderError {
    const providerStatus = providerStatusOf(body);
    const message = messageOf(body) ?? `Neshan API error (HTTP ${status})`;

    if (providerStatus?.includes("NoRoute")) {
        return new ProviderError("no_route", message, { status, providerStatus });
    }

    switch (status) {
        case 400:
        case 470:
            return new ProviderError("invalid_argument", message, {
                status,
                providerStatus,
            });
        case 401:
        case 480:
        case 483:
            return new ProviderError("invalid_api_key", message, {
                status,
                providerStatus,
            });
        case 403:
        case 484:
        case 485:
            return new ProviderError("forbidden", message, {
                status,
                providerStatus,
            });
        case 481:
            return new ProviderError("quota_exceeded", message, {
                status,
                providerStatus,
            });
        case 482:
            return new ProviderError("rate_limited", message, {
                status,
                providerStatus,
            });
        case 404:
            return new ProviderError("not_found", message, { status, providerStatus });
        case 408:
        case 429:
        case 503:
        case 504:
            return new ProviderError("timeout", message, { status, providerStatus });
        default:
            return new ProviderError("unknown", message, { status, providerStatus });
    }
}

/**
 * GET against a Neshan endpoint with the `Api-Key` header; normalizes errors and
 * cancels via AbortSignal. CORS is verified (allows the api-key header), so no
 * proxy is needed.
 */
export async function neshanFetch<T>(
    path: string,
    params: Record<string, QueryValue>,
    apiKey: string | undefined,
    signal?: AbortSignal,
): Promise<T> {
    if (!apiKey) {
        throw new ProviderError("missing_api_key", "Neshan API key is not configured");
    }

    const url = new URL(NESHAN_API_BASE + path);
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
    }

    let response: Response;
    try {
        response = await fetch(url, {
            method: "GET",
            headers: {
                "Api-Key": apiKey,
                Accept: "application/json",
            },
            signal,
        });
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        throw new ProviderError("network", "Network request failed", { cause: error });
    }

    let body: unknown;
    try {
        body = await response.json();
    } catch {
        body = null;
    }

    if (!response.ok) {
        throw toProviderError(response.status, parseErrorBody(body));
    }

    return body as T;
}
