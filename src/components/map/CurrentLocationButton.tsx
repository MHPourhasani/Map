import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Crosshair, Loader2, MapPinCheck, X } from "lucide-react";
import { useAddressLabel } from "../../hooks/useAddressLabel";
import { useCurrentLocationAsOrigin } from "../../hooks/useCurrentLocationAsOrigin";
import { useT } from "../../i18n";
import type { MessageKey } from "../../i18n/fa";
import { useMapStore } from "../../map/MapContext";
import type { GeolocationErrorCode, PositionFix } from "../../services/geolocation";
import { useGeolocation } from "../../state/GeolocationContext";
import { toFaDigits } from "../../utils/format";
import { animationDuration } from "../../utils/motion";
import { IconButton } from "../ui/IconButton";

const ERROR_MESSAGE_KEYS: Record<GeolocationErrorCode, MessageKey> = {
    permission_denied: "geo.error.permission_denied",
    unavailable: "geo.error.unavailable",
    timeout: "geo.error.timeout",
    unsupported: "geo.error.unsupported",
    insecure: "geo.error.insecure",
    unknown: "geo.error.unknown",
};

const ERROR_AUTO_DISMISS_MS = 8000;

/** Locate button: asks for the device position, centers the map on it and offers to use it as the origin */
export function CurrentLocationButton() {
    const t = useT();
    const reduceMotion = useReducedMotion();
    const { map } = useMapStore();
    const { status, fix, errorCode, requestLocation, resetGeolocation } = useGeolocation();
    const address = useAddressLabel(fix?.location);
    const setCurrentLocationAsOrigin = useCurrentLocationAsOrigin();

    // The popover opens for each new fix and stays closed once the user dismisses that fix
    const [dismissedFix, setDismissedFix] = useState<PositionFix | null>(null);
    const popoverOpen = fix !== undefined && fix !== dismissedFix;

    useEffect(() => {
        if (!map || !fix) return;
        map.easeTo({
            center: [fix.location.lng, fix.location.lat],
            zoom: Math.max(map.getZoom(), 15),
            duration: animationDuration(900),
            essential: true,
        });
    }, [map, fix]);

    // Errors clear themselves so a stale message never lingers
    useEffect(() => {
        if (status !== "error") return;
        const timer = window.setTimeout(resetGeolocation, ERROR_AUTO_DISMISS_MS);
        return () => window.clearTimeout(timer);
    }, [status, resetGeolocation]);

    const isLocating = status === "locating";

    return (
        <div className="pm-geolocation">
            <AnimatePresence>
                {status === "error" && (
                    <motion.div
                        className="glass pm-geo-message"
                        role="alert"
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18 }}
                    >
                        {t(ERROR_MESSAGE_KEYS[errorCode ?? "unknown"])}
                    </motion.div>
                )}
                {popoverOpen && (
                    <motion.div
                        className="glass pm-geo-popover"
                        initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                    >
                        <div className="pm-geo-popover__head">
                            <strong>{t("geo.found")}</strong>
                            <button
                                type="button"
                                className="pm-field__clear"
                                aria-label={t("geo.close")}
                                title={t("geo.close")}
                                onClick={() => setDismissedFix(fix)}
                            >
                                <X size={14} aria-hidden="true" />
                            </button>
                        </div>
                        {address && (
                            <p className="pm-geo-popover__address" dir="auto">
                                {address}
                            </p>
                        )}
                        {fix.accuracy > 0 && (
                            <p className="pm-geo-popover__accuracy">
                                {t("geo.accuracy", { meters: toFaDigits(Math.round(fix.accuracy)) })}
                            </p>
                        )}
                        <button
                            type="button"
                            className="pm-geo-popover__action"
                            onClick={() => {
                                setCurrentLocationAsOrigin?.();
                                setDismissedFix(fix);
                            }}
                        >
                            <MapPinCheck size={15} aria-hidden="true" />
                            {t("geo.setOrigin")}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <IconButton
                className="pm-geolocation__btn"
                label={isLocating ? t("geo.locating") : t("geo.button")}
                aria-busy={isLocating}
                onClick={() => {
                    if (!isLocating) requestLocation();
                }}
            >
                {isLocating ? (
                    <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                ) : (
                    <Crosshair size={20} aria-hidden="true" style={{ color: status === "success" ? "#2563eb" : undefined }} />
                )}
            </IconButton>
        </div>
    );
}
