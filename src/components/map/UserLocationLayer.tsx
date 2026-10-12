import { useEffect } from "react";
import maplibregl, { type GeoJSONSource } from "maplibre-gl";
import { useGeolocation } from "../../state/GeolocationContext";
import { useMapStore } from "../../map/MapContext";
import type { Position } from "../../types/geo";
import { circlePolygon } from "../../utils/geo";

const ACCURACY_SOURCE = "pm-user-accuracy";
const ACCURACY_FILL = "pm-user-accuracy-fill";
const ACCURACY_STROKE = "pm-user-accuracy-stroke";

interface AccuracyCollection {
    type: "FeatureCollection";
    features: Array<{ type: "Feature"; properties: Record<string, never>; geometry: { type: "Polygon"; coordinates: Position[][] } }>;
}

function createUserMarkerElement(): HTMLDivElement {
    const element = document.createElement("div");
    element.className = "pm-user-marker";
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", "موقعیت فعلی شما");

    const pulse = document.createElement("span");
    pulse.className = "pm-user-marker__pulse";
    const dot = document.createElement("span");
    dot.className = "pm-user-marker__dot";
    element.append(pulse, dot);
    return element;
}

/** Shows the device position: a pulsing dot plus a translucent circle for the reported accuracy */
export function UserLocationLayer() {
    const { map, styleVersion } = useMapStore();
    const { fix } = useGeolocation();

    // A DOM marker survives basemap swaps
    useEffect(() => {
        if (!map || !fix) return;
        const marker = new maplibregl.Marker({ element: createUserMarkerElement() })
            .setLngLat([fix.location.lng, fix.location.lat])
            .addTo(map);
        return () => {
            marker.remove();
        };
    }, [map, fix]);

    // Style layers are lost on a basemap swap, so they are re-added after each style load
    useEffect(() => {
        if (!map || !map.isStyleLoaded()) return;

        const data: AccuracyCollection = {
            type: "FeatureCollection",
            features:
                fix && fix.accuracy > 0
                    ? [
                          {
                              type: "Feature",
                              properties: {},
                              geometry: { type: "Polygon", coordinates: [circlePolygon(fix.location, fix.accuracy)] },
                          },
                      ]
                    : [],
        };

        const source = map.getSource<GeoJSONSource>(ACCURACY_SOURCE);
        if (source) source.setData(data);
        else map.addSource(ACCURACY_SOURCE, { type: "geojson", data });

        if (!map.getLayer(ACCURACY_FILL)) {
            map.addLayer({
                id: ACCURACY_FILL,
                type: "fill",
                source: ACCURACY_SOURCE,
                paint: { "fill-color": "#2563eb", "fill-opacity": 0.14 },
            });
        }
        if (!map.getLayer(ACCURACY_STROKE)) {
            map.addLayer({
                id: ACCURACY_STROKE,
                type: "line",
                source: ACCURACY_SOURCE,
                paint: { "line-color": "#2563eb", "line-width": 1.5, "line-opacity": 0.55 },
            });
        }
    }, [map, fix, styleVersion]);

    return null;
}
