import type { LngLat } from "../types/geo";
import type { PlaceResult, ReverseResult, SearchRequest } from "../types/place";
import type { RouteRequest, RouteResult } from "../types/route";

export interface SearchProvider {
    search(request: SearchRequest, signal?: AbortSignal): Promise<PlaceResult[]>;
}

export interface RoutingProvider {
    getRoutes(request: RouteRequest, signal?: AbortSignal): Promise<RouteResult>;
}

export interface ReverseGeocodingProvider {
    reverseGeocode(location: LngLat, signal?: AbortSignal): Promise<ReverseResult>;
}

export interface MapServices {
    search: SearchProvider;
    routing: RoutingProvider;
    reverse: ReverseGeocodingProvider;
}
