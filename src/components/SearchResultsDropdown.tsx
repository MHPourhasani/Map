import { useEffect, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Loader2, MapPin, RefreshCw, SearchX, KeyRound } from "lucide-react";
import { useT } from "../i18n";
import type { PlaceResult } from "../types/search";
import { errorMessage } from "../utils/errors";
import { cn } from "../utils/cn";

export interface SearchResultsDropdownProps {
    listboxId: string;
    optionPrefix: string;
    results: PlaceResult[];
    activeIndex: number;
    /** Debounced term is long enough to query. */
    hasQuery: boolean;
    /** Fetch in flight, debouncing, or showing previous data. */
    isBusy: boolean;
    /** Query finished with zero results. */
    isEmpty: boolean;
    error: unknown;
    servicesMissing: boolean;
    term: string;
    onHover: (index: number) => void;
    onSelect: (place: PlaceResult) => void;
    onRetry: () => void;
}

/** The floating autocomplete dropdown anchored below a search input. */
export function SearchResultsDropdown({
    listboxId,
    optionPrefix,
    results,
    activeIndex,
    hasQuery,
    isBusy,
    isEmpty,
    error,
    servicesMissing,
    term,
    onHover,
    onSelect,
    onRetry,
}: SearchResultsDropdownProps) {
    const t = useT();
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (activeIndex < 0) return;
        const element = document.getElementById(`${optionPrefix}-${activeIndex}`);
        element?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, optionPrefix]);

    const showList = results.length > 0;

    let status: ReactNode = null;
    if (servicesMissing && !showList) {
        status = (
            <div className="pm-dropdown__status">
                <KeyRound size={16} aria-hidden="true" />
                <span>{t("error.missing_api_key")}</span>
            </div>
        );
    } else if (error && !isBusy) {
        status = (
            <div className="pm-dropdown__status pm-dropdown__status--error" role="alert">
                <span>{errorMessage(error, t)}</span>
                <button type="button" className="pm-link-btn" onClick={onRetry}>
                    <RefreshCw size={13} aria-hidden="true" />
                    {t("search.retry")}
                </button>
            </div>
        );
    } else if (isBusy && !showList) {
        status = (
            <div className="pm-dropdown__status" role="status">
                <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                <span>{isBusy && hasQuery ? t("search.searching") : t("search.searchingHint")}</span>
            </div>
        );
    } else if (isEmpty && !isBusy) {
        status = (
            <div className="pm-dropdown__status">
                <SearchX size={16} aria-hidden="true" />
                <span className="text-center">
                    {t("search.empty", { term })}
                    <br />
                    <span className="text-xs opacity-70">{t("search.emptyHint")}</span>
                </span>
            </div>
        );
    } else if (!hasQuery && !showList) {
        status = (
            <div className="pm-dropdown__status pm-dropdown__status--muted" role="status">
                <span>{t("search.minChars")}</span>
            </div>
        );
    }

    return (
        <motion.div
            id={`${listboxId}-popup`}
            className="pm-dropdown"
            initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
        >
            {showList && (
                <ul
                    id={listboxId}
                    role="listbox"
                    aria-label={t("search.listboxLabel")}
                    className={cn("pm-dropdown__list", isBusy && "is-busy")}
                >
                    {results.map((place, index) => (
                        <li
                            key={place.id}
                            id={`${optionPrefix}-${index}`}
                            role="option"
                            aria-selected={index === activeIndex}
                            className={cn("pm-option", index === activeIndex && "is-active")}
                            onMouseEnter={() => onHover(index)}
                            onPointerDown={(event) => {
                                event.preventDefault();
                                onSelect(place);
                            }}
                        >
                            <span className="pm-option__icon" aria-hidden="true">
                                <MapPin size={16} />
                            </span>
                            <span className="pm-option__body">
                                <span className="pm-option__title" dir="auto">
                                    {place.title}
                                </span>
                                {(place.address || place.locality) && (
                                    <span className="pm-option__subtitle" dir="auto">
                                        {[place.address, place.locality].filter(Boolean).join("، ")}
                                    </span>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            {status}
        </motion.div>
    );
}
