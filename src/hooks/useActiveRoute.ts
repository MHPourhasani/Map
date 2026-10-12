import { skipToken, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { services } from "../providers/registry";
import { useTrip } from "../state/TripContext";
import { DEFAULT_TRAVEL_MODE, type Route } from "../types/route";

/**
 * The route between the chosen origin and destination, plus which one is selected.
 * Several components call this; React Query shares one request per coordinate pair,
 * and a changed endpoint cancels the old request.
 */
export function useActiveRoute() {
    const { origin, destination, selectedRouteIndex } = useTrip();
    const mode = DEFAULT_TRAVEL_MODE;

    const query = useQuery({
        queryKey: [
            "route",
            origin ? [origin.location.lng, origin.location.lat] : null,
            destination ? [destination.location.lng, destination.location.lat] : null,
            mode,
        ],
        queryFn:
            origin && destination
                ? ({ signal }) =>
                      services.routing.getRoutes(
                          { origin: origin.location, destination: destination.location, mode, alternatives: true },
                          signal,
                      )
                : skipToken,
        staleTime: 60_000,
        gcTime: 5 * 60_000,
    });

    const routes = useMemo<Route[]>(() => query.data?.routes ?? [], [query.data]);
    const activeIndex = Math.min(selectedRouteIndex, Math.max(routes.length - 1, 0));

    return { query, routes, activeIndex, activeRoute: routes[activeIndex] as Route | undefined };
}
