export const AccessLevel = {
    BASIC: "basic",
    STANDARD: "standard",
    VIP: "vip",
} as const;
export type AccessLevel = (typeof AccessLevel)[keyof typeof AccessLevel];

export const Capability = {
    MAP_VIEW: "map.view",
    PLACES_SELECT: "places.select",
    ROUTE_SUMMARY: "route.summary",
    ROUTE_ENDPOINT_DETAILS: "route.endpointDetails",
    MAP_CONTROLS: "map.controls",
    CURRENT_LOCATION: "location.current",
    ROUTE_DURATION: "route.duration",
    ROUTE_LEGS: "route.legs",
} as const;
export type Capability = (typeof Capability)[keyof typeof Capability];

export const ACCESS_LEVEL_ORDER: readonly AccessLevel[] = [AccessLevel.BASIC, AccessLevel.STANDARD, AccessLevel.VIP];
