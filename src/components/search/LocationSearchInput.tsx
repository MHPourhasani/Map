import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useClickOutside } from "../../hooks/useClickOutside";
import { MIN_SEARCH_CHARS, useSearchQuery } from "../../hooks/useSearchQuery";
import { useT } from "../../i18n";
import type { PlaceResult, SelectedPlace } from "../../types/place";
import { SearchResultsDropdown } from "./SearchResultsDropdown";

interface LocationSearchInputProps {
    /** Prefix of the DOM ids ("pm-origin" / "pm-destination") */
    idPrefix: string;
    label: string;
    placeholder: string;
    icon: ReactNode;
    value: SelectedPlace | null;
    onSelect: (place: PlaceResult) => void;
    onClear: () => void;
}

/** Accessible autocomplete: arrows move, Enter selects, Escape or an outside click closes; editing a selection clears it */
export function LocationSearchInput({ idPrefix, label, placeholder, icon, value, onSelect, onClear }: LocationSearchInputProps) {
    const t = useT();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [text, setText] = useState(value?.title ?? "");
    const [focused, setFocused] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    // Follow selections changed from outside (swap, current location); keep the text while the user types
    const valueId = value?.id ?? null;
    const lastSyncedIdRef = useRef(valueId);
    const clearedByTypingRef = useRef(false);

    useEffect(() => {
        if (valueId === lastSyncedIdRef.current) return;
        lastSyncedIdRef.current = valueId;
        const clearedByTyping = clearedByTypingRef.current;
        clearedByTypingRef.current = false;
        if (clearedByTyping && valueId === null) return;
        setText(value?.title ?? "");
        setActiveIndex(-1);
    }, [valueId, value?.title]);

    const trimmedText = text.trim();
    const selectionMatchesText = value !== null && trimmedText === value.title.trim();
    const hasEnoughChars = trimmedText.length >= MIN_SEARCH_CHARS;

    const { results, isDebouncing, debouncedTerm, query } = useSearchQuery(text, hasEnoughChars && !selectionMatchesText);

    const hasQuery = debouncedTerm.length >= MIN_SEARCH_CHARS && !selectionMatchesText;
    const isBusy = isDebouncing || query.isFetching || query.isPlaceholderData;
    const isEmpty = hasQuery && !isBusy && !query.isError && results.length === 0;

    const canOpen = focused && hasEnoughChars && !selectionMatchesText && !dismissed;
    const visible = canOpen && (isBusy || query.isError || results.length > 0 || isEmpty);

    useClickOutside(wrapperRef, () => setDismissed(true), visible);

    // The raw index can briefly point past a shrinking result list
    const highlightedIndex = results.length === 0 ? -1 : Math.min(activeIndex, results.length - 1);

    const select = (place: PlaceResult) => {
        clearedByTypingRef.current = false;
        setText(place.title);
        setActiveIndex(-1);
        setDismissed(true);
        onSelect(place);
    };

    const clear = () => {
        clearedByTypingRef.current = false;
        setText("");
        setActiveIndex(-1);
        setDismissed(true);
        onClear();
        inputRef.current?.focus();
    };

    const handleChange = (event: { target: { value: string } }) => {
        setText(event.target.value);
        setActiveIndex(-1);
        setDismissed(false);
        if (value) {
            clearedByTypingRef.current = true;
            onClear();
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                if (dismissed) setDismissed(false);
                setActiveIndex((current) => (results.length === 0 ? -1 : Math.min(current + 1, results.length - 1)));
                break;
            case "ArrowUp":
                event.preventDefault();
                setActiveIndex((current) => Math.max(current - 1, 0));
                break;
            case "Enter": {
                if (!visible) break;
                event.preventDefault();
                const place = highlightedIndex >= 0 ? results[highlightedIndex] : results[0];
                if (place) select(place);
                break;
            }
            case "Escape":
                if (!dismissed) {
                    event.preventDefault();
                    setDismissed(true);
                    setActiveIndex(-1);
                }
                break;
            case "Tab":
                setDismissed(true);
                break;
        }
    };

    const listboxId = `${idPrefix}-listbox`;

    return (
        <div className="pm-field" ref={wrapperRef}>
            <label className="sr-only" htmlFor={`${idPrefix}-input`}>
                {label}
            </label>
            <span className="pm-field__icon" aria-hidden="true">
                {icon}
            </span>
            <input
                ref={inputRef}
                id={`${idPrefix}-input`}
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
                aria-activedescendant={visible && highlightedIndex >= 0 ? `${idPrefix}-option-${highlightedIndex}` : undefined}
                placeholder={placeholder}
                value={text}
                onChange={handleChange}
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
                        activeIndex={highlightedIndex}
                        hasQuery={hasQuery}
                        isBusy={isBusy}
                        isEmpty={isEmpty}
                        error={query.error}
                        term={trimmedText}
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
