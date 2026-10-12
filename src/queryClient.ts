import { QueryClient } from "@tanstack/react-query";
import { isProviderError } from "./providers/providerError";

function shouldRetry(failureCount: number, error: unknown): boolean {
    if (!isProviderError(error)) return failureCount < 1;
    if (error.code === "network") return failureCount < 2;
    if (error.code === "timeout") return failureCount < 1;
    return false;
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: shouldRetry,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
    },
});
