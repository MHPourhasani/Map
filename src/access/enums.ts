/** Access tiers are ordered from least to most privileged. */
export enum AccessLevel {
    BASIC = "basic",
    STANDARD = "standard",
    VIP = "vip",
}

/** Feature-level permissions. Components should check these, not access tiers. */
export enum Capability {
    MAP_VIEW = "map.view",
    PLACES_SELECT = "places.select",
    ROUTE_SUMMARY = "route.summary",
    ROUTE_ENDPOINT_DETAILS = "route.endpointDetails",
    MAP_CONTROLS = "map.controls",
    CURRENT_LOCATION = "location.current",
    ROUTE_DURATION = "route.duration",
    ROUTE_LEGS = "route.legs",
}

export const ACCESS_LEVEL_ORDER: readonly AccessLevel[] = [AccessLevel.BASIC, AccessLevel.STANDARD, AccessLevel.VIP];
