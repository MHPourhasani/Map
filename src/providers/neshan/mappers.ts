import type { Position } from "../../types/geo";
import type { PlaceResult, ReverseResult } from "../../types/place";
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

function isNonEmpty(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function joinParts(parts: unknown[]): string | undefined {
    const filtered = parts.filter(isNonEmpty);
    return filtered.length > 0 ? filtered.join("، ") : undefined;
}

function toMeasure(measure: NeshanMeasure | undefined): Measure {
    const value = isFiniteNumber(measure?.value) ? measure.value : 0;
    return isNonEmpty(measure?.text) ? { value, text: measure.text } : { value };
}

function safeDecode(encoded: string | undefined): Position[] {
    if (!isNonEmpty(encoded)) return [];
    try {
        return decodePolyline(encoded);
    } catch {
        return [];
    }
}

export function mapSearchItem(item: NeshanSearchItem, index: number): PlaceResult | null {
    const title = typeof item.title === "string" ? item.title.trim() : "";
    const lng = item.location?.x;
    const lat = item.location?.y;
    if (title.length === 0 || !isFiniteNumber(lng) || !isFiniteNumber(lat)) return null;

    const id = isNonEmpty(item.poiHash) ? item.poiHash : `${title}|${lng}|${lat}|${index}`;
    const place: PlaceResult = { id, title, location: { lng, lat } };

    if (isNonEmpty(item.address)) place.address = item.address.trim();
    const locality = joinParts([item.region, item.neighbourhood]);
    if (locality !== undefined) place.locality = locality;
    if (isNonEmpty(item.category)) place.category = item.category;
    return place;
}

function mapStep(step: NeshanStep): RouteStep {
    const result: RouteStep = {
        distance: toMeasure(step.distance),
        duration: toMeasure(step.duration),
        pointCount: safeDecode(step.polyline).length,
    };
    if (isNonEmpty(step.instruction)) result.instruction = step.instruction;
    if (isNonEmpty(step.name)) result.name = step.name;
    if (isNonEmpty(step.type)) result.type = step.type;
    if (isNonEmpty(step.modifier)) result.modifier = step.modifier;
    if (isNonEmpty(step.rotaryName)) result.rotaryName = step.rotaryName;
    if (isFiniteNumber(step.bearing_after)) result.bearingAfter = step.bearing_after;
    if (isFiniteNumber(step.exit)) result.exit = step.exit;
    if (isNonEmpty(step.polyline)) result.polyline = step.polyline;

    const start = step.start_location;
    if (Array.isArray(start) && isFiniteNumber(start[0]) && isFiniteNumber(start[1])) {
        result.start = { lng: start[0], lat: start[1] };
    }
    return result;
}

function mapLeg(leg: NeshanLeg): RouteLeg {
    const result: RouteLeg = {
        distance: toMeasure(leg.distance),
        duration: toMeasure(leg.duration),
        steps: (leg.steps ?? []).map(mapStep),
    };
    if (typeof leg.summary === "string") result.summary = leg.summary;
    return result;
}

function decodeOverview(points: string | undefined): Position[] {
    const geometry = safeDecode(points);
    return geometry.length > 1 ? geometry : [];
}

/** Fallback geometry: the step polylines joined end to end */
function geometryFromSteps(raw: NeshanRoute): Position[] {
    const geometry: Position[] = [];
    for (const step of (raw.legs ?? []).flatMap((leg) => leg.steps ?? [])) {
        const part = safeDecode(step.polyline);
        if (part.length === 0) continue;
        const last = geometry[geometry.length - 1];
        const continuesLast = last !== undefined && last[0] === part[0][0] && last[1] === part[0][1];
        geometry.push(...(continuesLast ? part.slice(1) : part));
    }
    return geometry;
}

function sumMeasure(legs: RouteLeg[], which: "distance" | "duration"): Measure {
    return { value: legs.reduce((total, leg) => total + (leg[which].value || 0), 0) };
}

/** Uses the provider's route-level value, else the single leg's, else the sum of the legs */
function routeMeasure(raw: NeshanMeasure | undefined, legs: RouteLeg[], which: "distance" | "duration"): Measure {
    if (isFiniteNumber(raw?.value)) return toMeasure(raw);
    return legs.length === 1 ? legs[0][which] : sumMeasure(legs, which);
}

function mapRoute(raw: NeshanRoute, index: number): Route | null {
    const legs = (raw.legs ?? []).map(mapLeg);
    const overview = decodeOverview(raw.overview_polyline?.points);
    const geometry = overview.length >= 2 ? overview : geometryFromSteps(raw);
    if (geometry.length < 2) return null;

    const route: Route = {
        id: `route-${index}`,
        geometry,
        distance: routeMeasure(raw.distance, legs, "distance"),
        duration: routeMeasure(raw.duration, legs, "duration"),
        legs,
    };
    if (isNonEmpty(raw.overview_polyline?.points)) route.overviewPolyline = raw.overview_polyline.points;
    if (isNonEmpty(raw.summary)) route.summary = raw.summary;
    return route;
}

export function mapDirectionResponse(data: NeshanDirectionResponse): RouteResult {
    return { routes: (data.routes ?? []).map(mapRoute).filter((route) => route !== null) };
}

export function mapReverseResponse(data: NeshanReverseResponse): ReverseResult {
    const formattedAddress = isNonEmpty(data.formatted_address)
        ? data.formatted_address.trim()
        : (joinParts([data.route_name, data.neighbourhood, data.city]) ?? "");

    const result: ReverseResult = { formattedAddress };
    if (isNonEmpty(data.city)) result.city = data.city;
    if (isNonEmpty(data.state)) result.state = data.state;
    if (isNonEmpty(data.neighbourhood)) result.neighbourhood = data.neighbourhood;
    return result;
}
