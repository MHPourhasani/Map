import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import { useT } from "../i18n";
import { useMapStore, type MarkerInstance } from "../map/MapContext";
import { usePlanner } from "../state/PlannerContext";
import type { SelectedPlace } from "../types/search";

function createEndpointElement(className: string, ariaLabel: string): HTMLDivElement {
    const element = document.createElement("div");
    element.className = `pm-endpoint-marker ${className}`;
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", ariaLabel);
    element.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5" fill="white" stroke="white"/></svg>`;
    return element;
}

export function EndpointMarkers() {
    const { map } = useMapStore();
    const { origin, destination } = usePlanner();
    const t = useT();

    useEffect(() => {
        if (!map) return;
        const markers: MarkerInstance[] = [];
        const add = (place: SelectedPlace, kind: "origin" | "destination") => {
            const ariaLabel =
                kind === "origin" ? `${t("search.origin.label")}: ${place.title}` : `${t("search.destination.label")}: ${place.title}`;
            const element = createEndpointElement(`pm-endpoint-marker--${kind}`, ariaLabel);
            markers.push(
                new maplibregl.Marker({ element, anchor: "bottom" }).setLngLat([place.location.lng, place.location.lat]).addTo(map),
            );
        };
        if (origin) add(origin, "origin");
        if (destination) add(destination, "destination");
        return () => {
            for (const marker of markers) marker.remove();
        };
    }, [map, origin, destination, t]);

    return null;
}
