import { LogOut, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccess } from "../access";
import { useT } from "../i18n";
import type { MessageKey } from "../i18n/fa";
import { usePlanner } from "../state/PlannerContext";
import { cn } from "../utils/cn";

/**
 * Shows who is logged in (username + tier) and a logout button. Logout wipes
 * every trip parameter (endpoints, route, location, query caches, URL params)
 * so the next login starts clean.
 */
export function UserBadge() {
    const t = useT();
    const { level, session, logout } = useAccess();
    const { resetTrip } = usePlanner();
    const queryClient = useQueryClient();

    const handleLogout = () => {
        resetTrip();
        queryClient.removeQueries({ queryKey: ["route"] });
        queryClient.removeQueries({ queryKey: ["place-search"] });
        try {
            const next = `${window.location.pathname}${window.location.hash}`;
            const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            if (next !== current) window.history.replaceState(null, "", next);
        } catch {
            // history API may be restricted — the app works anyway
        }
        logout();
    };

    return (
        <div className="pm-access glass" title={t("auth.loggedInAs", { username: session?.username ?? "" })}>
            <ShieldCheck size={16} aria-hidden="true" />
            <span className="pm-access__caption" dir="auto">
                {session?.username}
            </span>
            <strong className={cn("pm-access__badge", `is-${level}`)}>{t(`access.level.${level}` as MessageKey)}</strong>
            <button
                type="button"
                className="pm-icon-btn pm-access__logout"
                onClick={handleLogout}
                title={t("auth.logout")}
                aria-label={t("auth.logout")}
            >
                <LogOut size={15} aria-hidden="true" />
            </button>
        </div>
    );
}
