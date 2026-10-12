import { QueryClient } from "@tanstack/react-query";
import { isProviderError } from "./types/provider";

function isAborted(error: unknown): boolean {
    if (error instanceof DOMException) return error.name === "AbortError";
    if (error !== null && typeof error === "object" && "name" in error) return (error as { name?: unknown }).name === "AbortError";
    return false;
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                if (isAborted(error)) return false;
                if (!isProviderError(error)) return failureCount < 1;
                if (error.code === "network") return failureCount < 2;
                if (error.code === "timeout") return failureCount < 1;
                return false;
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
    },
});

