import { ArrowUpDown, CircleDot, MapPin, Navigation, Crosshair } from "lucide-react";
import { Gate } from "../access";
import { useT } from "../i18n";
import { useMapStore } from "../map/MapContext";
import { usePlanner } from "../state/PlannerContext";
import type { SelectedPlace } from "../types/search";
import { prefersReducedMotion } from "../utils/format";
import { IconButton } from "./ui/IconButton";
import { LocationSearchInput } from "./LocationSearchInput";

/** Floating glass panel with origin/destination search (upper-right corner). */
export function SearchPanel() {
    const t = useT();
    const { map } = useMapStore();
    const { origin, destination, setOrigin, setDestination, swapPoints, geolocation } = usePlanner();

    const flyToPlace = (place: SelectedPlace) => {
        if (!map) return;
        map.flyTo({
            center: [place.location.lng, place.location.lat],
            zoom: Math.max(map.getZoom(), 15.5),
            duration: prefersReducedMotion() ? 0 : 1300,
            essential: true,
        });
    };

    const handleOriginSelect = (place: SelectedPlace) => {
        setOrigin(place);
        flyToPlace(place);
    };

    const handleDestinationSelect = (place: SelectedPlace) => {
        setDestination(place);
        flyToPlace(place);
    };

    const useLocationAsOrigin = () => {
        if (!geolocation.fix) return;
        setOrigin({
            id: "user-location",
            title: geolocation.label ?? t("geo.found"),
            location: geolocation.fix.location,
        });
    };

    return (
        <section className="glass pm-search-panel" aria-label={t("app.title")}>
            <header className="pm-search-panel__head">
                <span className="pm-search-panel__brand" aria-hidden="true">
                    <Navigation size={15} strokeWidth={2.4} />
                </span>
                <span className="pm-search-panel__titles">
                    <strong>{t("app.title")}</strong>
                    <span>{t("app.tagline")}</span>
                </span>
            </header>

            <div className="pm-search-panel__fields">
                <span className="pm-search-panel__rail" aria-hidden="true" />
                <LocationSearchInput
                    idPrefix="pm-origin"
                    label={t("search.origin.label")}
                    placeholder={t("search.origin.placeholder")}
                    icon={<CircleDot size={17} aria-hidden="true" />}
                    value={origin}
                    onSelect={handleOriginSelect}
                    onClear={() => setOrigin(null)}
                />
                <LocationSearchInput
                    idPrefix="pm-destination"
                    label={t("search.destination.label")}
                    placeholder={t("search.destination.placeholder")}
                    icon={<MapPin size={17} aria-hidden="true" />}
                    value={destination}
                    onSelect={handleDestinationSelect}
                    onClear={() => setDestination(null)}
                />
                <IconButton className="pm-swap-btn" label={t("search.swap")} onClick={swapPoints}>
                    <ArrowUpDown size={16} aria-hidden="true" />
                </IconButton>
            </div>

            <Gate capability="location.current">
                {geolocation.status === "success" && geolocation.fix && (
                    <button type="button" className="pm-quick-chip" onClick={useLocationAsOrigin}>
                        <Crosshair size={14} aria-hidden="true" />
                        {t("search.useMyLocationAsOrigin")}
                    </button>
                )}
            </Gate>
        </section>
    );
}
