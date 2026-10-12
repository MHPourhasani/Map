import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useT } from "../../i18n";
import { useMapStore } from "../../map/MapContext";

const LOADING_PILL_DELAY_MS = 400;

/** A retryable error card, or a loading pill (after a short delay, to avoid flicker) while the first style loads */
export function MapStatusOverlay() {
    const t = useT();
    const { ready, error, reload } = useMapStore();
    const [delayPassed, setDelayPassed] = useState(false);

    useEffect(() => {
        if (ready || error || delayPassed) return;
        const timer = window.setTimeout(() => setDelayPassed(true), LOADING_PILL_DELAY_MS);
        return () => window.clearTimeout(timer);
    }, [ready, error, delayPassed]);

    if (error) {
        return (
            <div className="pm-status-backdrop pm-status-backdrop--soft">
                <div className="glass pm-status-card" role="alert">
                    <span className="pm-status-card__icon pm-status-card__icon--error" aria-hidden="true">
                        <AlertTriangle size={22} />
                    </span>
                    <h1>{t("status.mapError.title")}</h1>
                    <p>{t("status.mapError.body")}</p>
                    <button type="button" className="pm-status-card__action" onClick={reload}>
                        <RefreshCw size={15} aria-hidden="true" />
                        {t("status.mapError.retry")}
                    </button>
                </div>
            </div>
        );
    }

    if (!ready && delayPassed) {
        return (
            <div className="pm-status-backdrop pm-status-backdrop--transparent">
                <div className="glass pm-status-loading" role="status">
                    <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                    <span>{t("status.mapLoading")}</span>
                </div>
            </div>
        );
    }

    return null;
}
