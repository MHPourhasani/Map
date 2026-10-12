import type { LngLat } from "./geo";

/** A place returned by the search provider (autocomplete result). */
export interface PlaceResult {
    /** Stable identifier supplied by the provider when available. */
    id: string;
    /** Primary display name (may be Persian, Latin or mixed). */
    title: string;
    /** Street / landmark address, when the provider supplies one. */
    address?: string;
    /** City / province / region descriptor, when supplied. */
    locality?: string;
    /** Provider category or place type (e.g. "place", "municipal", "region"). */
    category?: string;
    /** Real coordinates of the place — preserved verbatim from the provider. */
    location: LngLat;
}

/** A place chosen by the user as origin or destination. */
export type SelectedPlace = PlaceResult;

/** Input of the search provider. */
export interface SearchRequest {
    term: string;
    /** Bias point (usually the current map center) — improves relevance. */
    near?: LngLat;
}

/** Result of reverse geocoding a coordinate. */
export interface ReverseResult {
    formattedAddress: string;
    city?: string;
    state?: string;
    neighbourhood?: string;
}
