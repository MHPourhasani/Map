import type { ReverseGeocodingProvider, RoutingProvider, SearchProvider } from "../../types/provider";
import { ProviderError } from "../../types/provider";
import { DEFAULT_SEARCH_CENTER } from "../../types/geo";
import { neshanFetch } from "./client";
import { mapDirectionResponse, mapReverseResponse, mapSearchItem } from "./mappers";
import type { NeshanDirectionResponse, NeshanReverseResponse, NeshanSearchResponse } from "./types";

type ApiKey = string | undefined;

export function createSearchProvider(apiKey: ApiKey): SearchProvider {
    return {
        async search(request, signal) {
            const term = request.term.trim();
            if (term.length === 0) return [];
            const center = request.near ?? DEFAULT_SEARCH_CENTER;
            const query = JSON.stringify({
                term,
                lat: center.lat,
                lng: center.lng,
            });
            const data = await neshanFetch<NeshanSearchResponse>("/v3/search", { q: query }, apiKey, signal);
            return (data.items ?? []).map(mapSearchItem).filter((item): item is NonNullable<typeof item> => item !== null);
        },
    };
}

export function createRoutingProvider(apiKey: ApiKey): RoutingProvider {
    return {
        async getRoutes(request, signal) {
            const data = await neshanFetch<NeshanDirectionResponse>(
                "/v4/direction",
                {
                    type: request.mode === "motorcycle" ? "motorcycle" : "car",
                    origin: `${request.origin.lat},${request.origin.lng}`,
                    destination: `${request.destination.lat},${request.destination.lng}`,
                    alternative: request.alternatives ? "true" : "false",
                },
                apiKey,
                signal,
            );

            const result = mapDirectionResponse(data);
            if (result.routes.length === 0) {
                throw new ProviderError("no_route", "No drivable route was returned for these points");
            }
            return result;
        },
    };
}

export function createReverseProvider(apiKey: ApiKey): ReverseGeocodingProvider {
    return {
        async reverseGeocode(location, signal) {
            const data = await neshanFetch<NeshanReverseResponse>("/v5/reverse", { lat: location.lat, lng: location.lng }, apiKey, signal);
            return mapReverseResponse(data);
        },
    };
}
