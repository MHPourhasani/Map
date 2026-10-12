import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AccessProvider, Gate, useAccess } from "./access";
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

/** Full-screen map with the UI floating above it; every block is shown by capability, never by level */
function AppShell() {
    const { can, isAuthenticated } = useAccess();
    const { resetGeolocation } = useGeolocation();

    // Losing the location capability (e.g. on logout) also drops the stored position
    const canLocate = can("location.current");
    useEffect(() => {
        if (!canLocate) resetGeolocation();
    }, [canLocate, resetGeolocation]);

    if (!isAuthenticated) return <LoginPage />;

    return (
        <div className="pm-shell">
            <Gate capability="map.view">
                <MapView />
                <EndpointMarkers />
                <RouteLayer />
            </Gate>
            <Gate capability="location.current">
                <UserLocationLayer />
            </Gate>

            <div className="pm-overlay">
                <Gate capability="places.select">
                    <div className="pm-area pm-area--search">
                        <SearchPanel />
                    </div>
                </Gate>
                <div className="pm-area pm-area--access">
                    <UserBadge />
                </div>
                <Gate capability="map.controls">
                    <div className="pm-area pm-area--controls">
                        <MapControls />
                    </div>
                </Gate>
                <Gate capability="location.current">
                    <div className="pm-area pm-area--location">
                        <CurrentLocationButton />
                    </div>
                </Gate>
                <Gate capability="route.summary">
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
