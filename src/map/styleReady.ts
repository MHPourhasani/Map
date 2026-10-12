import type { MapInstance } from "./MapContext";

/**
 * Runs `run` once the style accepts changes (`isStyleLoaded()` can stay false for seconds
 * while tiles load), so it polls and listens to events. Returns a cancel function.
 */
export function whenStyleReady(map: MapInstance, run: () => void): () => void {
    if (map.isStyleLoaded()) {
        run();
        return () => {};
    }

    let finished = false;
    const stop = () => {
        window.clearInterval(poll);
        map.off("styledata", check);
        map.off("idle", check);
    };
    const check = () => {
        if (finished || !map.isStyleLoaded()) return;
        finished = true;
        stop();
        run();
    };
    const poll = window.setInterval(check, 200);
    map.on("styledata", check);
    map.on("idle", check);

    return () => {
        if (finished) return;
        finished = true;
        stop();
    };
}

/** Resolves when the style is ready, or after `timeoutMs` so callers never hang */
export function waitForStyleLoaded(map: MapInstance, timeoutMs = 12_000): Promise<void> {
    return new Promise((resolve) => {
        let cancel = () => {};
        const done = () => {
            window.clearTimeout(timer);
            cancel();
            resolve();
        };
        const timer = window.setTimeout(done, timeoutMs);
        cancel = whenStyleReady(map, done);
    });
}
