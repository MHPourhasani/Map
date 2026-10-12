/**
 * Access rules — pure data + functions (no React/storage); the single source of
 * truth for "who sees what". UI asks for a capability (`can('route.legs')`),
 * never a level; to change a tier's entitlements, edit CAPABILITY_MATRIX.
 */

/** Ordered least → most privileged. */
export const ACCESS_LEVELS = ["basic", "standard", "vip"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export const DEFAULT_ACCESS_LEVEL: AccessLevel = "basic";

export type Capability =
    // basic (every logged-in tier)
    | "map.view"
    | "places.select"
    | "route.summary"
    | "route.endpointDetails"
    // standard
    | "map.controls"
    | "location.current"
    | "route.duration"
    // vip
    | "route.legs";

export const CAPABILITY_MATRIX: Record<AccessLevel, readonly Capability[]> = {
    basic: ["map.view", "places.select", "route.summary", "route.endpointDetails"],
    standard: ["map.controls", "location.current", "route.duration"],
    vip: ["route.legs"],
};

export function isAccessLevel(value: unknown): value is AccessLevel {
    return typeof value === "string" && (ACCESS_LEVELS as readonly string[]).includes(value);
}

export function capabilitiesOf(level: AccessLevel): ReadonlySet<Capability> {
    const rank = ACCESS_LEVELS.indexOf(level);
    return new Set(ACCESS_LEVELS.slice(0, rank + 1).flatMap((l) => CAPABILITY_MATRIX[l]));
}

export function hasCapability(level: AccessLevel, capability: Capability): boolean {
    return capabilitiesOf(level).has(capability);
}
