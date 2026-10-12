import { env } from "../config/env";
import type { MapServices, ReverseGeocodingProvider, RoutingProvider } from "./contracts";
import { createCitiesSearchProvider } from "./iranLocations";
import { createReverseProvider, createRoutingProvider, createSearchProvider } from "./neshan";
import { ProviderError } from "./providerError";

function missingKey(operation: string): ProviderError {
    return new ProviderError("missing_api_key", `Neshan API key is not configured (${operation})`);
}

const unavailableRouting: RoutingProvider = {
    getRoutes: async () => {
        throw missingKey("routing");
    },
};

const unavailableReverse: ReverseGeocodingProvider = {
    reverseGeocode: async () => {
        throw missingKey("reverse geocoding");
    },
};

const { neshanApiKey } = env;

export const services: MapServices = {
    search: env.searchProvider === "neshan" && neshanApiKey ? createSearchProvider(neshanApiKey) : createCitiesSearchProvider(),
    routing: neshanApiKey ? createRoutingProvider(neshanApiKey) : unavailableRouting,
    reverse: neshanApiKey ? createReverseProvider(neshanApiKey) : unavailableReverse,
};
