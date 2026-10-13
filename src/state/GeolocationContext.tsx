import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getCurrentPosition, toGeolocationErrorCode, type GeolocationErrorCode, type PositionFix } from "../services/geolocation";

export type GeolocationStatus = "idle" | "locating" | "success" | "error";

type GeolocationState =
    { status: "idle" | "locating" } | { status: "success"; fix: PositionFix } | { status: "error"; errorCode: GeolocationErrorCode };

interface GeolocationValue {
    status: GeolocationStatus;
    fix: PositionFix | undefined;
    errorCode: GeolocationErrorCode | undefined;
    requestLocation: () => void;
    resetGeolocation: () => void;
}

const GeolocationContext = createContext<GeolocationValue | null>(null);

export function GeolocationProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<GeolocationState>({
        status: "idle",
    });

    const pendingRequest = useRef<symbol | null>(null);

    useEffect(() => {
        return () => {
            pendingRequest.current = null;
        };
    }, []);

    const requestLocation = useCallback(() => {
        if (pendingRequest.current !== null) return;

        const request = Symbol("geolocation-request");
        pendingRequest.current = request;

        setState({ status: "locating" });

        const finish = (next: GeolocationState) => {
            if (pendingRequest.current !== request) return;

            pendingRequest.current = null;
            setState(next);
        };

        try {
            void getCurrentPosition().then(
                (fix) => {
                    finish({ status: "success", fix });
                },
                (error: unknown) => {
                    finish({
                        status: "error",
                        errorCode: toGeolocationErrorCode(error),
                    });
                },
            );
        } catch (error: unknown) {
            finish({
                status: "error",
                errorCode: toGeolocationErrorCode(error),
            });
        }
    }, []);

    const resetGeolocation = useCallback(() => {
        pendingRequest.current = null;
        setState({ status: "idle" });
    }, []);

    const value = useMemo<GeolocationValue>(
        () => ({
            status: state.status,
            fix: state.status === "success" ? state.fix : undefined,
            errorCode: state.status === "error" ? state.errorCode : undefined,
            requestLocation,
            resetGeolocation,
        }),
        [state, requestLocation, resetGeolocation],
    );

    return <GeolocationContext.Provider value={value}>{children}</GeolocationContext.Provider>;
}

export function useGeolocation(): GeolocationValue {
    const value = useContext(GeolocationContext);

    if (!value) throw new Error("useGeolocation must be used inside <GeolocationProvider>");

    return value;
}
