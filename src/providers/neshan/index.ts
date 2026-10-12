import { DEFAULT_SEARCH_CENTER } from "../../types/geo";
import type { ReverseGeocodingProvider, RoutingProvider, SearchProvider } from "../contracts";
import { ProviderError } from "../providerError";
import { neshanFetch } from "./client";
import { mapDirectionResponse, mapReverseResponse, mapSearchItem } from "./mappers";
import type { NeshanDirectionResponse, NeshanReverseResponse, NeshanSearchResponse } from "./types";

export function createSearchProvider(apiKey: string): SearchProvider {
    return {
        async search({ term, near = DEFAULT_SEARCH_CENTER }, signal) {
            const trimmedTerm = term.trim();
            if (trimmedTerm.length === 0) return [];
            const query = JSON.stringify({ term: trimmedTerm, lat: near.lat, lng: near.lng });
            const data = await neshanFetch<NeshanSearchResponse>("/v3/search", { q: query }, apiKey, signal);
            return (data.items ?? []).map(mapSearchItem).filter((place) => place !== null);
        },
    };
}

export function createRoutingProvider(apiKey: string): RoutingProvider {
    return {
        async getRoutes({ origin, destination, mode, alternatives }, signal) {
            const data = await neshanFetch<NeshanDirectionResponse>(
                "/v4/direction",
                {
                    type: mode === "motorcycle" ? "motorcycle" : "car",
                    origin: `${origin.lat},${origin.lng}`,
                    destination: `${destination.lat},${destination.lng}`,
                    alternative: alternatives,
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

export function createReverseProvider(apiKey: string): ReverseGeocodingProvider {
    return {
        async reverseGeocode({ lat, lng }, signal) {
            return mapReverseResponse(await neshanFetch<NeshanReverseResponse>("/v5/reverse", { lat, lng }, apiKey, signal));
        },
    };
}
