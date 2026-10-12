import { useEffect, useEffectEvent, type RefObject } from "react";

/** Calls `onOutsideClick` when a pointer goes down outside `ref`; only listens while `active` */
export function useClickOutside(ref: RefObject<HTMLElement | null>, onOutsideClick: () => void, active: boolean): void {
    const handleOutsideClick = useEffectEvent(onOutsideClick);

    useEffect(() => {
        if (!active) return;
        const onPointerDown = (event: Event) => {
            if (event.target instanceof Node && ref.current && !ref.current.contains(event.target)) handleOutsideClick();
        };
        document.addEventListener("pointerdown", onPointerDown, true);
        return () => document.removeEventListener("pointerdown", onPointerDown, true);
    }, [ref, active]);
}
