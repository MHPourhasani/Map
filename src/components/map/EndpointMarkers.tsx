import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import { useT } from "../../i18n";
import { useMapStore } from "../../map/MapContext";
import { useTrip } from "../../state/TripContext";
import type { SelectedPlace } from "../../types/place";

type EndpointKind = "origin" | "destination";

const PIN_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" fill="white" stroke="white" />
    </svg>`;

function createPinElement(kind: EndpointKind, ariaLabel: string): HTMLDivElement {
    const element = document.createElement("div");
    element.className = `pm-endpoint-marker pm-endpoint-marker--${kind}`;
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", ariaLabel);
    element.innerHTML = PIN_SVG;
    return element;
}

/** Pins for the chosen origin and destination. They are DOM overlays, so they survive basemap swaps */
export function EndpointMarkers() {
    const t = useT();
    const { map } = useMapStore();
    const { origin, destination } = useTrip();

    useEffect(() => {
        if (!map) return;

        const pins: Array<[EndpointKind, SelectedPlace | null, string]> = [
            ["origin", origin, t("search.origin.label")],
            ["destination", destination, t("search.destination.label")],
        ];
        const markers = pins.flatMap(([kind, place, kindLabel]) =>
            place
                ? [
                      new maplibregl.Marker({ element: createPinElement(kind, `${kindLabel}: ${place.title}`), anchor: "bottom" })
                          .setLngLat([place.location.lng, place.location.lat])
                          .addTo(map),
                  ]
                : [],
        );

        return () => markers.forEach((marker) => marker.remove());
    }, [map, origin, destination, t]);

    return null;
}
