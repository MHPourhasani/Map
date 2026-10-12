import { useState } from "react";
import { ChevronDown, ChevronUp, Compass, Frame, Maximize, Moon, Sun, ZoomIn, ZoomOut } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMapOrientation } from "../../hooks/useMapOrientation";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useT } from "../../i18n";
import { fitMapToBounds } from "../../map/camera";
import { useMapStore } from "../../map/MapContext";
import { useTheme } from "../../state/ThemeContext";
import { useTrip } from "../../state/TripContext";
import { INITIAL_VIEW, boundsFromPositions, toPosition } from "../../types/geo";
import { animationDuration } from "../../utils/motion";
import { IconButton } from "../ui/IconButton";

const COMPACT_SCREEN_QUERY = "(max-width: 768px)";
const FIT_PADDING = 110;

/**
 * Zoom / view / theme buttons. The theme (and, on phones, the expand toggle) stay fixed at the
 * bottom while the other buttons slide open above them, so nothing jumps when the panel toggles.
 */
export function MapControls() {
    const t = useT();
    const reduceMotion = useReducedMotion();
    const isCompact = useMediaQuery(COMPACT_SCREEN_QUERY);
    const { map } = useMapStore();
    const { origin, destination } = useTrip();
    const { theme, toggleTheme } = useTheme();
    const { bearing, pitch } = useMapOrientation();
    const [expanded, setExpanded] = useState(false);

    const isNorthUp = bearing === 0 && pitch === 0;
    const points = [origin, destination].filter((place) => place !== null).map((place) => place.location);
    const hasPoints = points.length > 0;
    // Wide screens always show the whole panel; phones follow the toggle
    const open = !isCompact || expanded;

    const resetView = () => {
        map?.easeTo({
            center: [INITIAL_VIEW.center.lng, INITIAL_VIEW.center.lat],
            zoom: INITIAL_VIEW.zoom,
            bearing: 0,
            pitch: 0,
            duration: animationDuration(600),
            essential: true,
        });
    };

    const fitPoints = () => {
        if (!map) return;
        const bounds = boundsFromPositions(points.map(toPosition));
        if (!bounds) return;
        if (points.length === 1) {
            map.easeTo({
                center: [points[0].lng, points[0].lat],
                zoom: Math.max(map.getZoom(), 14),
                duration: animationDuration(600),
                essential: true,
            });
            return;
        }
        fitMapToBounds(map, bounds, FIT_PADDING);
    };

    const resetOrientation = () => {
        map?.easeTo({ bearing: 0, pitch: 0, duration: animationDuration(600), essential: true });
    };

    const fitLabel = hasPoints ? t("controls.fitPoints") : t("controls.fitPointsDisabled");

    return (
        <section
            className="glass relative flex w-fit min-w-10 flex-col gap-1 justify-self-end rounded-2xl p-1"
            role="group"
            aria-label={t("controls.group")}
        >
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        id="pm-controls-panel"
                        className="pm-controls-panel flex flex-col gap-1 overflow-hidden"
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
                    >
                        <IconButton label={t("controls.zoomIn")} disabled={!map} onClick={() => map?.zoomIn()}>
                            <ZoomIn size={18} aria-hidden="true" />
                        </IconButton>
                        <IconButton label={t("controls.zoomOut")} disabled={!map} onClick={() => map?.zoomOut()}>
                            <ZoomOut size={18} aria-hidden="true" />
                        </IconButton>
                        <span className="pm-controls-divider" aria-hidden="true" />
                        <IconButton label={t("controls.resetView")} disabled={!map} onClick={resetView}>
                            <Maximize size={17} aria-hidden="true" />
                        </IconButton>
                        <IconButton label={fitLabel} disabled={!hasPoints} onClick={fitPoints}>
                            <Frame size={17} aria-hidden="true" />
                        </IconButton>
                        <IconButton
                            label={t("controls.compass")}
                            disabled={isNorthUp}
                            onClick={resetOrientation}
                            title={t("controls.compassHint", { bearing: Math.round(bearing) })}
                        >
                            <Compass
                                size={18}
                                aria-hidden="true"
                                style={{
                                    transform: `rotate(${-bearing}deg)`,
                                    opacity: isNorthUp ? 0.45 : 1,
                                    transition: "transform 0.2s ease-out",
                                }}
                            />
                        </IconButton>
                    </motion.div>
                )}
            </AnimatePresence>

            <IconButton
                label={theme === "dark" ? t("controls.themeToLight") : t("controls.themeToDark")}
                active={theme === "dark"}
                onClick={toggleTheme}
            >
                {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
            </IconButton>

            {isCompact && (
                <IconButton
                    label={open ? t("controls.collapse") : t("controls.expand")}
                    aria-expanded={open}
                    aria-controls="pm-controls-panel"
                    onClick={() => setExpanded((value) => !value)}
                >
                    {open ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}
                </IconButton>
            )}
        </section>
    );
}
