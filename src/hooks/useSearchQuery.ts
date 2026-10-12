import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMapStore } from "../map/MapContext";
import { services } from "../providers/registry";
import { DEFAULT_SEARCH_CENTER } from "../types/geo";
import { useDebouncedValue } from "./useDebouncedValue";

export const MIN_SEARCH_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 350;

/**
 * Place autocomplete. Requests start once typing pauses, only for long enough terms, results are
 * cached for 5 minutes, and an outdated request is cancelled. Previous results stay on screen
 * while the next ones load. The map center is read at request time, so panning never re-renders.
 */
export function useSearchQuery(term: string, enabled: boolean) {
    const { map } = useMapStore();
    const debouncedTerm = useDebouncedValue(term.trim(), SEARCH_DEBOUNCE_MS);

    const query = useQuery({
        queryKey: ["place-search", debouncedTerm],
        queryFn: ({ signal }) => services.search.search({ term: debouncedTerm, near: map?.getCenter() ?? DEFAULT_SEARCH_CENTER }, signal),
        enabled: enabled && debouncedTerm.length >= MIN_SEARCH_CHARS,
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
