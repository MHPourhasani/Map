import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { services } from "../providers/registry";
import { usePlanner } from "./PlannerContext";
import type { Route, RouteResult } from "../types/route";

interface RouteValue {
    query: UseQueryResult<RouteResult, unknown>;
    routes: Route[];
    activeIndex: number;
    active: Route | undefined;
}

const RouteContext = createContext<RouteValue | null>(null);

export function RouteProvider({ children }: { children: ReactNode }) {
    const { origin, destination, travelMode, selectedRouteIndex } = usePlanner();
    const originKey = origin ? `${origin.location.lng},${origin.location.lat}` : null;
    const destinationKey = destination ? `${destination.location.lng},${destination.location.lat}` : null;
    const query = useQuery<RouteResult>({
        queryKey: ["route", originKey, destinationKey, travelMode],
        queryFn: ({ signal }) =>
            services.routing.getRoutes(
                { origin: origin!.location, destination: destination!.location, mode: travelMode, alternatives: true },
                signal,
            ),
        enabled: origin !== null && destination !== null,
        staleTime: 60_000,
        gcTime: 5 * 60_000,
    });
    const value = useMemo<RouteValue>(() => {
        const routes = query.data?.routes ?? [];
        const activeIndex = Math.min(selectedRouteIndex, Math.max(routes.length - 1, 0));
        return { query, routes, activeIndex, active: routes[activeIndex] };
    }, [query, selectedRouteIndex]);
    return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

export function useRoute(): RouteValue {
    const value = useContext(RouteContext);
    if (!value) throw new Error("useRoute must be used inside <RouteProvider>");
    return value;
}
