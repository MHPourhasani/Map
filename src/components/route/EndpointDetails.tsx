import { useT } from "../../i18n";
import type { SelectedPlace } from "../../types/place";
import { toFaDigits } from "../../utils/format";
import { DetailRow } from "../ui/DetailRow";

function PlaceDetails({ heading, place }: { heading: string; place: SelectedPlace }) {
    const t = useT();
    return (
        <section className="pm-details__place">
            <h3>{heading}</h3>
            <dl className="pm-kv">
                <DetailRow label={t("details.name")}>{place.title}</DetailRow>
                {place.address && <DetailRow label={t("details.address")}>{place.address}</DetailRow>}
                {place.locality && <DetailRow label={t("details.locality")}>{place.locality}</DetailRow>}
                {place.category && <DetailRow label={t("details.category")}>{place.category}</DetailRow>}
                <DetailRow label={t("details.id")}>{place.id}</DetailRow>
                <DetailRow label={t("details.lng")}>{toFaDigits(place.location.lng)}</DetailRow>
                <DetailRow label={t("details.lat")}>{toFaDigits(place.location.lat)}</DetailRow>
            </dl>
        </section>
    );
}

export function EndpointDetails({ origin, destination }: { origin: SelectedPlace; destination: SelectedPlace }) {
    const t = useT();
    return (
        <section className="pm-details" aria-label={t("details.title")}>
            <PlaceDetails heading={t("search.origin.label")} place={origin} />
            <PlaceDetails heading={t("search.destination.label")} place={destination} />
        </section>
    );
}
