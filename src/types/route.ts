import type { LngLat, Position } from "./geo";

/**
 * Travel profiles. Driving (car) is fully wired to the provider; the union is
 * intentionally open so walking/cycling profiles can be added once the chosen
 * provider's corresponding endpoints are integrated.
 */
export type TravelMode = "driving" | "motorcycle";

export const DEFAULT_TRAVEL_MODE: TravelMode = "driving";

/** A provider-reported measurement. `text` is the provider's own localized label. */
export interface Measure {
    /** Meters for distance, seconds for duration. */
    value: number;
    /** Provider-formatted Persian label (e.g. "۴۶ متر"), when supplied. */
    text?: string;
}

/** A single maneuver inside a leg. */
export interface RouteStep {
    /** Provider instruction text (Persian), when supplied. */
    instruction?: string;
    /** Street name the step starts on. */
    name?: string;
    /** Maneuver type (depart, turn, new name, rotary, arrive, ...). */
    type?: string;
    /** Maneuver direction (left, right, straight, slight right, ...). */
    modifier?: string;
    /** Compass bearing (degrees) right after the maneuver. */
    bearingAfter?: number;
    /** Roundabout name and chosen exit number (rotary steps only). */
    rotaryName?: string;
    exit?: number;
    start?: LngLat;
    /** Encoded step polyline exactly as returned by the provider. */
    polyline?: string;
    /** Number of points the step polyline decodes to. */
    pointCount: number;
    distance: Measure;
    duration: Measure;
}

/** A leg of the route (between origin, waypoints and destination). */
export interface RouteLeg {
    summary?: string;
    distance: Measure;
    duration: Measure;
    steps: RouteStep[];
}

/** One candidate route returned by the routing provider. */
export interface Route {
    /** Stable id derived from the response (index + geometry hash). */
    id: string;
    /** Road-network geometry decoded from the provider polyline. */
    geometry: Position[];
    /** Encoded overview polyline exactly as returned by the provider. */
    overviewPolyline?: string;
    /** Route-level provider summary, when supplied. */
    summary?: string;
    /** Total distance in meters (route-level value, or the sum of provider legs). */
    distance: Measure;
    /** Total duration in seconds (route-level value, or the sum of provider legs). */
    duration: Measure;
    legs: RouteLeg[];
}

/** Normalized routing response. */
export interface RouteResult {
    routes: Route[];
}

/** Input of the routing provider. */
export interface RouteRequest {
    origin: LngLat;
    destination: LngLat;
    mode: TravelMode;
    /** Ask the provider for alternative routes when it supports them. */
    alternatives: boolean;
}
