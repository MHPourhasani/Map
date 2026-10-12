import type { GeoJSONSource } from "maplibre-gl";
import type { Position } from "../types/geo";
import type { Route } from "../types/route";
import { prefersReducedMotion } from "../utils/motion";
import type { MapInstance } from "./MapContext";

export const ROUTE_SOURCES = {
    selected: "pm-route-selected",
    alternatives: "pm-route-alternatives",
} as const;

/** Bottom-to-top rendering order */
export const ROUTE_LAYERS = {
    alternatives: "pm-route-alternatives-line",
    casing: "pm-route-selected-casing",
    line: "pm-route-selected-line",
} as const;

interface LineFeature {
    type: "Feature";
    properties: { routeIndex: number };
    geometry: { type: "LineString"; coordinates: Position[] };
}

interface LineFeatureCollection {
    type: "FeatureCollection";
    features: LineFeature[];
}

const EMPTY_COLLECTION: LineFeatureCollection = { type: "FeatureCollection", features: [] };

function toCollection(routes: Route[], routeIndexes: number[]): LineFeatureCollection {
    return {
        type: "FeatureCollection",
        features: routeIndexes.map((routeIndex) => ({
            type: "Feature",
            properties: { routeIndex },
            geometry: { type: "LineString", coordinates: routes[routeIndex].geometry },
        })),
    };
}

/** Puts the selected route in the gradient layer and every other route in the dashed one */
export function setRouteData(map: MapInstance, routes: Route[], activeIndex: number): void {
    const alternativeIndexes = routes.map((_, index) => index).filter((index) => index !== activeIndex);
    const selected = routes[activeIndex] ? toCollection(routes, [activeIndex]) : EMPTY_COLLECTION;

    map.getSource<GeoJSONSource>(ROUTE_SOURCES.selected)?.setData(selected);
    map.getSource<GeoJSONSource>(ROUTE_SOURCES.alternatives)?.setData(toCollection(routes, alternativeIndexes));
}

type ColorStops = ReadonlyArray<readonly [number, string]>;
type PaintValue = Parameters<MapInstance["setPaintProperty"]>[2];

const ROUTE_LINE_STOPS: ColorStops = [
    [0, "#2563eb"],
    [0.5, "#4f46e5"],
    [1, "#7c3aed"],
];

const ROUTE_CASING_STOPS: ColorStops = [
    [0, "rgba(15, 23, 42, 0.28)"],
    [1, "rgba(15, 23, 42, 0.28)"],
];

const TRANSPARENT = "rgba(0, 0, 0, 0)";

/**
 * A `line-gradient` that shows the route from its start up to `progress` (0-1) and hides the rest.
 * Changing a paint property doesn't re-tile the source, so it is cheap to update every frame.
 */
function revealExpression(progress: number, stops: ColorStops): PaintValue {
    const revealed = Math.min(Math.max(progress, 0), 1);
    const expression: Array<string | number | string[]> = ["interpolate", ["linear"], ["line-progress"]];

    if (revealed >= 1) {
        for (const [stop, color] of stops) expression.push(stop, color);
    } else {
        const edge = Math.max(revealed, 0.001);
        for (const [stop, color] of stops) expression.push(stop * edge, color);
        const fadeEnd = Math.min(edge + 0.001, 1);
        expression.push(fadeEnd, TRANSPARENT);
        if (fadeEnd < 1) expression.push(1, TRANSPARENT);
    }
    return expression as unknown as PaintValue;
}

function setRouteProgress(map: MapInstance, progress: number): void {
    if (!map.getLayer(ROUTE_LAYERS.line) || !map.getLayer(ROUTE_LAYERS.casing)) return;
    map.setPaintProperty(ROUTE_LAYERS.line, "line-gradient", revealExpression(progress, ROUTE_LINE_STOPS));
    map.setPaintProperty(ROUTE_LAYERS.casing, "line-gradient", revealExpression(progress, ROUTE_CASING_STOPS));
}

/** Draws the selected route on progressively; returns a function that stops the animation */
export function animateRouteReveal(map: MapInstance, durationMs: number): () => void {
    if (prefersReducedMotion()) {
        setRouteProgress(map, 1);
        return () => {};
    }

    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / durationMs, 1);
        setRouteProgress(map, progress);
        if (progress < 1) frame = requestAnimationFrame(tick);
    };
    setRouteProgress(map, 0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
}

function ensureSource(map: MapInstance, id: string, lineMetrics = false): void {
    if (map.getSource(id)) return;
    map.addSource(id, { type: "geojson", data: EMPTY_COLLECTION, ...(lineMetrics ? { lineMetrics } : {}) });
}

function ensureLayer(map: MapInstance, layer: Parameters<MapInstance["addLayer"]>[0]): void {
    if (!map.getLayer(layer.id)) map.addLayer(layer);
}

const ROUND_LINE_LAYOUT = { "line-cap": "round", "line-join": "round" } as const;

/**
 * Creates the route sources and layers if they are missing. A basemap swap drops them,
 * so this runs again after every style load. Returns whether the route line exists.
 */
export function ensureRouteLayers(map: MapInstance): boolean {
    if (!map.isStyleLoaded()) return false;

    ensureSource(map, ROUTE_SOURCES.alternatives);
    ensureLayer(map, {
        id: ROUTE_LAYERS.alternatives,
        type: "line",
        source: ROUTE_SOURCES.alternatives,
        layout: { ...ROUND_LINE_LAYOUT },
        paint: { "line-color": "#94a3b8", "line-width": 5, "line-opacity": 0.85, "line-dasharray": [1.5, 1.5] },
    });

    // `lineMetrics` is required for the `line-gradient` reveal animation
    ensureSource(map, ROUTE_SOURCES.selected, true);
    ensureLayer(map, {
        id: ROUTE_LAYERS.casing,
        type: "line",
        source: ROUTE_SOURCES.selected,
        layout: { ...ROUND_LINE_LAYOUT },
        paint: { "line-width": 12, "line-gradient": revealExpression(1, ROUTE_CASING_STOPS) },
    });
    ensureLayer(map, {
        id: ROUTE_LAYERS.line,
        type: "line",
        source: ROUTE_SOURCES.selected,
        layout: { ...ROUND_LINE_LAYOUT },
        paint: { "line-width": 7, "line-opacity": 0.95, "line-gradient": revealExpression(1, ROUTE_LINE_STOPS) },
    });

    return map.getLayer(ROUTE_LAYERS.line) !== undefined;
}
