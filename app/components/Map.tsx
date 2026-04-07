"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import VehicleMarkers from "./VehicleMarkers";

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
            center: [77.5946, 12.9716], // Bangalore [longitude, latitude]
            zoom: 11,
        });

        mapRef.current.on("load", () => {
            setMapReady(true);
        })

        return () => {
            mapRef.current?.remove();
            mapRef.current = null
        }
    }, [])

    return (
        <div ref={mapContainerRef} className="w-full h-full">
            {mapReady && <VehicleMarkers map={mapRef.current} />}
        </div>
    )
}