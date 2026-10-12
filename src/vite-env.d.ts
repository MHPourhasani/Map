/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Public Neshan web-service key: routing / search / reverse REST APIs. */
    readonly VITE_NESHAN_API_KEY?: string;
    /** Legacy alias of the web-service key (kept for back-compat). */
    readonly VITE_NESHAN_MAP_KEY?: string;
    /**
     * Search backend: 'cities' (default, key-less city list) or 'neshan'
     * (street/POI search; requires VITE_NESHAN_API_KEY + service activation).
     */
    readonly VITE_SEARCH_PROVIDER?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
