import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useT } from "../i18n";
import { useClickOutside } from "../hooks/useClickOutside";
import { MIN_SEARCH_CHARS, useSearchQuery } from "../hooks/useSearchQuery";
import { useMapCenter } from "../map/MapContext";
import { serviceAvailability } from "../providers/registry";
import type { PlaceResult, SelectedPlace } from "../types/search";
import { SearchResultsDropdown } from "./SearchResultsDropdown";

export interface LocationSearchInputProps {
    /** Stable DOM id prefix ("pm-origin" / "pm-destination"). */
    idPrefix: string;
    label: string;
    placeholder: string;
    icon: ReactNode;
    value: SelectedPlace | null;
    /** Called when the user picks a suggestion. */
    onSelect: (place: PlaceResult) => void;
    /** Called when the user removes the current selection. */
    onClear: () => void;
}

/**
 * ARIA combobox with debounced (350 ms), cancellable, cached autocomplete.
 * Arrow keys navigate, Enter selects, Escape/click-outside close, and editing
 * after a selection invalidates it (which also drops the calculated route).
 */
export function LocationSearchInput({ idPrefix, label, placeholder, icon, value, onSelect, onClear }: LocationSearchInputProps) {
    const t = useT();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [text, setText] = useState(value?.title ?? "");
    const [focused, setFocused] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const center = useMapCenter();

    const valueId = value?.id ?? null;
    const lastSyncedIdRef = useRef(valueId);
    const selfClearedRef = useRef(false);

    useEffect(() => {
        if (valueId === lastSyncedIdRef.current) return;
        lastSyncedIdRef.current = valueId;
        if (selfClearedRef.current && valueId === null) {
            // The user is typing — keep their in-progress text untouched.
            selfClearedRef.current = false;
            return;
        }
        selfClearedRef.current = false;
        setText(value?.title ?? "");
        setActiveIndex(-1);
    }, [valueId, value?.title]);

    const trimmed = text.trim();
    const selectionMatchesText = value !== null && trimmed === value.title.trim();
    const termOk = trimmed.length >= MIN_SEARCH_CHARS;
    const canQuery = termOk && !selectionMatchesText && serviceAvailability.search;

    const { results, isDebouncing, debouncedTerm, query } = useSearchQuery(text, center, canQuery);

    const hasQuery = debouncedTerm.length >= MIN_SEARCH_CHARS && !selectionMatchesText;
    const isBusy = isDebouncing || query.isFetching || query.isPlaceholderData;
    const isEmpty = hasQuery && !isBusy && !query.isError && results.length === 0;

    const canOpen = focused && termOk && !selectionMatchesText && !dismissed;
    const visible = canOpen && (isBusy || query.isError || results.length > 0 || isEmpty || !serviceAvailability.search);

    useClickOutside(wrapperRef, () => setDismissed(true), visible);

    // Derived highlight index — clamped to the current result set without
    // needing an effect (the raw index may briefly point past a shrinking list).
    const effectiveActiveIndex = results.length === 0 ? -1 : Math.min(activeIndex, results.length - 1);

    const select = (place: PlaceResult) => {
        selfClearedRef.current = false;
        setText(place.title);
        setActiveIndex(-1);
        setDismissed(true);
        onSelect(place);
    };

    const clear = () => {
        selfClearedRef.current = false;
        setText("");
        setActiveIndex(-1);
        setDismissed(true);
        onClear();
        inputRef.current?.focus();
    };

    const handleInput = (event: { target: { value: string } }) => {
        const next = event.target.value;
        setText(next);
        setActiveIndex(-1);
        setDismissed(false);
        if (value) {
            selfClearedRef.current = true;
            onClear();
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
            case "ArrowDown": {
                event.preventDefault();
                if (dismissed) setDismissed(false);
                setActiveIndex((current) => (results.length === 0 ? -1 : Math.min(current + 1, results.length - 1)));
                break;
            }
            case "ArrowUp": {
                event.preventDefault();
                setActiveIndex((current) => Math.max(current - 1, 0));
                break;
            }
            case "Enter": {
                if (!visible) break;
                event.preventDefault();
                const place = effectiveActiveIndex >= 0 ? results[effectiveActiveIndex] : (results[0] ?? undefined);
                if (place) select(place);
                break;
            }
            case "Escape": {
                if (!dismissed) {
                    event.preventDefault();
                    setDismissed(true);
                    setActiveIndex(-1);
                }
                break;
            }
            case "Tab": {
                setDismissed(true);
                break;
            }
            default:
                break;
        }
    };

    const inputId = `${idPrefix}-input`;
    const listboxId = `${idPrefix}-listbox`;

    return (
        <div className="pm-field" ref={wrapperRef}>
            <label className="sr-only" htmlFor={inputId}>
                {label}
            </label>
            <span className="pm-field__icon" aria-hidden="true">
                {icon}
            </span>
            <input
                ref={inputRef}
                id={inputId}
                className="pm-field__input"
                type="text"
                dir="auto"
                role="combobox"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-expanded={visible}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-label={label}
                aria-activedescendant={visible && effectiveActiveIndex >= 0 ? `${idPrefix}-option-${effectiveActiveIndex}` : undefined}
                placeholder={placeholder}
                value={text}
                onChange={handleInput}
                onFocus={() => {
                    setFocused(true);
                    setDismissed(false);
                }}
                onBlur={(event) => {
                    if (!wrapperRef.current?.contains(event.relatedTarget)) {
                        setFocused(false);
                        setDismissed(true);
                    }
                }}
                onKeyDown={handleKeyDown}
            />
            {text.length > 0 && (
                <button type="button" className="pm-field__clear" aria-label={t("search.clear")} title={t("search.clear")} onClick={clear}>
                    <X size={15} aria-hidden="true" />
                </button>
            )}
            <AnimatePresence>
                {visible && (
                    <SearchResultsDropdown
                        listboxId={listboxId}
                        optionPrefix={`${idPrefix}-option`}
                        results={results}
                        activeIndex={effectiveActiveIndex}
                        hasQuery={hasQuery}
                        isBusy={isBusy}
                        isEmpty={isEmpty}
                        error={query.error}
                        servicesMissing={!serviceAvailability.search}
                        term={trimmed}
                        onHover={setActiveIndex}
                        onSelect={select}
                        onRetry={() => void query.refetch()}
                    />
                )}
            </AnimatePresence>
            <span className="sr-only" aria-live="polite">
                {visible && isBusy ? t("search.searching") : ""}
            </span>
        </div>
    );
}
