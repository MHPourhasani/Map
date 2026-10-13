import i18n from "i18next";
import type { MessageKey } from "../i18n/fa";

type Translate = (key: MessageKey) => string;

export function maneuverLabel(kind: "type" | "modifier", value: string, t: Translate): string {
    const key = `maneuver.${kind}.${value}`;
    return i18n.exists(key) ? t(key as MessageKey) : value;
}
