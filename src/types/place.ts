import type { LngLat } from "./geo";

export interface PlaceResult {
    id: string;
    title: string;
    address?: string;
    locality?: string;
    category?: string;
    location: LngLat;
}

export type SelectedPlace = PlaceResult;

export interface SearchRequest {
    term: string;
    near?: LngLat;
}

export interface ReverseResult {
    formattedAddress: string;
    city?: string;
    state?: string;
    neighbourhood?: string;
}
