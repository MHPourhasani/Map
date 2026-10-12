import type { LngLat, Position } from "../types/geo";

export function circlePolygon(center: LngLat, radiusMeters: number, segments = 64): Position[] {
    const earthRadius = 6_378_137;
    const latRad = (center.lat * Math.PI) / 180;
    const dLat = (radiusMeters / earthRadius) * (180 / Math.PI);
    const dLng = dLat / Math.max(Math.cos(latRad), 1e-6);

    const ring: Position[] = [];
    for (let i = 0; i <= segments; i += 1) {
        const angle = (i / segments) * Math.PI * 2;
        const lng = center.lng + dLng * Math.cos(angle);
        const lat = center.lat + dLat * Math.sin(angle);
        ring.push([lng, lat]);
    }
    return ring;
}
