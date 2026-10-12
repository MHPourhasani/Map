import { useEffect, useRef, type RefObject } from "react";

/**
 * Invokes `handler` when a pointer event happens outside `ref`.
 * Listens on the capture phase so inner handlers still run first.
 */
export function useClickOutside<T extends HTMLElement>(ref: RefObject<T | null>, handler: () => void, active: boolean): void {
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!active) return;
        const onPointerDown = (event: Event) => {
            const element = ref.current;
            if (!element) return;
            if (event.target instanceof Node && !element.contains(event.target)) {
                handlerRef.current();
            }
        };
        document.addEventListener("pointerdown", onPointerDown, true);
        return () => document.removeEventListener("pointerdown", onPointerDown, true);
    }, [ref, active]);
}
