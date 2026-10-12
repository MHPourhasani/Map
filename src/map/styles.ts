import type { StyleSpecification } from "maplibre-gl";

export type MapTheme = "light" | "dark";

/** Dark mode is the same OSM tiles, dimmed and desaturated via raster paint */
const PAINT = {
    light: {
        "raster-opacity": 1,
    },
    dark: {
        "raster-opacity": 1,
        "raster-brightness-min": 0.32,
        "raster-brightness-max": 0.6,
        "raster-saturation": -0.72,
        "raster-contrast": -0.05,
    },
} as const satisfies Record<MapTheme, Record<string, number>>;

export const BASEMAP_HOSTS: readonly string[] = ["tile.openstreetmap.org"];

export function styleFor(theme: MapTheme): StyleSpecification {
    return {
        version: 8,
        sources: {
            osm: {
                type: "raster",
                tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                maxzoom: 19,
            },
        },
        layers: [{ id: "osm-tiles", type: "raster", source: "osm", paint: PAINT[theme] }],
    };
}
