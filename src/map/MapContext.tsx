import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import maplibregl from "maplibre-gl";
import type { LngLat } from "../types/geo";

/** The concrete map instance type used across the app. */
export type MapInstance = InstanceType<typeof maplibregl.Map>;
/** The concrete marker type used across the app. */
export type MarkerInstance = InstanceType<typeof maplibregl.Marker>;

export type MapErrorKind = "init" | "load";

export interface MapStore {
    map: MapInstance | null;
    /** True once the map has loaded its style and rendered for the first time. */
    ready: boolean;
    /** Bumped every time a new style finishes loading (layers must be re-added). */
    styleVersion: number;
    error: MapErrorKind | null;
    /** Incremented when the user asks to recreate a failed map. */
    attempt: number;
    register: (map: MapInstance | null) => void;
    markReady: () => void;
    markStyleLoaded: () => void;
    reportError: (kind: MapErrorKind) => void;
    clearError: () => void;
    reload: () => void;
}

const MapContext = createContext<MapStore | null>(null);

export function MapProvider({ children }: { children: ReactNode }) {
    const [map, setMap] = useState<MapInstance | null>(null);
    const [ready, setReady] = useState(false);
    const [styleVersion, setStyleVersion] = useState(0);
    const [error, setError] = useState<MapErrorKind | null>(null);
    const [attempt, setAttempt] = useState(0);

    const register = useCallback((next: MapInstance | null) => {
        setMap(next);
        setReady(false);
        setError(null);
        setStyleVersion(0);
    }, []);

    const markReady = useCallback(() => setReady(true), []);
    const markStyleLoaded = useCallback(() => setStyleVersion((version) => version + 1), []);
    const reportError = useCallback((kind: MapErrorKind) => setError(kind), []);
    const clearError = useCallback(() => setError(null), []);
    const reload = useCallback(() => {
        setError(null);
        setAttempt((value) => value + 1);
    }, []);

    const value = useMemo<MapStore>(
        () => ({
            map,
            ready,
            styleVersion,
            error,
            attempt,
            register,
            markReady,
            markStyleLoaded,
            reportError,
            clearError,
            reload,
        }),
        [map, ready, styleVersion, error, attempt, register, markReady, markStyleLoaded, reportError, clearError, reload],
    );

    return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapStore(): MapStore {
    const value = useContext(MapContext);
    if (!value) {
        throw new Error("useMapStore must be used inside <MapProvider>");
    }
    return value;
}

/** Current geographic center of the map (updates on `moveend`). */
export function useMapCenter(): LngLat | undefined {
    const { map, ready } = useMapStore();
    const [center, setCenter] = useState<LngLat | undefined>(undefined);

    useEffect(() => {
        if (!map) return;
        const update = () => {
            const current = map.getCenter();
            setCenter({ lng: current.lng, lat: current.lat });
        };
        update();
        map.on("moveend", update);
        return () => {
            map.off("moveend", update);
        };
    }, [map, ready]);

    return map ? center : undefined;
}
