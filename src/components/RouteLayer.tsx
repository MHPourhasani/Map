import { useEffect, useRef } from "react";
import { useMapStore } from "../map/MapContext";
import { ROUTE_LAYERS, ROUTE_SOURCES, ensureRouteLayers, lineFeature, setRouteProgress, whenStyleReady } from "../map/routeLayers";
import { useRouteSelection } from "../hooks/useRouteSelection";
import { usePlanner } from "../state/PlannerContext";
import { boundsFromPositions } from "../types/geo";
import { prefersReducedMotion } from "../utils/format";

type GeoSource = { setData: (data: unknown) => void } | undefined;

const EMPTY = { type: "FeatureCollection", features: [] } as const;
const DRAW_MS = 900;

/** Draws the route(s) on the map: the selected route as a gradient line (with a draw-on animation) and alternatives as dashed lines that can be clicked to select. Renders nothing itself. */
export function RouteLayer() {
    const { map, styleVersion } = useMapStore();
    const { setSelectedRouteIndex } = usePlanner();
    const { routes, activeIndex, query } = useRouteSelection();

    const fittedFor = useRef<unknown>(null);
    const animatedFor = useRef<string | null>(null);

    // Sources + layers + data (re-applied after every style load).
    useEffect(() => {
        if (!map) return;
        let frame = 0;

        const cancelWait = whenStyleReady(map, () => {
            if (!ensureRouteLayers(map)) return;
            const active = routes[activeIndex];
            const selected = map.getSource(ROUTE_SOURCES.selected) as GeoSource;
            const alternatives = map.getSource(ROUTE_SOURCES.alternatives) as GeoSource;

            selected?.setData(active ? { type: "FeatureCollection", features: [lineFeature(active, activeIndex)] } : EMPTY);
            alternatives?.setData({
                type: "FeatureCollection",
                features: routes.flatMap((route, i) => (i === activeIndex ? [] : [lineFeature(route, i)])),
            });

            if (active && animatedFor.current !== active.id + styleVersion) {
                animatedFor.current = active.id + styleVersion;
                if (prefersReducedMotion()) {
                    setRouteProgress(map, 1);
                } else {
                    const start = performance.now();
                    const tick = (now: number) => {
                        const progress = Math.min((now - start) / DRAW_MS, 1);
                        setRouteProgress(map, progress);
                        if (progress < 1) frame = requestAnimationFrame(tick);
                    };
                    setRouteProgress(map, 0);
                    frame = requestAnimationFrame(tick);
                }
            }
        });

        return () => {
            cancelWait();
            cancelAnimationFrame(frame);
        };
    }, [map, styleVersion, routes, activeIndex]);

    useEffect(() => {
        if (!map || routes.length === 0 || fittedFor.current === query.data) return;
        fittedFor.current = query.data;
        const bounds = boundsFromPositions(routes[0].geometry);
        if (!bounds) return;
        map.fitBounds(
            [
                [bounds.sw.lng, bounds.sw.lat],
                [bounds.ne.lng, bounds.ne.lat],
            ],
            {
                padding: window.innerWidth < 768 ? 60 : 120,
                maxZoom: 16,
                duration: prefersReducedMotion() ? 0 : 900,
                essential: true,
            },
        );
    }, [map, routes, query.data]);

    useEffect(() => {
        if (!map) return;
        const onClick = (event: { features?: Array<{ properties?: { routeIndex?: number } }> }) => {
            const index = event.features?.[0]?.properties?.routeIndex;
            if (typeof index === "number") setSelectedRouteIndex(index);
        };
        const enter = () => (map.getCanvas().style.cursor = "pointer");
        const leave = () => (map.getCanvas().style.cursor = "");
        map.on("click", ROUTE_LAYERS.alternatives, onClick);
        map.on("mouseenter", ROUTE_LAYERS.alternatives, enter);
        map.on("mouseleave", ROUTE_LAYERS.alternatives, leave);
        return () => {
            map.off("click", ROUTE_LAYERS.alternatives, onClick);
            map.off("mouseenter", ROUTE_LAYERS.alternatives, enter);
            map.off("mouseleave", ROUTE_LAYERS.alternatives, leave);
        };
    }, [map, setSelectedRouteIndex]);

    return null;
}
