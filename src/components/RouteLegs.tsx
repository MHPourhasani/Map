import { useState } from "react";
import { ChevronDown, LocateFixed } from "lucide-react";
import { useT } from "../i18n";
import { useMapStore } from "../map/MapContext";
import type { Route, RouteLeg, RouteStep } from "../types/route";
import { formatDistance, formatDuration, prefersReducedMotion, toFaDigits } from "../utils/format";
import { maneuverLabel } from "../utils/maneuver";
import { cn } from "../utils/cn";

function Field({ label, children }: { label: string; children: string }) {
    return (
        <>
            <dt>{label}</dt>
            <dd dir="auto">{children}</dd>
        </>
    );
}

/** One step: a timeline node + a collapsible panel with every provider field. */
function StepItem({ step, index, isLast }: { step: RouteStep; index: number; isLast: boolean }) {
    const t = useT();
    const { map } = useMapStore();
    const [open, setOpen] = useState(false);
    const panelId = `pm-step-${index}-${step.start?.lng ?? "x"}`;

    const showOnMap = () => {
        if (!map || !step.start) return;
        map.flyTo({
            center: [step.start.lng, step.start.lat],
            zoom: Math.max(map.getZoom(), 14),
            duration: prefersReducedMotion() ? 0 : 900,
            essential: true,
        });
    };

    const title = step.instruction ?? step.name ?? t("legs.step", { n: toFaDigits(index + 1) });

    return (
        <li className={cn("pm-step", isLast && "is-last")}>
            <span className="pm-step__node" aria-hidden="true">
                {toFaDigits(index + 1)}
            </span>
            <div className="pm-step__main">
                <button
                    type="button"
                    className="pm-step__head"
                    aria-expanded={open}
                    aria-controls={panelId}
                    title={t("step.expand")}
                    onClick={() => setOpen((value) => !value)}
                >
                    <span className="pm-step__title" dir="auto">
                        {title}
                    </span>
                    <span className="pm-step__meta" dir="auto">
                        {formatDistance(step.distance)} · {formatDuration(step.duration)}
                    </span>
                </button>

                {open && (
                    <div id={panelId} className="pm-step__panel">
                        <dl className="pm-kv">
                            {step.instruction && <Field label={t("step.instruction")}>{step.instruction}</Field>}
                            {step.name && <Field label={t("step.street")}>{step.name}</Field>}
                            {step.type && <Field label={t("step.type")}>{maneuverLabel("type", step.type, t)}</Field>}
                            {step.modifier && <Field label={t("step.modifier")}>{maneuverLabel("modifier", step.modifier, t)}</Field>}
                            {step.bearingAfter !== undefined && (
                                <Field label={t("step.bearing")}>{`${toFaDigits(step.bearingAfter)}°`}</Field>
                            )}
                            {step.rotaryName && <Field label={t("step.rotary")}>{step.rotaryName}</Field>}
                            {step.exit !== undefined && <Field label={t("step.exit")}>{toFaDigits(step.exit)}</Field>}
                            <Field
                                label={t("legs.distance")}
                            >{`${formatDistance(step.distance)} (${toFaDigits(step.distance.value)} m)`}</Field>
                            <Field
                                label={t("legs.duration")}
                            >{`${formatDuration(step.duration)} (${toFaDigits(step.duration.value)} s)`}</Field>
                            {step.start && (
                                <Field label={t("step.start")}>{`${toFaDigits(step.start.lng)} ، ${toFaDigits(step.start.lat)}`}</Field>
                            )}
                            <Field label={t("step.points")}>{toFaDigits(step.pointCount)}</Field>
                        </dl>
                        {step.polyline && (
                            <details className="pm-raw">
                                <summary>{t("step.polyline")}</summary>
                                <code dir="ltr">{step.polyline}</code>
                            </details>
                        )}
                        {step.start && (
                            <button type="button" className="pm-step__locate" onClick={showOnMap}>
                                <LocateFixed size={14} aria-hidden="true" />
                                {t("step.showOnMap")}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
}

function LegItem({ leg, index, open, onToggle }: { leg: RouteLeg; index: number; open: boolean; onToggle: () => void }) {
    const t = useT();
    const panelId = `pm-leg-${index}`;
    return (
        <li className="pm-leg">
            <button type="button" className="pm-leg__head" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
                <span className="pm-leg__titles">
                    <strong>{t("legs.leg", { n: toFaDigits(index + 1) })}</strong>
                    <span dir="auto">
                        {formatDistance(leg.distance)} · {formatDuration(leg.duration)} ·{" "}
                        {t("legs.stepsCount", { count: toFaDigits(leg.steps.length) })}
                    </span>
                    {leg.summary && (
                        <span className="pm-leg__summary" dir="auto">
                            {t("legs.summary")}: {leg.summary}
                        </span>
                    )}
                </span>
                <ChevronDown size={16} aria-hidden="true" className={cn("pm-chevron", open && "is-open")} />
            </button>
            {open && (
                <ol id={panelId} className="pm-steps">
                    {leg.steps.map((step, i) => (
                        <StepItem key={i} step={step} index={i} isLast={i === leg.steps.length - 1} />
                    ))}
                </ol>
            )}
        </li>
    );
}

/**
 * VIP: the route's legs as an accordion. Opening a leg reveals its steps as a
 * connected timeline (step 1 → step 2 → …); each step expands to show every
 * field the provider returned. Remount with `key={route.id}` per route.
 */
export function RouteLegs({ route }: { route: Route }) {
    const t = useT();
    const [openLeg, setOpenLeg] = useState<number | null>(null);

    return (
        <section className="pm-legs" aria-label={t("legs.title")}>
            <h3 className="pm-legs__title">{t("legs.title")}</h3>
            <dl className="pm-kv pm-legs__overview">
                {route.summary && <Field label={t("legs.routeSummary")}>{route.summary}</Field>}
                <Field label={t("legs.overviewPoints")}>{toFaDigits(route.geometry.length)}</Field>
            </dl>
            {route.overviewPolyline && (
                <details className="pm-raw">
                    <summary>{t("legs.overviewPolyline")}</summary>
                    <code dir="ltr">{route.overviewPolyline}</code>
                </details>
            )}
            <ul className="pm-legs__list">
                {route.legs.map((leg, i) => (
                    <LegItem key={i} leg={leg} index={i} open={openLeg === i} onToggle={() => setOpenLeg(openLeg === i ? null : i)} />
                ))}
            </ul>
        </section>
    );
}
