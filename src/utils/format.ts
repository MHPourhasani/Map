import type { Measure } from "../types/route";
import { fa } from "../i18n/fa";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Converts ASCII digits (and the decimal separator) to Persian equivalents. */
export function toFaDigits(value: string | number): string {
    return String(value)
        .replace(/\d/g, (d) => FA_DIGITS[Number(d)])
        .replace(/\./g, "٫");
}

/**
 * Formats a distance in meters: prefers the provider's own localized label,
 * else derives one from the numeric value (pure unit conversion, no estimate).
 */
export function formatDistance(measure: Measure): string {
    if (measure.text && measure.text.trim().length > 0) return measure.text;
    const meters = measure.value;
    if (!Number.isFinite(meters)) return "—";
    if (meters >= 1000) {
        const km = meters / 1000;
        const rounded = km >= 100 ? Math.round(km) : Math.round(km * 10) / 10;
        return `${toFaDigits(rounded)} ${fa["unit.km"]}`;
    }
    return `${toFaDigits(Math.round(meters))} ${fa["unit.m"]}`;
}

/**
 * Formats a duration in seconds: prefers the provider's label, else derives one
 * from the numeric value (rounding to the nearest minute).
 */
export function formatDuration(measure: Measure): string {
    if (measure.text && measure.text.trim().length > 0) return measure.text;
    const seconds = measure.value;
    if (!Number.isFinite(seconds)) return "—";
    if (seconds < 60) return fa["unit.lessThanMinute"];
    const totalMinutes = Math.round(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${toFaDigits(minutes)} ${fa["unit.minute"]}`;
    if (minutes === 0) return `${toFaDigits(hours)} ${fa["unit.hour"]}`;
    return `${toFaDigits(hours)} ${fa["unit.hour"]} و ${toFaDigits(minutes)} ${fa["unit.minute"]}`;
}

/** True when the user prefers reduced motion (used to disable animations). */
export function prefersReducedMotion(): boolean {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
