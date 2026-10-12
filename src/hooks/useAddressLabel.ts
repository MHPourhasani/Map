import { skipToken, useQuery } from "@tanstack/react-query";
import { hasNeshanApiKey } from "../config/env";
import { services } from "../providers/registry";
import type { LngLat } from "../types/geo";

/** Street address of a point, when a reverse-geocoding key is configured (best effort) */
export function useAddressLabel(location: LngLat | undefined): string | undefined {
    const { data } = useQuery({
        queryKey: ["reverse-geocode", location?.lng, location?.lat],
        queryFn: location && hasNeshanApiKey ? ({ signal }) => services.reverse.reverseGeocode(location, signal) : skipToken,
        retry: false,
        staleTime: Infinity,
    });
    return data?.formattedAddress || undefined;
}
