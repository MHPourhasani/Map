import { LogOut, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccess } from "../../access";
import { useT } from "../../i18n";
import { useGeolocation } from "../../state/GeolocationContext";
import { useTrip } from "../../state/TripContext";
import { cn } from "../../utils/cn";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";

/** Shows the signed-in user and tier. Logging out also wipes the trip, location and cached results */
export function UserBadge() {
    const t = useT();
    const queryClient = useQueryClient();
    const { level, session, logout } = useAccess();
    const { resetTrip } = useTrip();
    const { resetGeolocation } = useGeolocation();

    const handleLogout = () => {
        resetTrip();
        resetGeolocation();
        queryClient.clear();
        logout();
    };

    return (
        <div className="pm-access glass" title={t("auth.loggedInAs", { username: session?.username ?? "" })}>
            <ShieldCheck size={16} aria-hidden="true" />
            <span className="pm-access__caption" dir="auto">
                {session?.username}
            </span>
            <strong className={cn("pm-access__badge", `is-${level}`)}>{t(`access.level.${level}`)}</strong>
            <LanguageSwitcher />
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
