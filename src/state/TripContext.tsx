import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { SelectedPlace } from "../types/place";
import { parseTripParams, serializeTripParams } from "../utils/tripUrl";

interface TripState {
    origin: SelectedPlace | null;
    destination: SelectedPlace | null;
    selectedRouteIndex: number;
}

type TripAction =
    | { type: "setOrigin"; place: SelectedPlace | null }
    | { type: "setDestination"; place: SelectedPlace | null }
    | { type: "swap" }
    | { type: "selectRoute"; index: number }
    | {
          type: "restoreFromUrl";
          origin: SelectedPlace | null;
          destination: SelectedPlace | null;
      }
    | { type: "reset" };

function tripReducer(state: TripState, action: TripAction): TripState {
    switch (action.type) {
        case "setOrigin":
            return {
                ...state,
                origin: action.place,
                selectedRouteIndex: 0,
            };

        case "setDestination":
            return {
                ...state,
                destination: action.place,
                selectedRouteIndex: 0,
            };

        case "swap":
            return {
                origin: state.destination,
                destination: state.origin,
                selectedRouteIndex: 0,
            };

        case "selectRoute":
            return {
                ...state,
                selectedRouteIndex: Number.isInteger(action.index) && action.index >= 0 ? action.index : 0,
            };

        case "restoreFromUrl":
            return {
                origin: action.origin,
                destination: action.destination,
                selectedRouteIndex: 0,
            };

        case "reset":
            return {
                origin: null,
                destination: null,
                selectedRouteIndex: 0,
            };

        default:
            return state;
    }
}

function createInitialTrip(): TripState {
    return {
        ...parseTripParams(window.location.search),
        selectedRouteIndex: 0,
    };
}

interface TripValue extends TripState {
    setOrigin: (place: SelectedPlace | null) => void;
    setDestination: (place: SelectedPlace | null) => void;
    swapPoints: () => void;
    setSelectedRouteIndex: (index: number) => void;
    resetTrip: () => void;
}

const TripContext = createContext<TripValue | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(tripReducer, undefined, createInitialTrip);
    const { origin, destination } = state;

    useEffect(() => {
        function handlePopState() {
            const trip = parseTripParams(window.location.search);

            dispatch({
                type: "restoreFromUrl",
                origin: trip.origin,
                destination: trip.destination,
            });
        }

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    // Keep the URL synchronized with the current endpoints.
    useEffect(() => {
        const { pathname, search, hash } = window.location;
        const nextSearch = serializeTripParams(origin, destination);

        if (nextSearch === search) return;

        try {
            window.history.replaceState(null, "", `${pathname}${nextSearch}${hash}`);
        } catch {
            // The app remains usable if the History API is unavailable.
        }
    }, [origin, destination]);

    const actions = useMemo(
        () => ({
            setOrigin: (place: SelectedPlace | null) => dispatch({ type: "setOrigin", place }),
            setDestination: (place: SelectedPlace | null) => dispatch({ type: "setDestination", place }),
            swapPoints: () => dispatch({ type: "swap" }),
            setSelectedRouteIndex: (index: number) => dispatch({ type: "selectRoute", index }),
            resetTrip: () => dispatch({ type: "reset" }),
        }),
        [],
    );

    const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

    return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): TripValue {
    const value = useContext(TripContext);

    if (value === null) throw new Error("useTrip must be used inside TripProvider");

    return value;
}
