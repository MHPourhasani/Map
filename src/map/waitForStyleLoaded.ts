import type { MapInstance } from "./MapContext";

/**
 * Waits until the map's (new) style is fully loaded after `setStyle`.
 * MapLibre does not re-emit `load` on style swaps, so we poll
 * `isStyleLoaded()` — bounded by a timeout so callers never hang.
 */
export function waitForStyleLoaded(map: MapInstance, timeoutMs = 12_000): Promise<void> {
    return new Promise((resolve) => {
        if (map.isStyleLoaded()) {
            resolve();
            return;
        }
        const startedAt = Date.now();
        let timer = 0;
        const tick = () => {
            if (map.isStyleLoaded() || Date.now() - startedAt >= timeoutMs) {
                window.clearTimeout(timer);
                resolve();
                return;
            }
            timer = window.setTimeout(tick, 80);
        };
        timer = window.setTimeout(tick, 80);
    });
}
