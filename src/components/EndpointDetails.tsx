import { useT } from "../i18n";
import type { SelectedPlace } from "../types/search";
import { toFaDigits } from "../utils/format";

function Row({ label, children }: { label: string; children: string }) {
    return (
        <>
            <dt>{label}</dt>
            <dd dir="auto">{children}</dd>
        </>
    );
}

function PlaceDetails({ heading, place }: { heading: string; place: SelectedPlace }) {
    const t = useT();
    return (
        <section className="pm-details__place">
            <h3>{heading}</h3>
            <dl className="pm-kv">
                <Row label={t("details.name")}>{place.title}</Row>
                {place.address && <Row label={t("details.address")}>{place.address}</Row>}
                {place.locality && <Row label={t("details.locality")}>{place.locality}</Row>}
                {place.category && <Row label={t("details.category")}>{place.category}</Row>}
                <Row label={t("details.id")}>{place.id}</Row>
                <Row label={t("details.lng")}>{toFaDigits(place.location.lng)}</Row>
                <Row label={t("details.lat")}>{toFaDigits(place.location.lat)}</Row>
            </dl>
        </section>
    );
}

/** VIP: every field we hold about the selected origin and destination. */
export function EndpointDetails({ origin, destination }: { origin: SelectedPlace; destination: SelectedPlace }) {
    const t = useT();
    return (
        <section className="pm-details" aria-label={t("details.title")}>
            <PlaceDetails heading={t("search.origin.label")} place={origin} />
            <PlaceDetails heading={t("search.destination.label")} place={destination} />
        </section>
    );
}
