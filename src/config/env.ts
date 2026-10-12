/**
 * Central access point for public (VITE_*) env config. Every VITE_* value is
 * baked into the browser bundle and is therefore public — always restrict
 * Neshan keys by domain in their panel. The key only feeds REST data (routing,
 * optional Neshan search, reverse geocode); the basemap is key-less OSM.
 */

function read(name: keyof ImportMetaEnv): string | undefined {
    const value = import.meta.env[name];
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export interface AppEnv {
    /** Key for REST APIs (search / direction / reverse). */
    readonly neshanMapKey?: string;
    /** Key for REST APIs (search / direction / reverse). */
    readonly neshanApiKey?: string;
    /** Active search backend ('cities' is key-less, 'neshan' needs an API key). */
    readonly searchProvider: "cities" | "neshan";
}

const mapKey = read("VITE_NESHAN_MAP_KEY");
const apiKey = read("VITE_NESHAN_API_KEY");
const searchProvider = read("VITE_SEARCH_PROVIDER");

export const env: AppEnv = {
    neshanMapKey: mapKey,
    neshanApiKey: apiKey ?? mapKey,
    searchProvider: searchProvider === "neshan" ? "neshan" : "cities",
};

export const hasApiKey = Boolean(env.neshanApiKey);
