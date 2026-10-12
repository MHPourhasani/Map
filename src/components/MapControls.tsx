import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Compass, Frame, Maximize, Moon, Sun, ZoomIn, ZoomOut } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useT } from "../i18n";
import { useMapStore } from "../map/MapContext";
import { usePlanner } from "../state/PlannerContext";
import { INITIAL_VIEW } from "../types/geo";
import { prefersReducedMotion } from "../utils/format";
import { IconButton } from "./ui/IconButton";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { DeviceSizeEnum } from "../types/enums";

/** Glass map-control cluster: a fixed bottom handle (theme, plus the expand toggle on phones) with a zoom/view panel that animates open upward from it — so toggling never shifts the handle and behaves identically on every screen size. */
export function MapControls() {
    const t = useT();
    const isCompact = useMediaQuery(DeviceSizeEnum.TABLET);
    const { map } = useMapStore();
    const { origin, destination, theme, setTheme } = usePlanner();
    const [bearing, setBearing] = useState(0);
    const [pitch, setPitch] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (!map) return;
        const update = () => {
            setBearing(map.getBearing());
            setPitch(map.getPitch());
        };
        update();
        map.on("rotate", update);
        map.on("pitch", update);
        return () => {
            map.off("rotate", update);
            map.off("pitch", update);
        };
    }, [map]);

    const duration = prefersReducedMotion() ? 0 : 600;
    const hasAnyPoint = origin !== null || destination !== null;

    const resetView = () => {
        map?.easeTo({
            center: [INITIAL_VIEW.center.lng, INITIAL_VIEW.center.lat],
            zoom: INITIAL_VIEW.zoom,
            bearing: 0,
            pitch: 0,
            duration,
            essential: true,
        });
    };

    const fitPoints = () => {
        if (!map) return;
        const points = [origin, destination]
            .filter((point): point is NonNullable<typeof point> => point !== null)
            .map((point) => point.location);
        if (points.length === 0) return;
        if (points.length === 1) {
            map.easeTo({
                center: [points[0].lng, points[0].lat],
                zoom: Math.max(map.getZoom(), 14),
                duration,
                essential: true,
            });
            return;
        }
        const lngs = points.map((point) => point.lng);
        const lats = points.map((point) => point.lat);
        map.fitBounds(
            [
                [Math.min(...lngs), Math.min(...lats)],
                [Math.max(...lngs), Math.max(...lats)],
            ],
            {
                padding: window.innerWidth < 768 ? 60 : 110,
                maxZoom: 16,
                duration: prefersReducedMotion() ? 0 : 900,
                essential: true,
            },
        );
    };

    const resetBearing = () => {
        map?.easeTo({ bearing: 0, pitch: 0, duration, essential: true });
    };

    const open = !isCompact || expanded;

    return (
        <section
            className="glass relative flex w-fit min-w-10 flex-col gap-1 rounded-2xl p-1 justify-self-end"
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
                        <IconButton
                            label={hasAnyPoint ? t("controls.fitPoints") : t("controls.fitPointsDisabled")}
                            disabled={!hasAnyPoint}
                            onClick={fitPoints}
                            title={hasAnyPoint ? t("controls.fitPoints") : t("controls.fitPointsDisabled")}
                        >
                            <Frame size={17} aria-hidden="true" />
                        </IconButton>
                        <IconButton
                            label={t("controls.compass")}
                            disabled={bearing === 0 && pitch === 0}
                            onClick={resetBearing}
                            title={t("controls.compassHint", {
                                bearing: Math.round(bearing),
                            })}
                        >
                            <Compass
                                size={18}
                                aria-hidden="true"
                                style={{
                                    transform: `rotate(${-bearing}deg)`,
                                    opacity: bearing === 0 && pitch === 0 ? 0.45 : 1,
                                    transition: "transform 0.2s ease-out",
                                }}
                            />
                        </IconButton>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fixed bottom handle — theme is always visible; the toggle is
                phones-only. It stays put while the panel above animates open. */}
            <IconButton
                label={theme === "dark" ? t("controls.themeToLight") : t("controls.themeToDark")}
                active={theme === "dark"}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
                {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
            </IconButton>

            {isCompact && (
                <IconButton
                    label={open ? t("controls.collapse") : t("controls.expand")}
                    aria-expanded={open}
                    aria-controls="pm-controls-panel"
                    onClick={() => setExpanded((prev) => !prev)}
                >
                    {open ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}
                </IconButton>
            )}
        </section>
    );
}
