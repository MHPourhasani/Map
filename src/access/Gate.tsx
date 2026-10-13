import type { ReactNode } from "react";
import { Capability } from "./enums.ts";
import { useAccess } from "./AccessContext";

export function Gate({ capability, children, fallback = null }: { capability: Capability; children: ReactNode; fallback?: ReactNode }) {
    const { can } = useAccess();
    return <>{can(capability) ? children : fallback}</>;
}
