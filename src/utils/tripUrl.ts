import type { LngLat } from "../types/geo";
import type { SelectedPlace } from "../types/search";

/**
 * Origin/destination persistence in the URL query string (no router):
 * ?origin=<lng>,<lat>&originName=<title>&destination=<lng>,<lat>&destinationName=<title>.
 * Coordinates are rounded to 6 decimals; titles round-trip via replaceState so a
 * refresh/share rebuilds the exact endpoints with no provider call.
 */

export interface TripParams {
    origin: SelectedPlace | null;
    destination: SelectedPlace | null;
}

const COORD_RE = /^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/;

function round6(value: number): number {
    return Math.round(value * 1_000_000) / 1_000_000;
}

function isValidLngLat(lng: number, lat: number): boolean {
    return Number.isFinite(lng) && Number.isFinite(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}

function parsePoint(raw: string | null, name: string | null, fallbackId: string): SelectedPlace | null {
    if (!raw) return null;
    const match = COORD_RE.exec(raw.trim());
    if (!match) return null;
    const lng = Number(match[1]);
    const lat = Number(match[2]);
    if (!isValidLngLat(lng, lat)) return null;
    const location: LngLat = { lng, lat };
    const title = name !== null && name.trim().length > 0 ? name : `${lat}, ${lng}`;
    return { id: `${fallbackId}:${lng},${lat}`, title, location };
}

/** Parses `?origin=…&destination=…` from a query string (with or without `?`). */
export function parseTripParams(search: string): TripParams {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    return {
        origin: parsePoint(params.get("origin"), params.get("originName"), "url-origin"),
        destination: parsePoint(params.get("destination"), params.get("destinationName"), "url-destination"),
    };
}

/** Serializes the trip to a query string (`''` when both endpoints are empty). */
export function serializeTripParams(origin: SelectedPlace | null, destination: SelectedPlace | null): string {
    const params = new URLSearchParams();
    if (origin) {
        params.set("origin", `${round6(origin.location.lng)},${round6(origin.location.lat)}`);
        params.set("originName", origin.title);
    }
    if (destination) {
        params.set("destination", `${round6(destination.location.lng)},${round6(destination.location.lat)}`);
        params.set("destinationName", destination.title);
    }
    const serialized = params.toString();
    return serialized.length > 0 ? `?${serialized}` : "";
}
