"use client";

import { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import Geofences from "./Geofences";
import VehicleTrails from "./VehicleTrails";
import VehicleMarkers from "./VehicleMarkers";
import LayerControls from "./LayerControls";
import Sidebar from "./Sidebar";

export default function Map() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        if (mapRef.current) return;
        if (!mapContainerRef.current) return;

        mapRef.current = new maplibregl.Map({
            container: mapContainerRef.current,
            style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
            center: [77.5946, 12.9716],
            zoom: 11,
        });

        mapRef.current.on("load", () => {
            setMapReady(true);
        });

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);

    return (
        <div className="flex flex-1 overflow-hidden">
            <Sidebar map={mapRef.current} />
            <div ref={mapContainerRef} className="flex-1 relative">
                {mapReady && (
                    <>
                        <Geofences map={mapRef.current} />
                        <VehicleTrails map={mapRef.current} />
                        <VehicleMarkers map={mapRef.current} />
                        <LayerControls map={mapRef.current} />
                    </>
                )}
            </div>
        </div>
    );
}
