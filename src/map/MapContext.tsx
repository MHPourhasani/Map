import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { Map as MapInstance } from "maplibre-gl";

export type { Map as MapInstance, Marker as MarkerInstance } from "maplibre-gl";

export type MapErrorKind = "init" | "load";

interface MapState {
    map: MapInstance | null;
    /** True once the first style has loaded */
    ready: boolean;
    /** Bumped on every style load, so layers added by effects get re-added after a theme swap */
    styleVersion: number;
    error: MapErrorKind | null;
    /** Bumped when the user asks to recreate the map after a failure */
    attempt: number;
}

type MapAction =
    | { type: "register"; map: MapInstance | null }
    | { type: "loaded" }
    | { type: "styleChanged" }
    | { type: "fail"; kind: MapErrorKind }
    | { type: "clearError" }
    | { type: "reload" };

function mapReducer(state: MapState, action: MapAction): MapState {
    switch (action.type) {
        case "register":
            return { ...state, map: action.map, ready: false, error: null, styleVersion: 0 };
        case "loaded":
            return { ...state, ready: true, styleVersion: state.styleVersion + 1 };
        case "styleChanged":
            return { ...state, styleVersion: state.styleVersion + 1 };
        case "fail":
            return { ...state, error: action.kind };
        case "clearError":
            return { ...state, error: null };
        case "reload":
            return { ...state, error: null, attempt: state.attempt + 1 };
    }
}

interface MapStore extends MapState {
    register: (map: MapInstance | null) => void;
    markLoaded: () => void;
    markStyleChanged: () => void;
    reportError: (kind: MapErrorKind) => void;
    clearError: () => void;
    reload: () => void;
}

const MapContext = createContext<MapStore | null>(null);

const INITIAL_STATE: MapState = { map: null, ready: false, styleVersion: 0, error: null, attempt: 0 };

export function MapProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(mapReducer, INITIAL_STATE);

    const actions = useMemo(
        () => ({
            register: (map: MapInstance | null) => dispatch({ type: "register", map }),
            markLoaded: () => dispatch({ type: "loaded" }),
            markStyleChanged: () => dispatch({ type: "styleChanged" }),
            reportError: (kind: MapErrorKind) => dispatch({ type: "fail", kind }),
            clearError: () => dispatch({ type: "clearError" }),
            reload: () => dispatch({ type: "reload" }),
        }),
        [],
    );

    const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);
    return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapStore(): MapStore {
    const value = useContext(MapContext);
    if (!value) throw new Error("useMapStore must be used inside <MapProvider>");
    return value;
}
