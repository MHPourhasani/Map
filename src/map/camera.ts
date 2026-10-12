import type { Bounds } from "../types/geo";
import { animationDuration } from "../utils/motion";
import type { MapInstance } from "./MapContext";

const PHONE_MAX_WIDTH = 768;

export function fitMapToBounds(map: MapInstance, bounds: Bounds, desktopPadding: number): void {
    map.fitBounds(
        [
            [bounds.sw.lng, bounds.sw.lat],
            [bounds.ne.lng, bounds.ne.lat],
        ],
        {
            padding: window.innerWidth < PHONE_MAX_WIDTH ? 60 : desktopPadding,
            maxZoom: 16,
            duration: animationDuration(900),
            essential: true,
        },
    );
}
