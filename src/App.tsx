import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AccessProvider, Gate, useAccess, Capability } from "./access";
import { LoginPage } from "./components/auth/LoginPage";
import { UserBadge } from "./components/auth/UserBadge";
import { CurrentLocationButton } from "./components/map/CurrentLocationButton";
import { EndpointMarkers } from "./components/map/EndpointMarkers";
import { MapControls } from "./components/map/MapControls";
import { MapStatusOverlay } from "./components/map/MapStatusOverlay";
import { MapView } from "./components/map/MapView";
import { RouteLayer } from "./components/map/RouteLayer";
import { UserLocationLayer } from "./components/map/UserLocationLayer";
import { RouteSummary } from "./components/route/RouteSummary";
import { SearchPanel } from "./components/search/SearchPanel";
import { I18nProvider } from "./i18n";
import { MapProvider } from "./map/MapContext";
import { queryClient } from "./queryClient";
import { GeolocationProvider, useGeolocation } from "./state/GeolocationContext";
import { ThemeProvider } from "./state/ThemeContext";
import { TripProvider } from "./state/TripContext";

function AppProviders({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <I18nProvider>
                <AccessProvider>
                    <ThemeProvider>
                        <TripProvider>
                            <GeolocationProvider>
                                <MapProvider>{children}</MapProvider>
                            </GeolocationProvider>
                        </TripProvider>
                    </ThemeProvider>
                </AccessProvider>
            </I18nProvider>
        </QueryClientProvider>
    );
}

function AppShell() {
    const { can, isAuthenticated } = useAccess();
    const { resetGeolocation } = useGeolocation();

    // Losing the location capability (e.g. on logout) also drops the stored position
    const canLocate = can(Capability.CURRENT_LOCATION);
    useEffect(() => {
        if (!canLocate) resetGeolocation();
    }, [canLocate, resetGeolocation]);

    if (!isAuthenticated) return <LoginPage />;

    return (
        <div className="pm-shell">
            <Gate capability={Capability.MAP_VIEW}>
                <MapView />
                <EndpointMarkers />
                <RouteLayer />
            </Gate>
            <Gate capability={Capability.CURRENT_LOCATION}>
                <UserLocationLayer />
            </Gate>

            <div className="pm-overlay">
                <Gate capability={Capability.PLACES_SELECT}>
                    <div className="pm-area pm-area--search">
                        <SearchPanel />
                    </div>
                </Gate>
                <div className="pm-area pm-area--access">
                    <UserBadge />
                </div>
                <Gate capability={Capability.MAP_CONTROLS}>
                    <div className="pm-area pm-area--controls">
                        <MapControls />
                    </div>
                </Gate>
                <Gate capability={Capability.CURRENT_LOCATION}>
                    <div className="pm-area pm-area--location">
                        <CurrentLocationButton />
                    </div>
                </Gate>
                <Gate capability={Capability.ROUTE_SUMMARY}>
                    <div className="pm-area pm-area--summary rounded-2xl">
                        <RouteSummary />
                    </div>
                </Gate>
            </div>

            <MapStatusOverlay />
        </div>
    );
}

export default function App() {
    return (
        <AppProviders>
            <AppShell />
        </AppProviders>
    );
}
