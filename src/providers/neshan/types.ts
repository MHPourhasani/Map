/**
 * Raw (untrusted) Neshan response shapes. Endpoints: search `v3/search`,
 * direction `v4/direction`, reverse `v5/reverse`. Every field is optional (the
 * API may evolve); the mappers validate all of it before it reaches the UI.
 */

export interface NeshanMeasure {
    value?: number;
    text?: string;
}

export interface NeshanSearchItem {
    title?: string;
    address?: string;
    neighbourhood?: string;
    region?: string;
    category?: string;
    type?: string;
    location?: { x?: number; y?: number };
    poiHash?: string;
}

export interface NeshanSearchResponse {
    count?: number;
    items?: NeshanSearchItem[];
}

export interface NeshanStep {
    name?: string;
    instruction?: string;
    type?: string;
    modifier?: string;
    bearing_after?: number;
    rotaryName?: string;
    exit?: number;
    distance?: NeshanMeasure;
    duration?: NeshanMeasure;
    /** Encoded polyline of the step geometry (precision 5). */
    polyline?: string;
    /** [longitude, latitude] */
    start_location?: [number, number];
}

export interface NeshanLeg {
    summary?: string;
    distance?: NeshanMeasure;
    duration?: NeshanMeasure;
    steps?: NeshanStep[];
}

export interface NeshanRoute {
    distance?: NeshanMeasure;
    duration?: NeshanMeasure;
    summary?: string;
    alternative?: boolean;
    overview_polyline?: { points?: string };
    legs?: NeshanLeg[];
}

export interface NeshanDirectionResponse {
    routes?: NeshanRoute[];
    status?: string;
}

export interface NeshanReverseResponse {
    status?: string;
    formatted_address?: string;
    route_name?: string;
    neighbourhood?: string | null;
    city?: string | null;
    state?: string | null;
    place?: string | null;
}

export interface NeshanErrorBody {
    status?: number | string;
    code?: number | string;
    message?: string;
    error?: string;
}
