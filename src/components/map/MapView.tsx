import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { useT } from "../../i18n";
import { useMapStore } from "../../map/MapContext";
import { styleFor, type MapTheme } from "../../map/styles";
import { waitForStyleLoaded } from "../../map/styleReady";
import { useTheme } from "../../state/ThemeContext";
import { INITIAL_VIEW } from "../../types/geo";

const LOAD_TIMEOUT_MS = 15_000;

function httpStatusOf(error: unknown): number | undefined {
    if (error === null || typeof error !== "object" || !("status" in error)) return undefined;
    return typeof error.status === "number" ? error.status : undefined;
}

/** Before the first load an HTTP, style or tile failure is fatal; later tile errors are harmless */
function isFatalLoadError(error: unknown): boolean {
    if (httpStatusOf(error) !== undefined) return true;
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    return message.includes("style") || message.includes("tile") || message.includes("failed to fetch");
}

/** Owns the MapLibre instance: creates it, swaps the theme, reports load errors and destroys it */
export function MapView() {
    const t = useT();
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    const { map, register, markLoaded, markStyleChanged, reportError, clearError, attempt } = useMapStore();

    // Remembers the style on screen, so a theme chosen while no map exists is used when the map is recreated
    const appliedThemeRef = useRef<MapTheme>(theme);

    // `attempt` changes when the user asks to reload a failed map
    useEffect(() => {
        if (!containerRef.current) return;

        let mapInstance: maplibregl.Map;
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

        let disposed = false;
        let loaded = false;
        const onLoaded = () => {
            if (disposed || loaded) return;
            loaded = true;
            markLoaded();
        };
        const onError = (event: { error?: unknown }) => {
            if (!disposed && !loaded && isFatalLoadError(event.error)) reportError("load");
        };

        mapInstance.on("load", onLoaded);
        mapInstance.on("idle", onLoaded);
        mapInstance.on("error", onError);
        const loadTimeout = window.setTimeout(() => {
            if (!loaded) reportError("load");
        }, LOAD_TIMEOUT_MS);

        return () => {
            disposed = true;
            window.clearTimeout(loadTimeout);
            mapInstance.off("load", onLoaded);
            mapInstance.off("idle", onLoaded);
            mapInstance.off("error", onError);
            mapInstance.remove();
            register(null);
        };
    }, [attempt, register, markLoaded, reportError]);

    useEffect(() => {
        if (appliedThemeRef.current === theme) return;
        appliedThemeRef.current = theme;
        if (!map) return;

        clearError();
        map.setStyle(styleFor(theme));

        let cancelled = false;
        void waitForStyleLoaded(map).then(() => {
            if (!cancelled) markStyleChanged();
        });
        return () => {
            cancelled = true;
        };
    }, [map, theme, markStyleChanged, clearError]);

    return <div ref={containerRef} className="pm-map" role="region" aria-label={t("map.regionLabel")} />;
}
