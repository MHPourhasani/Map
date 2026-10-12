import type { Position } from "../types/geo";

/** Decodes an "Encoded Polyline Algorithm Format" string (precision 5 — Neshan's format) into `[lng, lat]`. */
export function decodePolyline(encoded: string, precision = 5): Position[] {
    const factor = 10 ** precision;
    const coordinates: Position[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        let result = 0;
        let shift = 0;
        let byte: number;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        lat += result & 1 ? ~(result >> 1) : result >> 1;

        result = 0;
        shift = 0;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        lng += result & 1 ? ~(result >> 1) : result >> 1;

        coordinates.push([lng / factor, lat / factor]);
    }

    return coordinates;
}
