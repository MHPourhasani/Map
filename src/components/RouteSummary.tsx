import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, Loader2, RefreshCw, Route } from "lucide-react";
import { Gate, useAccess } from "../access";
import { useT } from "../i18n";
import { useRouteSelection } from "../hooks/useRouteSelection";
import { usePlanner } from "../state/PlannerContext";
import { formatDistance, formatDuration, toFaDigits } from "../utils/format";
import { errorMessage } from "../utils/errors";
import { cn } from "../utils/cn";
import { EndpointDetails } from "./EndpointDetails";
import { RouteLegs } from "./RouteLegs";

export function RouteSummary() {
    const t = useT();
    const { can } = useAccess();
    const canDuration = can("route.duration");
    const reduceMotion = useReducedMotion();
    const { origin, destination, setSelectedRouteIndex } = usePlanner();

    const { routes, activeIndex, active, query: routeQuery } = useRouteSelection();

    if (!origin || !destination) return null;

    const state: "loading" | "error" | "empty" | "ready" = routeQuery.isError
        ? "error"
        : routes.length > 0
          ? "ready"
          : routeQuery.isPending
            ? "loading"
            : "empty";

    const loading = (
        <motion.div
            key="loading"
            className="pm-route-summary__state"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-busy="true"
        >
            <Loader2 className="animate-spin" size={16} aria-hidden="true" />
            <span>{t("route.loading")}</span>
            <span className="pm-skeleton pm-skeleton--line" aria-hidden="true" />
            <span className="pm-skeleton pm-skeleton--line pm-skeleton--short" aria-hidden="true" />
        </motion.div>
    );

    const error = (
        <motion.div
            key="error"
            className="pm-route-summary__state"
            role="alert"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <AlertTriangle size={16} aria-hidden="true" />
            <span>
                <strong>{t("route.error")}</strong>
                <br />
                {routeQuery.error ? errorMessage(routeQuery.error, t) : t("error.unknown")}
            </span>
            <button type="button" className="pm-status-card__action" onClick={() => void routeQuery.refetch()}>
                <RefreshCw size={14} aria-hidden="true" />
                {t("route.retry")}
            </button>
        </motion.div>
    );

    const empty = (
        <motion.div
            key="empty"
            className="pm-route-summary__state"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Route size={16} aria-hidden="true" />
            <span>{t("route.notFound")}</span>
        </motion.div>
    );

    const ready =
        origin !== null && destination !== null && active !== undefined ? (
            <motion.div
                key="ready"
                className="pm-route-summary__body rounded-2xl"
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
            >
                <header className="pm-route-summary__trip">
                    <span className="pm-route-summary__trip-row" dir="auto">
                        <strong>{t("search.origin.label")}:</strong> {origin.title}
                    </span>
                    <span className="pm-route-summary__trip-row" dir="auto">
                        <strong>{t("search.destination.label")}:</strong> {destination.title}
                    </span>
                </header>

                <div className={cn("pm-route-summary__metrics", !canDuration && "is-single")}>
                    <div className="pm-metric">
                        <span className="pm-metric__label">{t("route.distance")}</span>
                        <span className="pm-metric__value" dir="auto">
                            {formatDistance(active.distance)}
                        </span>
                    </div>
                    {canDuration && (
                        <div className="pm-metric">
                            <span className="pm-metric__label">{t("route.duration")}</span>
                            <span className="pm-metric__value" dir="auto">
                                {formatDuration(active.duration)}
                            </span>
                        </div>
                    )}
                </div>

                {routes.length > 1 && (
                    <div className="pm-route-summary__alternatives" role="group" aria-label={t("route.alternatives")}>
                        {routes.map((route, index) => (
                            <button
                                key={route.id}
                                type="button"
                                aria-pressed={index === activeIndex}
                                className={cn("pm-route-chip", index === activeIndex && "is-active")}
                                onClick={() => setSelectedRouteIndex(index)}
                            >
                                <span>{index === 0 ? t("route.primary") : t("route.alternativeNumber", { n: toFaDigits(index + 1) })}</span>
                                <span className="pm-route-chip__meta" dir="auto">
                                    {formatDistance(route.distance)}
                                    {canDuration && ` · ${formatDuration(route.duration)}`}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                <Gate capability="route.endpointDetails">
                    <EndpointDetails origin={origin} destination={destination} />
                </Gate>

                <Gate capability="route.legs">
                    <RouteLegs key={active.id} route={active} />
                </Gate>

                <footer className="pm-route-summary__footer">
                    <span>{t("route.withTraffic")}</span>
                    <span aria-hidden="true">·</span>
                    <span>{t("route.attribution")}</span>
                </footer>
            </motion.div>
        ) : null;

    return (
        <section className="glass pm-route-summary" aria-label={t("route.cardLabel")} aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
                {state === "loading" && loading}
                {state === "error" && error}
                {state === "empty" && empty}
                {state === "ready" && ready}
            </AnimatePresence>
        </section>
    );
}
