export const ACCESS_LEVELS = ["basic", "standard", "vip"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export const DEFAULT_ACCESS_LEVEL: AccessLevel = "basic";

export type Capability =
    | "map.view"
    | "places.select"
    | "route.summary"
    | "route.endpointDetails"
    | "map.controls"
    | "location.current"
    | "route.duration"
    | "route.legs";

/** Capabilities each level adds; higher levels inherit every lower level */
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
