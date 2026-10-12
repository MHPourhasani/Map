import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { LngLat } from "../types/geo";
import type { SelectedPlace } from "../types/search";
import type { RouteResult, TravelMode } from "../types/route";
import { services } from "../providers/registry";

const keyOf = (point: LngLat | undefined): number[] | null => (point ? [point.lng, point.lat] : null);

/** Fetches the route (with alternatives) for the selected endpoints; disabled until both are set. */
export function useRouteQuery(
    origin: SelectedPlace | null,
    destination: SelectedPlace | null,
    mode: TravelMode,
): UseQueryResult<RouteResult, unknown> {
    const originKey = keyOf(origin?.location);
    const destinationKey = keyOf(destination?.location);

    return useQuery<RouteResult>({
        queryKey: ["route", originKey, destinationKey, mode],
        queryFn: ({ signal }) =>
            services.routing.getRoutes(
                {
                    origin: origin!.location,
                    destination: destination!.location,
                    mode,
                    alternatives: true,
                },
                signal,
            ),
        enabled: originKey !== null && destinationKey !== null,
        staleTime: 60_000,
        gcTime: 5 * 60_000,
    });
}
