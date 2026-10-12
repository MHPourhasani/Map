import type { LngLat } from "./geo";
import type { PlaceResult, ReverseResult, SearchRequest } from "./search";
import type { RouteRequest, RouteResult } from "./route";

/** Machine-readable error categories surfaced by the provider layer. */
export type ProviderErrorCode =
    | "missing_api_key"
    | "invalid_api_key"
    | "quota_exceeded"
    | "rate_limited"
    | "forbidden"
    | "invalid_argument"
    | "no_route"
    | "not_found"
    | "network"
    | "timeout"
    | "unknown";

/** Normalized error thrown by every provider adapter. */
export class ProviderError extends Error {
    readonly code: ProviderErrorCode;
    /** HTTP status returned by the API, when available. */
    readonly status?: number;
    /** Raw provider status string (e.g. "LimitExceeded"), when available. */
    readonly providerStatus?: string;

    constructor(code: ProviderErrorCode, message: string, options?: { status?: number; providerStatus?: string; cause?: unknown }) {
        super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
        this.name = "ProviderError";
        this.code = code;
        if (options?.status !== undefined) this.status = options.status;
        if (options?.providerStatus !== undefined) this.providerStatus = options.providerStatus;
    }
}

export function isProviderError(error: unknown): error is ProviderError {
    return error instanceof ProviderError;
}

/** Provider-agnostic place search / autocomplete. */
export interface SearchProvider {
    search(request: SearchRequest, signal?: AbortSignal): Promise<PlaceResult[]>;
}

/** Provider-agnostic road routing. */
export interface RoutingProvider {
    getRoutes(request: RouteRequest, signal?: AbortSignal): Promise<RouteResult>;
}

/** Provider-agnostic reverse geocoding (coordinate → address). */
export interface ReverseGeocodingProvider {
    reverseGeocode(location: LngLat, signal?: AbortSignal): Promise<ReverseResult>;
}

/** The set of pluggable services consumed by the UI. */
export interface MapServices {
    search: SearchProvider;
    routing: RoutingProvider;
    reverse: ReverseGeocodingProvider;
}
