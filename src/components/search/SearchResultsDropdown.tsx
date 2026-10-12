import { useEffect, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Loader2, MapPin, RefreshCw, SearchX } from "lucide-react";
import { useT } from "../../i18n";
import type { PlaceResult } from "../../types/place";
import { cn } from "../../utils/cn";
import { errorMessage } from "../../utils/errors";

interface SearchResultsDropdownProps {
    listboxId: string;
    optionPrefix: string;
    results: PlaceResult[];
    activeIndex: number;
    /** The debounced term is long enough to be searched */
    hasQuery: boolean;
    /** Debouncing, fetching, or still showing the previous results */
    isBusy: boolean;
    /** The search finished without results */
    isEmpty: boolean;
    error: unknown;
    term: string;
    onHover: (index: number) => void;
    onSelect: (place: PlaceResult) => void;
    onRetry: () => void;
}

export function SearchResultsDropdown({
    listboxId,
    optionPrefix,
    results,
    activeIndex,
    hasQuery,
    isBusy,
    isEmpty,
    error,
    term,
    onHover,
    onSelect,
    onRetry,
}: SearchResultsDropdownProps) {
    const t = useT();
    const reduceMotion = useReducedMotion();
    const hasResults = results.length > 0;

    useEffect(() => {
        if (activeIndex < 0) return;
        document.getElementById(`${optionPrefix}-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, optionPrefix]);

    let status: ReactNode = null;
    if (error && !isBusy) {
        status = (
            <div className="pm-dropdown__status pm-dropdown__status--error" role="alert">
                <span>{errorMessage(error, t)}</span>
                <button type="button" className="pm-link-btn" onClick={onRetry}>
                    <RefreshCw size={13} aria-hidden="true" />
                    {t("search.retry")}
                </button>
            </div>
        );
    } else if (isBusy && !hasResults) {
        status = (
            <div className="pm-dropdown__status" role="status">
                <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                <span>{hasQuery ? t("search.searching") : t("search.searchingHint")}</span>
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
    } else if (!hasQuery && !hasResults) {
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
            {hasResults && (
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
                                // Keep focus on the input so the selection wins over blur
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
