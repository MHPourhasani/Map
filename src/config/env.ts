function readEnv(name: keyof ImportMetaEnv): string | undefined {
    const value = import.meta.env[name];
    if (typeof value !== "string") return undefined;
    return value.trim() || undefined;
}

const searchProvider = readEnv("VITE_SEARCH_PROVIDER");

export const env = {
    neshanApiKey: readEnv("VITE_NESHAN_API_KEY") ?? readEnv("VITE_NESHAN_MAP_KEY"),
    neshanApiBase: readEnv("VITE_NESHAN_API_BASE") ?? "https://api.neshan.org",
    searchProvider: searchProvider === "neshan" ? "neshan" : "cities",
} as const;

export const hasNeshanApiKey = env.neshanApiKey !== undefined;
