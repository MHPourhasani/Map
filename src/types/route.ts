import type { LngLat, Position } from "./geo";

export type TravelMode = "driving" | "motorcycle";

export const DEFAULT_TRAVEL_MODE: TravelMode = "driving";

export interface Measure {
    /** Meters for distance, seconds for duration */
    value: number;
    /** Provider's own localized label */
    text?: string;
}

export interface RouteStep {
    instruction?: string;
    name?: string;
    type?: string;
    modifier?: string;
    bearingAfter?: number;
    rotaryName?: string;
    exit?: number;
    start?: LngLat;
    polyline?: string;
    pointCount: number;
    distance: Measure;
    duration: Measure;
}

export interface RouteLeg {
    summary?: string;
    distance: Measure;
    duration: Measure;
    steps: RouteStep[];
}

export interface Route {
    id: string;
    geometry: Position[];
    overviewPolyline?: string;
    summary?: string;
    distance: Measure;
    duration: Measure;
    legs: RouteLeg[];
}

export interface RouteResult {
    routes: Route[];
}

export interface RouteRequest {
    origin: LngLat;
    destination: LngLat;
    mode: TravelMode;
    alternatives: boolean;
}
