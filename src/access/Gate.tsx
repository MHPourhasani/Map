import type { ReactNode } from "react";
import type { Capability } from "./model";
import { useAccess } from "./AccessContext";

/** Renders `children` only when the current level has `capability` */
export function Gate({ capability, children, fallback = null }: { capability: Capability; children: ReactNode; fallback?: ReactNode }) {
    const { can } = useAccess();
    return <>{can(capability) ? children : fallback}</>;
}
