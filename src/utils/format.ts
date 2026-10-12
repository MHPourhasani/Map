import { fa } from "../i18n/fa";
import type { Measure } from "../types/route";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function toFaDigits(value: string | number): string {
    return String(value)
        .replace(/\d/g, (digit) => FA_DIGITS[Number(digit)])
        .replace(/\./g, "٫");
}

function providerLabel({ text }: Measure): string | undefined {
    return text && text.trim().length > 0 ? text : undefined;
}

/** Prefers the provider's own label; otherwise converts meters to a readable Persian string */
export function formatDistance(measure: Measure): string {
    const label = providerLabel(measure);
    if (label) return label;

    const meters = measure.value;
    if (!Number.isFinite(meters)) return "—";
    if (meters < 1000) return `${toFaDigits(Math.round(meters))} ${fa["unit.m"]}`;

    const km = meters / 1000;
    const rounded = km >= 100 ? Math.round(km) : Math.round(km * 10) / 10;
    return `${toFaDigits(rounded)} ${fa["unit.km"]}`;
}

/** Prefers the provider's own label; otherwise converts seconds to hours and minutes */
export function formatDuration(measure: Measure): string {
    const label = providerLabel(measure);
    if (label) return label;

    const seconds = measure.value;
    if (!Number.isFinite(seconds)) return "—";
    if (seconds < 60) return fa["unit.lessThanMinute"];

    const totalMinutes = Math.round(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hoursText = `${toFaDigits(hours)} ${fa["unit.hour"]}`;
    const minutesText = `${toFaDigits(minutes)} ${fa["unit.minute"]}`;

    if (hours === 0) return minutesText;
    if (minutes === 0) return hoursText;
    return `${hoursText} و ${minutesText}`;
}
