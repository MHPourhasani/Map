import type { LngLat, Position } from "../../types/geo";
import type { PlaceResult, ReverseResult } from "../../types/search";
import type { Measure, Route, RouteLeg, RouteResult, RouteStep } from "../../types/route";
import { decodePolyline } from "../../services/polyline";
import type {
    NeshanDirectionResponse,
    NeshanLeg,
    NeshanMeasure,
    NeshanReverseResponse,
    NeshanRoute,
    NeshanSearchItem,
    NeshanStep,
} from "./types";

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function toMeasure(measure: NeshanMeasure | undefined): Measure {
    const value = isFiniteNumber(measure?.value) ? measure.value : 0;
    const text = typeof measure?.text === "string" && measure.text.trim().length > 0 ? measure.text : undefined;
    return text !== undefined ? { value, text } : { value };
}

function joinParts(parts: Array<string | undefined | null>): string | undefined {
    const filtered = parts.filter((part): part is string => typeof part === "string" && part.trim().length > 0);
    return filtered.length > 0 ? filtered.join("، ") : undefined;
}

/** Maps one Neshan search item to the provider-agnostic `PlaceResult`. */
export function mapSearchItem(item: NeshanSearchItem, index: number): PlaceResult | null {
    const title = typeof item.title === "string" ? item.title.trim() : "";
    const lng = item.location?.x;
    const lat = item.location?.y;
    if (title.length === 0 || !isFiniteNumber(lng) || !isFiniteNumber(lat)) {
        return null;
    }

    const id = typeof item.poiHash === "string" && item.poiHash.length > 0 ? item.poiHash : `${title}|${lng}|${lat}|${index}`;

    const result: PlaceResult = { id, title, location: { lng, lat } };
    if (typeof item.address === "string" && item.address.trim().length > 0) {
        result.address = item.address.trim();
    }
    const locality = joinParts([item.region, item.neighbourhood]);
    if (locality !== undefined) result.locality = locality;
    if (typeof item.category === "string" && item.category.length > 0) {
        result.category = item.category;
    }
    return result;
}

function nonEmpty(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function mapStep(step: NeshanStep): RouteStep {
    const result: RouteStep = {
        distance: toMeasure(step.distance),
        duration: toMeasure(step.duration),
        pointCount: stepGeometry(step).length,
    };
    if (nonEmpty(step.instruction)) result.instruction = step.instruction;
    if (nonEmpty(step.name)) result.name = step.name;
    if (nonEmpty(step.type)) result.type = step.type;
    if (nonEmpty(step.modifier)) result.modifier = step.modifier;
    if (nonEmpty(step.rotaryName)) result.rotaryName = step.rotaryName;
    if (isFiniteNumber(step.bearing_after)) result.bearingAfter = step.bearing_after;
    if (isFiniteNumber(step.exit)) result.exit = step.exit;
    if (nonEmpty(step.polyline)) result.polyline = step.polyline;
    const start = step.start_location;
    if (Array.isArray(start) && isFiniteNumber(start[0]) && isFiniteNumber(start[1])) {
        const location: LngLat = { lng: start[0], lat: start[1] };
        result.start = location;
    }
    return result;
}

function mapLeg(leg: NeshanLeg): RouteLeg {
    const distance = toMeasure(leg.distance);
    const duration = toMeasure(leg.duration);
    const result: RouteLeg = {
        distance,
        duration,
        steps: (leg.steps ?? []).map(mapStep),
    };
    if (typeof leg.summary === "string") result.summary = leg.summary;
    return result;
}

function stepGeometry(step: NeshanStep): Position[] {
    if (typeof step.polyline !== "string" || step.polyline.length === 0) return [];
    try {
        return decodePolyline(step.polyline);
    } catch {
        return [];
    }
}

function decodeOverview(points: string | undefined): Position[] {
    if (typeof points !== "string" || points.length === 0) return [];
    try {
        const geometry = decodePolyline(points);
        return geometry.length > 1 ? geometry : [];
    } catch {
        return [];
    }
}

/** Concatenates per-step geometries when `overview_polyline` is missing. */
function geometryFromSteps(raw: NeshanRoute): Position[] {
    const geometry: Position[] = [];
    for (const step of (raw.legs ?? []).flatMap((leg) => leg.steps ?? [])) {
        const part = stepGeometry(step);
        if (part.length === 0) continue;
        const last = geometry[geometry.length - 1];
        if (last && last[0] === part[0][0] && last[1] === part[0][1]) {
            geometry.push(...part.slice(1));
        } else {
            geometry.push(...part);
        }
    }
    return geometry;
}

function sumMeasure(legs: RouteLeg[], which: "distance" | "duration"): number {
    return legs.reduce((total, leg) => total + (leg[which].value || 0), 0);
}

function mapRoute(raw: NeshanRoute, index: number): Route | null {
    const legs = (raw.legs ?? []).map(mapLeg);
    const geometry = decodeOverview(raw.overview_polyline?.points);
    const finalGeometry = geometry.length >= 2 ? geometry : geometryFromSteps(raw);
    if (finalGeometry.length < 2) return null;

    const distance: Measure = isFiniteNumber(raw.distance?.value)
        ? toMeasure(raw.distance)
        : legs.length === 1
          ? legs[0].distance
          : { value: sumMeasure(legs, "distance") };
    const duration: Measure = isFiniteNumber(raw.duration?.value)
        ? toMeasure(raw.duration)
        : legs.length === 1
          ? legs[0].duration
          : { value: sumMeasure(legs, "duration") };

    const route: Route = {
        id: `route-${index}`,
        geometry: finalGeometry,
        distance,
        duration,
        legs,
    };
    if (nonEmpty(raw.overview_polyline?.points)) {
        route.overviewPolyline = raw.overview_polyline.points;
    }
    if (nonEmpty(raw.summary)) route.summary = raw.summary;
    return route;
}

/** Normalizes a Neshan directions response into `RouteResult`. */
export function mapDirectionResponse(data: NeshanDirectionResponse): RouteResult {
    const routes = (data.routes ?? []).map(mapRoute).filter((route): route is Route => route !== null);
    return { routes };
}

/** Normalizes a Neshan reverse-geocoding response. */
export function mapReverseResponse(data: NeshanReverseResponse): ReverseResult {
    const fallback = joinParts([data.route_name, data.neighbourhood, data.city]);
    const formattedAddress =
        typeof data.formatted_address === "string" && data.formatted_address.trim().length > 0
            ? data.formatted_address.trim()
            : (fallback ?? "");
    const result: ReverseResult = { formattedAddress };
    if (typeof data.city === "string" && data.city.length > 0) result.city = data.city;
    if (typeof data.state === "string" && data.state.length > 0) result.state = data.state;
    if (typeof data.neighbourhood === "string" && data.neighbourhood.length > 0) {
        result.neighbourhood = data.neighbourhood;
    }
    return result;
}
