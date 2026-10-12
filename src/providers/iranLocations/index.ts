import type { SearchProvider } from "../contracts";
import { ProviderError, type ProviderErrorCode } from "../providerError";
import { parseCities, rankCities } from "./transform";

const CITIES_URL = "https://www.iran-locations-api.ir/api/v1/fa/cities";
const CACHE_TTL_MS = 30 * 60_000;

let cache: { expiresAt: number; promise: Promise<ReturnType<typeof parseCities>> } | null = null;

async function loadCities() {
    let response: Response;
    try {
        response = await fetch(CITIES_URL, { headers: { Accept: "application/json" } });
    } catch (error) {
        throw new ProviderError("network", "Cities API request failed", { cause: error });
    }

    if (!response.ok) {
        const code: ProviderErrorCode = response.status === 429 ? "rate_limited" : response.status === 404 ? "not_found" : "unknown";
        throw new ProviderError(code, `Cities API error (HTTP ${response.status})`, { status: response.status });
    }

    const payload: unknown = await response.json().catch(() => null);
    const cities = parseCities(payload);
    if (cities.length === 0) {
        throw new ProviderError("unknown", "Cities API returned no usable records");
    }
    return cities;
}

/** The city list is a shared resource, so it is cached here rather than tied to one query's abort signal */
function getCities() {
    if (cache !== null && Date.now() < cache.expiresAt) return cache.promise;
    const promise = loadCities().catch((error: unknown) => {
        if (cache !== null && cache.promise === promise) cache = null;
        throw error;
    });
    cache = { expiresAt: Date.now() + CACHE_TTL_MS, promise };
    return promise;
}

export function createCitiesSearchProvider(): SearchProvider {
    return {
        async search({ term, near }, signal) {
            const trimmedTerm = term.trim();
            if (trimmedTerm.length === 0) return [];
            const cities = await getCities();
            if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");
            return rankCities(cities, trimmedTerm, near);
        },
    };
}
