import { ArrowUpDown, CircleDot, Crosshair, MapPin, Navigation } from "lucide-react";
import { Capability, Gate } from "../../access";
import { useCurrentLocationAsOrigin } from "../../hooks/useCurrentLocationAsOrigin";
import { useT } from "../../i18n";
import { useMapStore } from "../../map/MapContext";
import { useTrip } from "../../state/TripContext";
import type { SelectedPlace } from "../../types/place";
import { animationDuration } from "../../utils/motion";
import { IconButton } from "../ui/IconButton";
import { LocationSearchInput } from "./LocationSearchInput";

/** Floating panel with the origin and destination search fields */
export function SearchPanel() {
    const t = useT();
    const { map } = useMapStore();
    const { origin, destination, setOrigin, setDestination, swapPoints } = useTrip();
    const setCurrentLocationAsOrigin = useCurrentLocationAsOrigin();

    const flyToPlace = ({ location }: SelectedPlace) => {
        map?.flyTo({
            center: [location.lng, location.lat],
            zoom: Math.max(map.getZoom(), 15.5),
            duration: animationDuration(1300),
            essential: true,
        });
    };

    const selectOrigin = (place: SelectedPlace) => {
        setOrigin(place);
        flyToPlace(place);
    };

    const selectDestination = (place: SelectedPlace) => {
        setDestination(place);
        flyToPlace(place);
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
                    onSelect={selectOrigin}
                    onClear={() => setOrigin(null)}
                />
                <LocationSearchInput
                    idPrefix="pm-destination"
                    label={t("search.destination.label")}
                    placeholder={t("search.destination.placeholder")}
                    icon={<MapPin size={17} aria-hidden="true" />}
                    value={destination}
                    onSelect={selectDestination}
                    onClear={() => setDestination(null)}
                />
                <IconButton className="pm-swap-btn" label={t("search.swap")} onClick={swapPoints}>
                    <ArrowUpDown size={16} aria-hidden="true" />
                </IconButton>
            </div>

            <Gate capability={Capability.CURRENT_LOCATION}>
                {setCurrentLocationAsOrigin && (
                    <button type="button" className="pm-quick-chip" onClick={setCurrentLocationAsOrigin}>
                        <Crosshair size={14} aria-hidden="true" />
                        {t("search.useMyLocationAsOrigin")}
                    </button>
                )}
            </Gate>
        </section>
    );
}
