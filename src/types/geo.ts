/**
 * Core geographic primitives shared across the whole application.
 * These types are provider-agnostic: any mapping backend can be adapted to them.
 */

/** A geographic point. Order follows GeoJSON convention: lng first, lat second. */
export type Position = [lng: number, lat: number];

/** A named geographic point (used for selected places / user location). */
export interface LngLat {
    lng: number;
    lat: number;
}

/** Axis-aligned geographic bounding box. */
export interface Bounds {
    sw: LngLat;
    ne: LngLat;
}

export const IRAN_CENTER: LngLat = { lng: 51.389, lat: 35.6892 };

/** Initial camera state — a whole-country view of Iran. */
export const INITIAL_VIEW = {
    center: IRAN_CENTER,
    zoom: 5,
};

/** Fallback bias point for searches before the map reports its center. */
export const DEFAULT_SEARCH_CENTER: LngLat = IRAN_CENTER;

export function toPosition(point: LngLat): Position {
    return [point.lng, point.lat];
}

export function boundsFromPositions(points: readonly Position[]): Bounds | null {
    if (points.length === 0) return null;
    let minLng = Number.POSITIVE_INFINITY;
    let minLat = Number.POSITIVE_INFINITY;
    let maxLng = Number.NEGATIVE_INFINITY;
    let maxLat = Number.NEGATIVE_INFINITY;
    for (const [lng, lat] of points) {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
    }
    return { sw: { lng: minLng, lat: minLat }, ne: { lng: maxLng, lat: maxLat } };
}
