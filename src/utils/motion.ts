export function prefersReducedMotion(): boolean {
    return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/** Animation length for map camera moves; zero when the user prefers reduced motion */
export function animationDuration(ms: number): number {
    return prefersReducedMotion() ? 0 : ms;
}
