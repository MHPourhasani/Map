import { useGeolocation } from "../state/GeolocationContext";
import { useTrip } from "../state/TripContext";
import { useT } from "../i18n";
import { useAddressLabel } from "./useAddressLabel";

/** Returns a function that sets the device position as the origin, or null while there is no position yet */
export function useCurrentLocationAsOrigin(): (() => void) | null {
    const t = useT();
    const { fix } = useGeolocation();
    const { setOrigin } = useTrip();
    const label = useAddressLabel(fix?.location);

    if (!fix) return null;
    return () => setOrigin({ id: "user-location", title: label ?? t("geo.found"), location: fix.location });
}
