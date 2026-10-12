/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_NESHAN_API_KEY?: string;
    readonly VITE_NESHAN_MAP_KEY?: string;
    readonly VITE_NESHAN_API_BASE?: string;
    readonly VITE_SEARCH_PROVIDER?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
