import { useEffect, useState } from "react";
import { useMapStore } from "../map/MapContext";

/** Current bearing and pitch of the map, in degrees */
export function useMapOrientation(): { bearing: number; pitch: number } {
    const { map } = useMapStore();
    const [orientation, setOrientation] = useState({ bearing: 0, pitch: 0 });

    useEffect(() => {
        if (!map) return;
        const update = () => setOrientation({ bearing: map.getBearing(), pitch: map.getPitch() });
        update();
        map.on("rotate", update);
        map.on("pitch", update);
        return () => {
            map.off("rotate", update);
            map.off("pitch", update);
        };
    }, [map]);

    return orientation;
}
