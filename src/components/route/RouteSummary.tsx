import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, Loader2, RefreshCw, Route } from "lucide-react";
import { Capability, Gate, useAccess } from "../../access";
import { useActiveRoute } from "../../hooks/useActiveRoute";
import { useT } from "../../i18n";
import { useTrip } from "../../state/TripContext";
import { cn } from "../../utils/cn";
import { errorMessage } from "../../utils/errors";
import { formatDistance, formatDuration, toFaDigits } from "../../utils/format";
import { EndpointDetails } from "./EndpointDetails";
import { RouteLegs } from "./RouteLegs";

function StateCard({ role, busy, children }: { role?: "alert"; busy?: boolean; children: ReactNode }) {
    const reduceMotion = useReducedMotion();
    return (
        <motion.div
            className="pm-route-summary__state"
            role={role}
            aria-busy={busy}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {children}
        </motion.div>
    );
}

/** Card with distance, duration and alternatives of the calculated route; what it shows depends on the access level */
export function RouteSummary() {
    const t = useT();
    const { can } = useAccess();
    const reduceMotion = useReducedMotion();
    const { origin, destination, setSelectedRouteIndex } = useTrip();
    const { query, routes, activeIndex, activeRoute } = useActiveRoute();

    if (origin === null || destination === null) return null;

    const canSeeDuration = can(Capability.ROUTE_DURATION);
    const state = query.isError ? "error" : routes.length > 0 ? "ready" : query.isPending ? "loading" : "empty";

    return (
        <section className="glass pm-route-summary" aria-label={t("route.cardLabel")} aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
                {state === "loading" && (
                    <StateCard key="loading" busy>
                        <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                        <span>{t("route.loading")}</span>
                        <span className="pm-skeleton pm-skeleton--line" aria-hidden="true" />
                        <span className="pm-skeleton pm-skeleton--line pm-skeleton--short" aria-hidden="true" />
                    </StateCard>
                )}

                {state === "error" && (
                    <StateCard key="error" role="alert">
                        <AlertTriangle size={16} aria-hidden="true" />
                        <span>
                            <strong>{t("route.error")}</strong>
                            <br />
                            {errorMessage(query.error, t)}
                        </span>
                        <button type="button" className="pm-status-card__action" onClick={() => void query.refetch()}>
                            <RefreshCw size={14} aria-hidden="true" />
                            {t("route.retry")}
                        </button>
                    </StateCard>
                )}

                {state === "empty" && (
                    <StateCard key="empty">
                        <Route size={16} aria-hidden="true" />
                        <span>{t("route.notFound")}</span>
                    </StateCard>
                )}

                {state === "ready" && activeRoute && (
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

                        <div className={cn("pm-route-summary__metrics", !canSeeDuration && "is-single")}>
                            <div className="pm-metric">
                                <span className="pm-metric__label">{t("route.distance")}</span>
                                <span className="pm-metric__value" dir="auto">
                                    {formatDistance(activeRoute.distance)}
                                </span>
                            </div>
                            {canSeeDuration && (
                                <div className="pm-metric">
                                    <span className="pm-metric__label">{t("route.duration")}</span>
                                    <span className="pm-metric__value" dir="auto">
                                        {formatDuration(activeRoute.duration)}
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
                                        <span>
                                            {index === 0 ? t("route.primary") : t("route.alternativeNumber", { n: toFaDigits(index + 1) })}
                                        </span>
                                        <span className="pm-route-chip__meta" dir="auto">
                                            {formatDistance(route.distance)}
                                            {canSeeDuration && ` · ${formatDuration(route.duration)}`}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <Gate capability={Capability.ROUTE_ENDPOINT_DETAILS}>
                            <EndpointDetails origin={origin} destination={destination} />
                        </Gate>

                        <Gate capability={Capability.ROUTE_LEGS}>
                            <RouteLegs key={activeRoute.id} route={activeRoute} />
                        </Gate>

                        <footer className="pm-route-summary__footer">
                            <span>{t("route.withTraffic")}</span>
                            <span aria-hidden="true">·</span>
                            <span>{t("route.attribution")}</span>
                        </footer>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
