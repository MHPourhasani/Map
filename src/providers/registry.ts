import { env } from "../config/env";
import type { MapServices, ReverseGeocodingProvider, RoutingProvider } from "../types/provider";
import { ProviderError } from "../types/provider";
import { createCitiesSearchProvider } from "./iranLocations";
import { createReverseProvider, createRoutingProvider, createSearchProvider } from "./neshan";

/** Search backends selectable through `VITE_SEARCH_PROVIDER`. */
export type SearchBackend = "cities" | "neshan";

function missingKey(operation: string): ProviderError {
    return new ProviderError("missing_api_key", `Neshan API key is not configured (${operation})`);
}

/** Routing stub used while `VITE_NESHAN_API_KEY` is missing — fails typed. */
const unavailableRouting: RoutingProvider = {
    getRoutes: async () => {
        throw missingKey("routing");
    },
};

/** Reverse-geocoding stub used while `VITE_NESHAN_API_KEY` is missing. */
const unavailableReverse: ReverseGeocodingProvider = {
    reverseGeocode: async () => {
        throw missingKey("reverse geocoding");
    },
};

/**
 * Active search backend:
 * - `cities` (default): free key-less city dataset from iran-locations-api.ir
 * - `neshan`: street/POI autocomplete — only when explicitly requested AND an
 *   API key exists; otherwise we fall back to `cities` so search never breaks.
 */
export const searchBackend: SearchBackend = env.searchProvider === "neshan" && env.neshanApiKey ? "neshan" : "cities";

/**
 * Service registry — the single place where concrete providers are chosen.
 * Swapping the vendor (or adding a proxy) only requires another `MapServices`
 * implementation here; no UI code changes. `search` is always available (cities
 * need no key); `routing`/`reverse` need `VITE_NESHAN_API_KEY`, otherwise they
 * throw a typed `missing_api_key` error the UI shows in Persian.
 */
export const services: MapServices = {
    search: searchBackend === "neshan" ? createSearchProvider(env.neshanApiKey) : createCitiesSearchProvider(),
    routing: env.neshanApiKey ? createRoutingProvider(env.neshanApiKey) : unavailableRouting,
    reverse: env.neshanApiKey ? createReverseProvider(env.neshanApiKey) : unavailableReverse,
};

/** Which services can reach a real backend right now. */
export const serviceAvailability = {
    search: searchBackend === "neshan" ? Boolean(env.neshanApiKey) : true,
    routing: Boolean(env.neshanApiKey),
    reverse: Boolean(env.neshanApiKey),
} as const;

export const PROVIDER_NAME = "Neshan";
