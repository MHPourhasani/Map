import type { Position } from "../types/geo";
import type { Route } from "../types/route";
import type { MapInstance } from "./MapContext";

/** Source ids managed by the route layer. */
export const ROUTE_SOURCES = {
    selected: "pm-route-selected",
    alternatives: "pm-route-alternatives",
} as const;

/** Layer ids managed by the route layer (bottom → top rendering order). */
export const ROUTE_LAYERS = {
    alternatives: "pm-route-alternatives-line",
    casing: "pm-route-selected-casing",
    line: "pm-route-selected-line",
} as const;

type LineFeature = {
    type: "Feature";
    properties: { routeIndex?: number };
    geometry: { type: "LineString"; coordinates: Position[] };
};

type LineFeatureCollection = {
    type: "FeatureCollection";
    features: LineFeature[];
};

const EMPTY: LineFeatureCollection = { type: "FeatureCollection", features: [] };

/** Runs `run` once the style accepts mutations (MapLibre's `isStyleLoaded()` can stay false for seconds on a busy source), polling + event-retrying until it does; returns an idempotent cancel for effect cleanup. */
export function whenStyleReady(map: MapInstance, run: () => void): () => void {
    if (map.isStyleLoaded()) {
        run();
        return () => {};
    }

    let done = false;
    const tryRun = () => {
        if (done || !map.isStyleLoaded()) return;
        done = true;
        stop();
        run();
    };
    const stop = () => {
        window.clearInterval(interval);
        map.off("styledata", tryRun);
        map.off("idle", tryRun);
    };
    const interval = window.setInterval(tryRun, 200);
    map.on("styledata", tryRun);
    map.on("idle", tryRun);

    return () => {
        if (done) return;
        done = true;
        stop();
    };
}

/* ------------------------------------------------------------------ *
 * Draw-on animation (paint-only — never re-cuts the GeoJSON tiles)
 * ------------------------------------------------------------------ */

type PaintPropertyValue = Parameters<MapInstance["setPaintProperty"]>[2];

/** Final appearance of the route line (blue → indigo → violet). */
const ROUTE_LINE_STOPS: ReadonlyArray<readonly [number, string]> = [
    [0, "#2563eb"],
    [0.5, "#4f46e5"],
    [1, "#7c3aed"],
];

/** Constant color of the dark casing underneath the line. */
const ROUTE_CASING_STOPS: ReadonlyArray<readonly [number, string]> = [
    [0, "rgba(15, 23, 42, 0.28)"],
    [1, "rgba(15, 23, 42, 0.28)"],
];

const TRANSPARENT = "rgba(0, 0, 0, 0)";

/**
 * Builds a `line-gradient` expression that reveals the route from its start
 * up to `progress` (0–1) along `line-progress`, leaving the rest transparent.
 * Updating this property is paint-only: MapLibre does not re-tile the source,
 * so animating it per frame is smooth and flicker-free.
 */
function revealExpression(progress: number, stops: ReadonlyArray<readonly [number, string]>): PaintPropertyValue {
    const p = Math.min(Math.max(progress, 0), 1);
    const expression: Array<string | number | string[]> = ["interpolate", ["linear"], ["line-progress"]];

    if (p >= 1) {
        for (const [stop, color] of stops) {
            expression.push(stop, color);
        }
    } else {
        const q = Math.max(p, 0.001);
        for (const [stop, color] of stops) {
            expression.push(stop * q, color);
        }
        const fade = Math.min(q + 0.001, 1);
        expression.push(fade, TRANSPARENT);
        if (fade < 1) expression.push(1, TRANSPARENT);
    }

    return expression as unknown as PaintPropertyValue;
}

/**
 * Sets how much of the route is revealed (0–1). Paint-only; safe to call
 * every animation frame. No-op when the layers do not exist (yet).
 */
export function setRouteProgress(map: MapInstance, progress: number): void {
    if (!map.getLayer(ROUTE_LAYERS.line) || !map.getLayer(ROUTE_LAYERS.casing)) {
        return;
    }
    map.setPaintProperty(ROUTE_LAYERS.line, "line-gradient", revealExpression(progress, ROUTE_LINE_STOPS));
    map.setPaintProperty(ROUTE_LAYERS.casing, "line-gradient", revealExpression(progress, ROUTE_CASING_STOPS));
}

/* ------------------------------------------------------------------ *
 * Layer scaffolding
 * ------------------------------------------------------------------ */

export function lineFeature(route: Route, routeIndex: number): LineFeature {
    return {
        type: "Feature",
        properties: { routeIndex },
        geometry: { type: "LineString", coordinates: route.geometry },
    };
}

function ensureSource(map: MapInstance, id: string, lineMetrics = false): void {
    if (!map.getSource(id)) {
        map.addSource(id, {
            type: "geojson",
            data: EMPTY,
            ...(lineMetrics ? { lineMetrics: true } : {}),
        });
    }
}

function ensureLayer(map: MapInstance, layer: Parameters<MapInstance["addLayer"]>[0]): void {
    if (!map.getLayer(layer.id)) {
        map.addLayer(layer);
    }
}

/**
 * Idempotently (re)creates the route sources/layers; must run after every
 * basemap (re)load since switching styles drops custom layers. Returns whether
 * the line layer exists afterward.
 */
export function ensureRouteLayers(map: MapInstance): boolean {
    if (!map.isStyleLoaded()) return false;

    ensureSource(map, ROUTE_SOURCES.alternatives);
    ensureLayer(map, {
        id: ROUTE_LAYERS.alternatives,
        type: "line",
        source: ROUTE_SOURCES.alternatives,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
            "line-color": "#94a3b8",
            "line-width": 5,
            "line-opacity": 0.85,
            "line-dasharray": [1.5, 1.5],
        },
    });

    ensureSource(map, ROUTE_SOURCES.selected, true);
    ensureLayer(map, {
        id: ROUTE_LAYERS.casing,
        type: "line",
        source: ROUTE_SOURCES.selected,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
            "line-width": 12,
            "line-gradient": revealExpression(1, ROUTE_CASING_STOPS),
        },
    });
    ensureLayer(map, {
        id: ROUTE_LAYERS.line,
        type: "line",
        source: ROUTE_SOURCES.selected,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
            "line-width": 7,
            "line-opacity": 0.95,
            "line-gradient": revealExpression(1, ROUTE_LINE_STOPS),
        },
    });

    return map.getLayer(ROUTE_LAYERS.line) !== undefined;
}
