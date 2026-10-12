import { useEffect, useState } from "react";

/** Tracks a CSS media query; initialized synchronously to avoid a first-paint flash. */
export function useMediaQuery(query: string) {
    const [value, setValue] = useState(
        () => typeof window !== "undefined" && window.matchMedia(query).matches,
    );

    useEffect(() => {
        const result = matchMedia(query);
        const onChange = (event: MediaQueryListEvent) => setValue(event.matches);
        setValue(result.matches);
        result.addEventListener("change", onChange);
        return () => result.removeEventListener("change", onChange);
    }, [query]);

    return value;
}
