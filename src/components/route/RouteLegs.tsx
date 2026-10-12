import { useState } from "react";
import { ChevronDown, LocateFixed } from "lucide-react";
import { useT } from "../../i18n";
import { useMapStore } from "../../map/MapContext";
import type { Route, RouteLeg, RouteStep } from "../../types/route";
import { cn } from "../../utils/cn";
import { formatDistance, formatDuration, toFaDigits } from "../../utils/format";
import { maneuverLabel } from "../../utils/maneuver";
import { animationDuration } from "../../utils/motion";
import { DetailRow } from "../ui/DetailRow";

function StepItem({ step, index, isLast }: { step: RouteStep; index: number; isLast: boolean }) {
    const t = useT();
    const { map } = useMapStore();
    const [open, setOpen] = useState(false);
    const panelId = `pm-step-${index}-${step.start?.lng ?? "x"}`;
    const { start } = step;

    const showOnMap = () => {
        if (!map || !start) return;
        map.flyTo({
            center: [start.lng, start.lat],
            zoom: Math.max(map.getZoom(), 14),
            duration: animationDuration(900),
            essential: true,
        });
    };

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
                        {step.instruction ?? step.name ?? t("legs.step", { n: toFaDigits(index + 1) })}
                    </span>
                    <span className="pm-step__meta" dir="auto">
                        {formatDistance(step.distance)} · {formatDuration(step.duration)}
                    </span>
                </button>

                {open && (
                    <div id={panelId} className="pm-step__panel">
                        <dl className="pm-kv">
                            {step.instruction && <DetailRow label={t("step.instruction")}>{step.instruction}</DetailRow>}
                            {step.name && <DetailRow label={t("step.street")}>{step.name}</DetailRow>}
                            {step.type && <DetailRow label={t("step.type")}>{maneuverLabel("type", step.type, t)}</DetailRow>}
                            {step.modifier && (
                                <DetailRow label={t("step.modifier")}>{maneuverLabel("modifier", step.modifier, t)}</DetailRow>
                            )}
                            {step.bearingAfter !== undefined && (
                                <DetailRow label={t("step.bearing")}>{`${toFaDigits(step.bearingAfter)}°`}</DetailRow>
                            )}
                            {step.rotaryName && <DetailRow label={t("step.rotary")}>{step.rotaryName}</DetailRow>}
                            {step.exit !== undefined && <DetailRow label={t("step.exit")}>{toFaDigits(step.exit)}</DetailRow>}
                            <DetailRow
                                label={t("legs.distance")}
                            >{`${formatDistance(step.distance)} (${toFaDigits(step.distance.value)} m)`}</DetailRow>
                            <DetailRow
                                label={t("legs.duration")}
                            >{`${formatDuration(step.duration)} (${toFaDigits(step.duration.value)} s)`}</DetailRow>
                            {start && (
                                <DetailRow label={t("step.start")}>{`${toFaDigits(start.lng)} ، ${toFaDigits(start.lat)}`}</DetailRow>
                            )}
                            <DetailRow label={t("step.points")}>{toFaDigits(step.pointCount)}</DetailRow>
                        </dl>
                        {step.polyline && (
                            <details className="pm-raw">
                                <summary>{t("step.polyline")}</summary>
                                <code dir="ltr">{step.polyline}</code>
                            </details>
                        )}
                        {start && (
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
                    {leg.steps.map((step, stepIndex) => (
                        <StepItem key={stepIndex} step={step} index={stepIndex} isLast={stepIndex === leg.steps.length - 1} />
                    ))}
                </ol>
            )}
        </li>
    );
}

/** Turn-by-turn accordion. Mount it with `key={route.id}` so the open leg resets per route */
export function RouteLegs({ route }: { route: Route }) {
    const t = useT();
    const [openLeg, setOpenLeg] = useState<number | null>(null);

    return (
        <section className="pm-legs" aria-label={t("legs.title")}>
            <h3 className="pm-legs__title">{t("legs.title")}</h3>
            <dl className="pm-kv pm-legs__overview">
                {route.summary && <DetailRow label={t("legs.routeSummary")}>{route.summary}</DetailRow>}
                <DetailRow label={t("legs.overviewPoints")}>{toFaDigits(route.geometry.length)}</DetailRow>
            </dl>
            {route.overviewPolyline && (
                <details className="pm-raw">
                    <summary>{t("legs.overviewPolyline")}</summary>
                    <code dir="ltr">{route.overviewPolyline}</code>
                </details>
            )}
            <ul className="pm-legs__list">
                {route.legs.map((leg, index) => (
                    <LegItem
                        key={index}
                        leg={leg}
                        index={index}
                        open={openLeg === index}
                        onToggle={() => setOpenLeg(openLeg === index ? null : index)}
                    />
                ))}
            </ul>
        </section>
    );
}
