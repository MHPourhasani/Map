export type Position = [lng: number, lat: number];

export interface LngLat {
    lng: number;
    lat: number;
}

export interface Bounds {
    sw: LngLat;
    ne: LngLat;
}

export const IRAN_CENTER: LngLat = { lng: 51.389, lat: 35.6892 };

export const INITIAL_VIEW = { center: IRAN_CENTER, zoom: 5 };

export const DEFAULT_SEARCH_CENTER: LngLat = IRAN_CENTER;

export function toPosition(point: LngLat): Position {
    return [point.lng, point.lat];
}

export function boundsFromPositions(points: readonly Position[]): Bounds | null {
    if (points.length === 0) return null;
    const sw = { lng: Infinity, lat: Infinity };
    const ne = { lng: -Infinity, lat: -Infinity };
    for (const [lng, lat] of points) {
        sw.lng = Math.min(sw.lng, lng);
        sw.lat = Math.min(sw.lat, lat);
        ne.lng = Math.max(ne.lng, lng);
        ne.lat = Math.max(ne.lat, lat);
    }
    return { sw, ne };
}
