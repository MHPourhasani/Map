import { useMemo } from "react";
import { useRouteQuery } from "./useRouteQuery";
import { usePlanner } from "../state/PlannerContext";
import type { Route } from "../types/route";

export interface RouteSelection {
    routes: Route[];
    activeIndex: number;
    active: Route | undefined;
    /** The underlying query, so consumers can render loading / error states. */
    query: ReturnType<typeof useRouteQuery>;
}

/** Single subscription to the route query, shared by every route consumer. */
export function useRouteSelection(): RouteSelection {
    const { origin, destination, travelMode, selectedRouteIndex } = usePlanner();

    const query = useRouteQuery(origin, destination, travelMode);
    const routes = useMemo(() => query.data?.routes ?? [], [query.data]);
    const activeIndex = Math.min(selectedRouteIndex, Math.max(routes.length - 1, 0));
    return { routes, activeIndex, active: routes[activeIndex], query };
}
