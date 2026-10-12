import { env } from "../../config/env";
import { ProviderError, type ProviderErrorCode } from "../providerError";
import type { NeshanErrorBody } from "./types";

export type QueryValue = string | number | boolean | undefined;

const ERROR_CODE_BY_HTTP_STATUS: Record<number, ProviderErrorCode> = {
    400: "invalid_argument",
    470: "invalid_argument",
    401: "invalid_api_key",
    480: "invalid_api_key",
    483: "invalid_api_key",
    403: "forbidden",
    484: "forbidden",
    485: "forbidden",
    481: "quota_exceeded",
    482: "rate_limited",
    404: "not_found",
    408: "timeout",
    429: "timeout",
    503: "timeout",
    504: "timeout",
};

function readErrorBody(body: unknown): NeshanErrorBody {
    return body !== null && typeof body === "object" ? (body as NeshanErrorBody) : {};
}

function nonEmptyString(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toProviderError(status: number, body: NeshanErrorBody): ProviderError {
    const rawProviderStatus = body.status ?? body.code;
    const providerStatus = rawProviderStatus !== undefined && rawProviderStatus !== null ? String(rawProviderStatus) : undefined;
    const message = nonEmptyString(body.message) ?? nonEmptyString(body.error) ?? `Neshan API error (HTTP ${status})`;
    const code = providerStatus?.includes("NoRoute") ? "no_route" : (ERROR_CODE_BY_HTTP_STATUS[status] ?? "unknown");
    return new ProviderError(code, message, { status, providerStatus });
}

export async function neshanFetch<T>(path: string, params: Record<string, QueryValue>, apiKey: string, signal?: AbortSignal): Promise<T> {
    // A relative base (e.g. "/neshan" behind a same-origin proxy) is resolved against the page origin
    const url = new URL(env.neshanApiBase + path, window.location.origin);
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
    }

    let response: Response;
    try {
        response = await fetch(url, { headers: { "Api-Key": apiKey, Accept: "application/json" }, signal });
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        throw new ProviderError("network", "Network request failed", { cause: error });
    }

    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) throw toProviderError(response.status, readErrorBody(body));
    return body as T;
}
