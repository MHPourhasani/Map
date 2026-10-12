import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { I18nProvider } from "./i18n";
import { AccessProvider, Gate, useAccess } from "./access";
import { PlannerProvider, usePlanner } from "./state/PlannerContext";
import { MapProvider } from "./map/MapContext";
import { MapView } from "./components/MapView";
import { EndpointMarkers } from "./components/EndpointMarkers";
import { RouteLayer } from "./components/RouteLayer";
import { UserLocationLayer } from "./components/UserLocationLayer";
import { SearchPanel } from "./components/SearchPanel";
import { MapControls } from "./components/MapControls";
import { CurrentLocationButton } from "./components/CurrentLocationButton";
import { RouteSummary } from "./components/RouteSummary";
import { StatusOverlay } from "./components/StatusOverlay";
import { LoginPage } from "./components/LoginPage";
import { UserBadge } from "./components/UserBadge";

function AppShell() {
    const { can, isAuthenticated } = useAccess();
    const { resetGeolocation } = usePlanner();

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

            <StatusOverlay />
        </div>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <I18nProvider>
                <AccessProvider>
                    <PlannerProvider>
                        <MapProvider>
                            <AppShell />
                        </MapProvider>
                    </PlannerProvider>
                </AccessProvider>
            </I18nProvider>
        </QueryClientProvider>
    );
}
