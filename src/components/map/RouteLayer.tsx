import { useEffect, useRef } from "react";
import { useActiveRoute } from "../../hooks/useActiveRoute";
import { fitMapToBounds } from "../../map/camera";
import { useMapStore } from "../../map/MapContext";
import { ROUTE_LAYERS, animateRouteReveal, ensureRouteLayers, setRouteData } from "../../map/routeLayers";
import { whenStyleReady } from "../../map/styleReady";
import { useTrip } from "../../state/TripContext";
import { boundsFromPositions } from "../../types/geo";

const DRAW_DURATION_MS = 900;
const FIT_PADDING = 120;

/** Draws the routes on the map (selected one animated, alternatives dashed and clickable); renders no DOM */
export function RouteLayer() {
    const { map, styleVersion } = useMapStore();
    const { setSelectedRouteIndex } = useTrip();
    const { query, routes, activeIndex, activeRoute } = useActiveRoute();

    const fittedForResult = useRef<unknown>(null);
    const animatedForRoute = useRef<string | null>(null);

    // Re-runs after every style load, because a basemap swap removes the route layers
    useEffect(() => {
        if (!map) return;
        let stopReveal = () => {};

        const cancelWait = whenStyleReady(map, () => {
            if (!ensureRouteLayers(map)) return;
            setRouteData(map, routes, activeIndex);

            if (activeRoute && animatedForRoute.current !== activeRoute.id + styleVersion) {
                animatedForRoute.current = activeRoute.id + styleVersion;
                stopReveal = animateRouteReveal(map, DRAW_DURATION_MS);
            }
        });

        return () => {
            cancelWait();
            stopReveal();
        };
    }, [map, styleVersion, routes, activeIndex, activeRoute]);

    // Zoom to the primary route once per new routing result
    useEffect(() => {
        if (!map || routes.length === 0 || fittedForResult.current === query.data) return;
        fittedForResult.current = query.data;
        const bounds = boundsFromPositions(routes[0].geometry);
        if (bounds) fitMapToBounds(map, bounds, FIT_PADDING);
    }, [map, routes, query.data]);

    // Clicking a dashed alternative selects it
    useEffect(() => {
        if (!map) return;
        const onClick = (event: { features?: Array<{ properties?: { routeIndex?: number } }> }) => {
            const index = event.features?.[0]?.properties?.routeIndex;
            if (typeof index === "number") setSelectedRouteIndex(index);
        };
        const showPointer = () => (map.getCanvas().style.cursor = "pointer");
        const hidePointer = () => (map.getCanvas().style.cursor = "");

        map.on("click", ROUTE_LAYERS.alternatives, onClick);
        map.on("mouseenter", ROUTE_LAYERS.alternatives, showPointer);
        map.on("mouseleave", ROUTE_LAYERS.alternatives, hidePointer);
        return () => {
            map.off("click", ROUTE_LAYERS.alternatives, onClick);
            map.off("mouseenter", ROUTE_LAYERS.alternatives, showPointer);
            map.off("mouseleave", ROUTE_LAYERS.alternatives, hidePointer);
        };
    }, [map, setSelectedRouteIndex]);

    return null;
}
