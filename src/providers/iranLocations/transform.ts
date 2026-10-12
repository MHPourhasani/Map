import type { LngLat } from "../../types/geo";
import type { PlaceResult } from "../../types/place";

export const MAX_CITY_RESULTS = 30;

export interface RawCity {
    name?: unknown;
    latitude?: unknown;
    longitude?: unknown;
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string") return null;
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
}

export function parseCity(raw: RawCity): PlaceResult | null {
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    if (name.length === 0) return null;

    let lat = toNumber(raw.latitude);
    let lng = toNumber(raw.longitude);
    if (lat === null || lng === null) return null;

    // The API ships some rows with latitude/longitude swapped; inside Iran lat < lng
    if (lat > lng) {
        const swapped = lat;
        lat = lng;
        lng = swapped;
    }

    if (lat < 24 || lat > 41.5 || lng < 43 || lng > 64.5) return null;

    return {
        id: `city|${name}|${lng}|${lat}`,
        title: name,
        location: { lat, lng },
    };
}

export function parseCities(payload: unknown): PlaceResult[] {
    if (!Array.isArray(payload)) return [];
    const seen = new Set<string>();
    const cities: PlaceResult[] = [];
    for (const item of payload) {
        if (item === null || typeof item !== "object") continue;
        const city = parseCity(item as RawCity);
        if (city === null) continue;
        if (seen.has(city.id)) continue;
        seen.add(city.id);
        cities.push(city);
    }
    return cities;
}

/** Tolerant matching: Arabic/Persian letter variants, diacritics, tatweel and ZWNJ are normalized */
export function normalizePersian(text: string): string {
    return text
        .toLowerCase()
        .replace(/[\u064A\u0649\u06D2]/g, "ی")
        .replace(/\u0643/g, "ک")
        .replace(/[\u0623\u0625\u0622\u0671]/g, "ا")
        .replace(/\u0629/g, "ه")
        .replace(/[\u064B-\u0652\u0670]/g, "")
        .replace(/\u0640/g, "")
        .replace(/[\u200C\u200D]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function distanceKm(a: LngLat, b: LngLat): number {
    const meanLat = ((a.lat + b.lat) / 2) * (Math.PI / 180);
    const dLat = (b.lat - a.lat) * 111.32;
    const dLng = (b.lng - a.lng) * 111.32 * Math.cos(meanLat);
    return Math.hypot(dLat, dLng);
}

function scoreCity(normalizedName: string, normalizedQuery: string): number {
    if (normalizedName === normalizedQuery) return 100;
    const compactName = normalizedName.replace(/\s+/g, "");
    const compactQuery = normalizedQuery.replace(/\s+/g, "");
    if (normalizedName.startsWith(normalizedQuery) || compactName.startsWith(compactQuery)) {
        return 70;
    }
    if (normalizedName.split(" ").some((word) => word.startsWith(normalizedQuery))) {
        return 50;
    }
    if (normalizedName.includes(normalizedQuery) || compactName.includes(compactQuery)) {
        return 30;
    }
    return 0;
}

export function rankCities(cities: readonly PlaceResult[], term: string, near?: LngLat): PlaceResult[] {
    const query = normalizePersian(term);
    if (query.length === 0) return [];

    interface Scored {
        place: PlaceResult;
        score: number;
        distance: number;
    }
    const scored: Scored[] = [];
    for (const city of cities) {
        const score = scoreCity(normalizePersian(city.title), query);
        if (score === 0) continue;
        scored.push({
            place: city,
            score,
            distance: near ? distanceKm(near, city.location) : 0,
        });
    }

    scored.sort((a, b) => b.score - a.score || a.distance - b.distance || a.place.title.length - b.place.title.length);
    return scored.slice(0, MAX_CITY_RESULTS).map((entry) => entry.place);
}
