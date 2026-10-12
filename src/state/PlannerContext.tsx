import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { SelectedPlace } from "../types/search";
import type { TravelMode } from "../types/route";
import { DEFAULT_TRAVEL_MODE } from "../types/route";
import { serviceAvailability, services } from "../providers/registry";
import { getCurrentPosition, toGeolocationErrorCode, type GeolocationErrorCode, type PositionFix } from "../services/geolocation";
import { parseTripParams, serializeTripParams } from "../utils/tripUrl";
import type { MapTheme } from "../map/styles";

export type GeolocationStatus = "idle" | "locating" | "success" | "error";

export interface GeolocationState {
    status: GeolocationStatus;
    fix?: PositionFix;
    errorCode?: GeolocationErrorCode;
    /** Reverse-geocoded address of the fix (best effort, may be undefined). */
    label?: string;
}

export interface PlannerValue {
    origin: SelectedPlace | null;
    destination: SelectedPlace | null;
    selectedRouteIndex: number;
    theme: MapTheme;
    travelMode: TravelMode;
    geolocation: GeolocationState;
    setOrigin: (place: SelectedPlace | null) => void;
    setDestination: (place: SelectedPlace | null) => void;
    swapPoints: () => void;
    setSelectedRouteIndex: (index: number) => void;
    setTheme: (theme: MapTheme) => void;
    requestLocation: () => void;
    resetGeolocation: () => void;
    /** Clears origin, destination, selected route and geolocation (used on logout). */
    resetTrip: () => void;
}

const THEME_STORAGE_KEY = "pm.map-theme";

function readStoredTheme(): MapTheme {
    try {
        const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "dark" || stored === "light") return stored;
    } catch {
        // storage may be unavailable (private mode) — ignore
    }
    return "light";
}

/** Initial endpoints from `?origin=…&destination=…`; malformed entries are ignored one by one. */
function readInitialTrip(): { origin: SelectedPlace | null; destination: SelectedPlace | null } {
    try {
        return parseTripParams(window.location.search);
    } catch {
        return { origin: null, destination: null };
    }
}

const PlannerContext = createContext<PlannerValue | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
    const [initialTrip] = useState(readInitialTrip);
    const [origin, setOriginState] = useState<SelectedPlace | null>(initialTrip.origin);
    const [destination, setDestinationState] = useState<SelectedPlace | null>(initialTrip.destination);
    const [selectedRouteIndex, setSelectedRouteIndexState] = useState(0);
    const [theme, setThemeState] = useState<MapTheme>(readStoredTheme);
    const [geolocation, setGeolocation] = useState<GeolocationState>({ status: "idle" });
    const geolocationRef = useRef<GeolocationState>({ status: "idle" });

    useEffect(() => {
        geolocationRef.current = geolocation;
    }, [geolocation]);

    useEffect(() => {
        try {
            const serialized = serializeTripParams(origin, destination);
            const next = `${window.location.pathname}${serialized}${window.location.hash}`;
            const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            if (next !== current) {
                window.history.replaceState(null, "", next);
            }
        } catch {
            // history API may be restricted (sandboxed iframe) — the app works anyway
        }
    }, [origin, destination]);

    const setOrigin = useCallback((place: SelectedPlace | null) => {
        setOriginState(place);
        setSelectedRouteIndexState(0);
    }, []);

    const setDestination = useCallback((place: SelectedPlace | null) => {
        setDestinationState(place);
        setSelectedRouteIndexState(0);
    }, []);

    const swapPoints = useCallback(() => {
        setOriginState(destination);
        setDestinationState(origin);
        setSelectedRouteIndexState(0);
    }, [origin, destination]);

    const setSelectedRouteIndex = useCallback((index: number) => {
        setSelectedRouteIndexState(Math.max(0, index));
    }, []);

    const setTheme = useCallback((next: MapTheme) => {
        setThemeState(next);
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
            // ignore storage failures
        }
    }, []);

    const requestLocation = useCallback(() => {
        if (geolocationRef.current.status === "locating") return;
        setGeolocation({ status: "locating" });
        getCurrentPosition()
            .then((fix) => {
                setGeolocation({ status: "success", fix });
                if (serviceAvailability.reverse) {
                    services.reverse
                        .reverseGeocode(fix.location)
                        .then((result) => {
                            setGeolocation((current) =>
                                current.status === "success"
                                    ? {
                                          ...current,
                                          label: result.formattedAddress.length > 0 ? result.formattedAddress : undefined,
                                      }
                                    : current,
                            );
                        })
                        .catch(() => {});
                }
            })
            .catch((error: unknown) => {
                setGeolocation({ status: "error", errorCode: toGeolocationErrorCode(error) });
            });
    }, []);

    const resetGeolocation = useCallback(() => {
        setGeolocation({ status: "idle" });
    }, []);

    const resetTrip = useCallback(() => {
        setOriginState(null);
        setDestinationState(null);
        setSelectedRouteIndexState(0);
        setGeolocation({ status: "idle" });
    }, []);

    const value = useMemo<PlannerValue>(
        () => ({
            origin,
            destination,
            selectedRouteIndex,
            theme,
            travelMode: DEFAULT_TRAVEL_MODE,
            geolocation,
            setOrigin,
            setDestination,
            swapPoints,
            setSelectedRouteIndex,
            setTheme,
            requestLocation,
            resetGeolocation,
            resetTrip,
        }),
        [
            origin,
            destination,
            selectedRouteIndex,
            theme,
            geolocation,
            setOrigin,
            setDestination,
            swapPoints,
            setSelectedRouteIndex,
            setTheme,
            requestLocation,
            resetGeolocation,
            resetTrip,
        ],
    );

    return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerValue {
    const value = useContext(PlannerContext);
    if (!value) {
        throw new Error("usePlanner must be used inside <PlannerProvider>");
    }
    return value;
}
