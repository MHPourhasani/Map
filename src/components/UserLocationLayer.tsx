import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import { useMapStore, type MarkerInstance } from "../map/MapContext";
import { usePlanner } from "../state/PlannerContext";
import { circlePolygon } from "../utils/geo";
import type { Position } from "../types/geo";

const ACCURACY_SOURCE = "pm-user-accuracy";
const ACCURACY_FILL = "pm-user-accuracy-fill";
const ACCURACY_STROKE = "pm-user-accuracy-stroke";

type AccuracyCollection = {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        properties: Record<string, never>;
        geometry: { type: "Polygon"; coordinates: Position[][] };
    }>;
};

const EMPTY: AccuracyCollection = {
    type: "FeatureCollection",
    features: [],
};

export function UserLocationLayer() {
    const { map, styleVersion } = useMapStore();
    const { geolocation } = usePlanner();
    const fix = geolocation.status === "success" ? geolocation.fix : undefined;

    useEffect(() => {
        if (!map || !fix) return;
        const element = document.createElement("div");
        element.className = "pm-user-marker";
        const pulse = document.createElement("span");
        pulse.className = "pm-user-marker__pulse";
        const dot = document.createElement("span");
        dot.className = "pm-user-marker__dot";
        element.append(pulse, dot);
        element.setAttribute("role", "img");
        element.setAttribute("aria-label", "موقعیت فعلی شما");

        const marker: MarkerInstance = new maplibregl.Marker({ element }).setLngLat([fix.location.lng, fix.location.lat]).addTo(map);
        return () => {
            marker.remove();
        };
    }, [map, fix]);

    useEffect(() => {
        if (!map || !map.isStyleLoaded()) return;

        const data: AccuracyCollection =
            fix && fix.accuracy > 0
                ? {
                      type: "FeatureCollection",
                      features: [
                          {
                              type: "Feature",
                              properties: {},
                              geometry: {
                                  type: "Polygon",
                                  coordinates: [circlePolygon(fix.location, fix.accuracy)],
                              },
                          },
                      ],
                  }
                : EMPTY;

        if (!map.getSource(ACCURACY_SOURCE)) {
            map.addSource(ACCURACY_SOURCE, { type: "geojson", data });
        } else {
            const source = map.getSource(ACCURACY_SOURCE) as { setData: (value: AccuracyCollection) => void } | undefined;
            source?.setData(data);
        }

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
                paint: {
                    "line-color": "#2563eb",
                    "line-width": 1.5,
                    "line-opacity": 0.55,
                },
            });
        }
    }, [map, fix, styleVersion]);

    return null;
}
