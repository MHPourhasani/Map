import { ACCESS_LEVEL_ORDER, AccessLevel, Capability } from "./enums";

export { AccessLevel, Capability } from "./enums";
export const DEFAULT_ACCESS_LEVEL = AccessLevel.BASIC;

/** Each tier adds capabilities; users inherit capabilities from lower tiers. */
export const CAPABILITY_MATRIX: Record<AccessLevel, readonly Capability[]> = {
    [AccessLevel.BASIC]: [Capability.MAP_VIEW, Capability.PLACES_SELECT, Capability.ROUTE_SUMMARY, Capability.ROUTE_ENDPOINT_DETAILS],
    [AccessLevel.STANDARD]: [Capability.MAP_CONTROLS, Capability.CURRENT_LOCATION, Capability.ROUTE_DURATION],
    [AccessLevel.VIP]: [Capability.ROUTE_LEGS],
};

export function isAccessLevel(value: unknown): value is AccessLevel {
    return typeof value === "string" && ACCESS_LEVEL_ORDER.includes(value as AccessLevel);
}

export function capabilitiesOf(level: AccessLevel): ReadonlySet<Capability> {
    const rank = ACCESS_LEVEL_ORDER.indexOf(level);
    return new Set(ACCESS_LEVEL_ORDER.slice(0, rank + 1).flatMap((tier) => CAPABILITY_MATRIX[tier]));
}

export function hasCapability(level: AccessLevel, capability: Capability): boolean {
    return capabilitiesOf(level).has(capability);
}
