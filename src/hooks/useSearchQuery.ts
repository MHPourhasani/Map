import { useEffect, useRef } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import type { LngLat } from "../types/geo";
import { DEFAULT_SEARCH_CENTER } from "../types/geo";
import type { PlaceResult } from "../types/search";
import { serviceAvailability, services } from "../providers/registry";
import { useDebouncedValue } from "./useDebouncedValue";

export const MIN_SEARCH_CHARS = 2;
export const SEARCH_DEBOUNCE_MS = 350;

export interface SearchQueryState {
    query: UseQueryResult<PlaceResult[], unknown>;
    /** The term currently driving the active query (already debounced). */
    debouncedTerm: string;
    /** True while the input is newer than the debounced term. */
    isDebouncing: boolean;
    results: PlaceResult[];
}

/**
 * Debounced, cached place search. Requests fire 350 ms after typing stops and
 * only for terms with ≥ `MIN_SEARCH_CHARS` chars; obsolete requests are
 * cancelled via React Query's AbortSignal, previous results stay visible
 * (`keepPreviousData`) so the dropdown doesn't flicker, and results cache 5 min.
 */
export function useSearchQuery(term: string, center: LngLat | undefined, enabled: boolean): SearchQueryState {
    const debouncedTerm = useDebouncedValue(term.trim(), SEARCH_DEBOUNCE_MS);
    const centerRef = useRef(center);

    useEffect(() => {
        centerRef.current = center;
    }, [center]);

    const active = enabled && serviceAvailability.search && debouncedTerm.length >= MIN_SEARCH_CHARS;

    const query = useQuery<PlaceResult[]>({
        queryKey: ["place-search", debouncedTerm],
        queryFn: ({ signal }) =>
            services.search.search(
                {
                    term: debouncedTerm,
                    near: centerRef.current ?? DEFAULT_SEARCH_CENTER,
                },
                signal,
            ),
        enabled: active,
        placeholderData: keepPreviousData,
        staleTime: 5 * 60_000,
        gcTime: 10 * 60_000,
    });

    return {
        query,
        debouncedTerm,
        isDebouncing: term.trim() !== debouncedTerm,
        results: query.data ?? [],
    };
}
