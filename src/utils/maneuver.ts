import { fa, type MessageKey } from "../i18n/fa";

type Translate = (key: MessageKey) => string;

/** Localizes a provider maneuver keyword; unknown values pass through verbatim so no data is hidden. */
export function maneuverLabel(kind: "type" | "modifier", value: string, t: Translate): string {
    const key = `maneuver.${kind}.${value}`;
    return key in fa ? t(key as MessageKey) : value;
}
