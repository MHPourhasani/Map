import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Crosshair, Loader2, X, MapPinCheck } from "lucide-react";
import { useT } from "../i18n";
import { useMapStore } from "../map/MapContext";
import { usePlanner } from "../state/PlannerContext";
import { toFaDigits } from "../utils/format";
import type { PositionFix } from "../services/geolocation";
import { IconButton } from "./ui/IconButton";

/**
 * Bottom-right geolocation control: requests a position fix on click, centers
 * the map, shows accuracy, and offers "use as origin" once a fix has arrived.
 */
export function CurrentLocationButton() {
    const t = useT();
    const { map } = useMapStore();
    const { geolocation, requestLocation, resetGeolocation, setOrigin } = usePlanner();
    const reduceMotion = useReducedMotion();

    const { status, fix, errorCode } = geolocation;
    const [dismissedFix, setDismissedFix] = useState<PositionFix | null>(null);
    const popoverOpen = fix !== undefined && fix !== dismissedFix;

    useEffect(() => {
        if (!map || !fix) return;
        map.easeTo({
            center: [fix.location.lng, fix.location.lat],
            zoom: Math.max(map.getZoom(), 15),
            duration: reduceMotion ? 0 : 900,
            essential: true,
        });
    }, [map, fix, reduceMotion]);

    useEffect(() => {
        if (status !== "error") return;
        const timer = window.setTimeout(() => resetGeolocation(), 8000);
        return () => window.clearTimeout(timer);
    }, [status, resetGeolocation]);

    const errorMessageKey =
        errorCode === "permission_denied"
            ? "geo.error.permission_denied"
            : errorCode === "unavailable"
              ? "geo.error.unavailable"
              : errorCode === "timeout"
                ? "geo.error.timeout"
                : errorCode === "unsupported"
                  ? "geo.error.unsupported"
                  : errorCode === "insecure"
                    ? "geo.error.insecure"
                    : "geo.error.unknown";

    const handleUseAsOrigin = () => {
        if (!fix) return;
        setOrigin({
            id: "user-location",
            title: geolocation.label ?? t("geo.found"),
            location: fix.location,
        });
        setDismissedFix(fix);
    };

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
                        {t(errorMessageKey)}
                    </motion.div>
                )}
                {status === "success" && popoverOpen && fix && (
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
                                onClick={() => setDismissedFix(fix ?? null)}
                            >
                                <X size={14} aria-hidden="true" />
                            </button>
                        </div>
                        {geolocation.label && (
                            <p className="pm-geo-popover__address" dir="auto">
                                {geolocation.label}
                            </p>
                        )}
                        {fix.accuracy > 0 && (
                            <p className="pm-geo-popover__accuracy">
                                {t("geo.accuracy", { meters: toFaDigits(Math.round(fix.accuracy)) })}
                            </p>
                        )}
                        <button type="button" className="pm-geo-popover__action" onClick={handleUseAsOrigin}>
                            <MapPinCheck size={15} aria-hidden="true" />
                            {t("geo.setOrigin")}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <IconButton
                className="pm-geolocation__btn"
                label={status === "locating" ? t("geo.locating") : t("geo.button")}
                onClick={() => {
                    if (status === "locating") return;
                    requestLocation();
                }}
                aria-busy={status === "locating"}
            >
                {status === "locating" ? (
                    <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                ) : (
                    <Crosshair
                        size={20}
                        aria-hidden="true"
                        style={{
                            color: status === "success" ? "#2563eb" : undefined,
                        }}
                    />
                )}
            </IconButton>
        </div>
    );
}
