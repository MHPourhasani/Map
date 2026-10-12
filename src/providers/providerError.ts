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

interface ProviderErrorOptions {
    status?: number;
    providerStatus?: string;
    cause?: unknown;
}

export class ProviderError extends Error {
    readonly code: ProviderErrorCode;
    readonly status?: number;
    readonly providerStatus?: string;

    constructor(code: ProviderErrorCode, message: string, { status, providerStatus, cause }: ProviderErrorOptions = {}) {
        super(message, cause !== undefined ? { cause } : undefined);
        this.name = "ProviderError";
        this.code = code;
        if (status !== undefined) this.status = status;
        if (providerStatus !== undefined) this.providerStatus = providerStatus;
    }
}

export function isProviderError(error: unknown): error is ProviderError {
    return error instanceof ProviderError;
}
