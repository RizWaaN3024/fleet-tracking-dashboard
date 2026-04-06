"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

export default function Map() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (mapRef.current) return;
        if (!mapContainerRef.current) return;

        mapRef.current = new maplibregl.Map({
            container: mapContainerRef.current,
            style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
            center: [77.5946, 12.9716], // Bangalore [longitude, latitude]
            zoom: 11,
        });

        return () => {
            mapRef.current?.remove();
            mapRef.current = null
        }
    }, [])

    return (
        <div ref={mapContainerRef} className="w-full h-full"></div>
    )
}