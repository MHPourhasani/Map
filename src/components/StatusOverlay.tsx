import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useT } from "../i18n";
import { useMapStore } from "../map/MapContext";
import { cn } from "../utils/cn";

export function StatusOverlay() {
    const t = useT();
    const { ready, error, reload } = useMapStore();
    const [delayPassed, setDelayPassed] = useState(false);

    useEffect(() => {
        if (ready || error || delayPassed) return;
        const timer = window.setTimeout(() => setDelayPassed(true), 400);
        return () => window.clearTimeout(timer);
    }, [ready, error, delayPassed]);

    const showLoading = !ready && !error && delayPassed;

    if (error) {
        return (
            <div className="pm-status-backdrop pm-status-backdrop--soft">
                <div className="glass pm-status-card" role="alert">
                    <span className={cn("pm-status-card__icon", "pm-status-card__icon--error")} aria-hidden="true">
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

    if (!ready && showLoading) {
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
