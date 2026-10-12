import type { LngLat } from "../types/geo";

/** A successful browser geolocation fix. */
export interface PositionFix {
    location: LngLat;
    /** Accuracy radius in meters, as reported by the device. */
    accuracy: number;
    timestamp: number;
}

export type GeolocationErrorCode = "unsupported" | "insecure" | "permission_denied" | "unavailable" | "timeout" | "unknown";

export class GeolocationError extends Error {
    readonly code: GeolocationErrorCode;
    constructor(code: GeolocationErrorCode, message: string) {
        super(message);
        this.name = "GeolocationError";
        this.code = code;
    }
}

export function isGeolocationError(error: unknown): error is GeolocationError {
    return error instanceof GeolocationError;
}

export function toGeolocationErrorCode(error: unknown): GeolocationErrorCode {
    return isGeolocationError(error) ? error.code : "unknown";
}

interface GetCurrentPositionOptions {
    timeoutMs?: number;
    maximumAgeMs?: number;
}

/**
 * Promise wrapper around the browser Geolocation API with typed errors; never
 * resolves before a genuine fix. Browsers only allow this on HTTPS/localhost.
 */
export function getCurrentPosition(options: GetCurrentPositionOptions = {}): Promise<PositionFix> {
    return new Promise((resolve, reject) => {
        if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
            reject(new GeolocationError("unsupported", "Geolocation is not supported"));
            return;
        }
        if (typeof window !== "undefined" && window.isSecureContext === false) {
            reject(new GeolocationError("insecure", "Geolocation requires HTTPS or localhost"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    location: {
                        lng: position.coords.longitude,
                        lat: position.coords.latitude,
                    },
                    accuracy: typeof position.coords.accuracy === "number" ? position.coords.accuracy : 0,
                    timestamp: position.timestamp,
                });
            },
            (error) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        reject(new GeolocationError("permission_denied", "Permission denied"));
                        break;
                    case error.POSITION_UNAVAILABLE:
                        reject(new GeolocationError("unavailable", "Position unavailable"));
                        break;
                    case error.TIMEOUT:
                        reject(new GeolocationError("timeout", "Timed out"));
                        break;
                    default:
                        reject(new GeolocationError("unknown", "Unknown error"));
                }
            },
            {
                enableHighAccuracy: true,
                timeout: options.timeoutMs ?? 10_000,
                maximumAge: options.maximumAgeMs ?? 0,
            },
        );
    });
}
