import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { useT } from "../i18n";
import { useMapStore, type MapInstance } from "../map/MapContext";
import { styleFor, type MapTheme } from "../map/styles";
import { waitForStyleLoaded } from "../map/waitForStyleLoaded";
import { usePlanner } from "../state/PlannerContext";
import { INITIAL_VIEW } from "../types/geo";

function httpStatusOf(error: unknown): number | undefined {
    if (error !== null && typeof error === "object" && "status" in error) {
        const status = (error as { status?: unknown }).status;
        if (typeof status === "number") return status;
    }
    return undefined;
}

/** Owns the MapLibre instance lifecycle: creation, theme swaps, error reporting, teardown. */
export function MapView() {
    const containerRef = useRef<HTMLDivElement>(null);
    const t = useT();
    const { theme } = usePlanner();
    const { map, register, markReady, markStyleLoaded, reportError, clearError, attempt } = useMapStore();

    const appliedThemeRef = useRef<MapTheme>(theme);

    useEffect(() => {
        if (!containerRef.current) return;

        let disposed = false;
        let mapInstance: MapInstance;
        try {
            mapInstance = new maplibregl.Map({
                container: containerRef.current,
                style: styleFor(appliedThemeRef.current),
                center: [INITIAL_VIEW.center.lng, INITIAL_VIEW.center.lat],
                zoom: INITIAL_VIEW.zoom,
                minZoom: 4,
                maxZoom: 19,
            });
        } catch {
            reportError("init");
            return;
        }

        register(mapInstance);

        let loaded = false;
        const markLoaded = () => {
            if (disposed || loaded) return;
            loaded = true;
            markReady();
            markStyleLoaded();
        };
        const onError = (event: { error?: unknown }) => {
            if (disposed || loaded) return;
            const status = httpStatusOf(event.error);
            const message = event.error instanceof Error ? event.error.message.toLowerCase() : "";
            const looksFatal =
                status !== undefined || message.includes("style") || message.includes("tile") || message.includes("failed to fetch");
            if (looksFatal) reportError("load");
        };

        mapInstance.on("load", markLoaded);
        mapInstance.on("idle", markLoaded);
        mapInstance.on("error", onError);

        const failsafe = window.setTimeout(() => {
            if (!loaded) reportError("load");
        }, 15_000);

        return () => {
            disposed = true;
            window.clearTimeout(failsafe);
            mapInstance.off("load", markLoaded);
            mapInstance.off("idle", markLoaded);
            mapInstance.off("error", onError);
            mapInstance.remove();
            register(null);
        };
    }, [attempt, register, markReady, markStyleLoaded, reportError]);

    // --- theme switching ----------------------------------------------------
    useEffect(() => {
        if (appliedThemeRef.current === theme) return;
        appliedThemeRef.current = theme;
        if (!map) return;
        clearError();
        map.setStyle(styleFor(theme));

        let cancelled = false;
        void waitForStyleLoaded(map).then(() => {
            if (!cancelled) markStyleLoaded();
        });
        return () => {
            cancelled = true;
        };
    }, [map, theme, markStyleLoaded, clearError]);

    return <div ref={containerRef} className="pm-map" role="region" aria-label={t("map.regionLabel")} />;
}
