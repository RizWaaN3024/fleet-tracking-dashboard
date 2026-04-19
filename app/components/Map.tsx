"use client";

import { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import Geofences from "./Geofences";
import VehicleTrails from "./VehicleTrails";
import VehicleMarkers from "./VehicleMarkers";
import LayerControls from "./LayerControls";
import Sidebar from "./Sidebar";
import { useVehicleSocket } from "../hooks/useVehicleSocket";
import AlertsPanel from "./AlertsPanel";
import HistoryTrail from "./HistoryTrail";
import type { HistoryPoint } from "../lib/api";

export default function Map() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [history, setHistory] = useState<HistoryPoint[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { vehicles, status } = useVehicleSocket();

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

    // Tell MapLibre to redraw when layout changes (sidebar toggle on desktop, viewport resize)
    useEffect(() => {
        const handler = () => mapRef.current?.resize();
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    useEffect(() => {
        // short delay lets the sidebar transition finish before resize
        const t = setTimeout(() => mapRef.current?.resize(), 320);
        return () => clearTimeout(t);
    }, [sidebarOpen]);

    function handleHistoryLoaded(h: HistoryPoint[]) {
        setHistory(h);
        // auto-close the sidebar on mobile so the user can see the map
        setSidebarOpen(false);
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <header className="flex items-center gap-3 p-3 sm:p-4 border-b border-gray-800 flex-shrink-0">
                <button
                    onClick={() => setSidebarOpen((p) => !p)}
                    className="md:hidden p-2 -ml-2 rounded hover:bg-gray-800 transition-colors"
                    aria-label="Toggle sidebar"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <h1 className="text-base sm:text-2xl font-bold truncate">Fleet Tracking Dashboard</h1>
            </header>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden relative">
                <Sidebar
                    map={mapRef.current}
                    vehicles={vehicles}
                    status={status}
                    onHistoryLoaded={handleHistoryLoaded}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
                <div ref={mapContainerRef} className="flex-1 relative">
                    {mapReady && (
                        <>
                            <Geofences map={mapRef.current} />
                            <VehicleTrails map={mapRef.current} vehicles={vehicles} />
                            <HistoryTrail map={mapRef.current} history={history} />
                            <VehicleMarkers map={mapRef.current} vehicles={vehicles} />
                            <LayerControls map={mapRef.current} />
                            <AlertsPanel />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
