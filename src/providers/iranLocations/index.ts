import { ProviderError } from "../../types/provider";
import type { SearchProvider } from "../../types/provider";
import { parseCities, rankCities } from "./transform";

/**
 * Key-less place search on the free Iran Locations API
 * (`GET .../api/v1/fa/cities`, CORS `*`, no key). The full list (~344 cities) is
 * fetched once into memory (30 min TTL) — not tied to any query's AbortSignal
 * since it is a shared resource — and keystrokes then filter locally, so typing
 * costs no extra network requests.
 */
const CITIES_URL = "https://www.iran-locations-api.ir/api/v1/fa/cities";
const CACHE_TTL_MS = 30 * 60_000;

let cache: { expiresAt: number; promise: Promise<ReturnType<typeof parseCities>> } | null = null;

async function loadCities() {
    let response: Response;
    try {
        response = await fetch(CITIES_URL, {
            method: "GET",
            headers: { Accept: "application/json" },
        });
    } catch (error) {
        throw new ProviderError("network", "Cities API request failed", {
            cause: error,
        });
    }

    if (!response.ok) {
        const code = response.status === 429 ? "rate_limited" : response.status === 404 ? "not_found" : "unknown";
        throw new ProviderError(code, `Cities API error (HTTP ${response.status})`, {
            status: response.status,
        });
    }

    const payload: unknown = await response.json().catch(() => null);
    const cities = parseCities(payload);
    if (cities.length === 0) {
        throw new ProviderError("unknown", "Cities API returned no usable records");
    }
    return cities;
}

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
        async search(request, signal) {
            const term = request.term.trim();
            if (term.length === 0) return [];
            const cities = await getCities();
            if (signal?.aborted) {
                throw new DOMException("The operation was aborted.", "AbortError");
            }
            return rankCities(cities, term, request.near);
        },
    };
}
