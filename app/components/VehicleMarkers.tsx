"use client";

import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import { vehicles } from "../data/vehicles";

const statusColors: Record<string, string> = {
    moving: "#22c55e",
    idle: "#eab308",
    offline: "#ef4444",
};

export default function VehicleMarkers({ map }: { map: maplibregl.Map | null }) {
    useEffect(() => {
        if (!map) return;

        const markers: maplibregl.Marker[] = [];

        vehicles.forEach((vehicle) => {
            const el = document.createElement("div");
            el.style.width = "16px";
            el.style.height = "16px";
            el.style.borderRadius = "50%";
            el.style.backgroundColor = statusColors[vehicle.status];
            el.style.border = "2px solid white";
            el.style.cursor = "pointer";

            const popup = new maplibregl.Popup({ offset: 12 }).setHTML(`
                    <div style="color: #000; font-size: 13px; line-height: 1.4;">
                        <strong>${vehicle.name}</strong><br/>
                        Status: ${vehicle.status}<br/>
                        Speed: ${vehicle.speed} km/h
                    </div>
                `);

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([vehicle.lng, vehicle.lat])
                .setPopup(popup)
                .addTo(map);

            markers.push(marker);
        });

        return () => {
            markers.forEach((m) => m.remove());
        }
    }, [map]);

    return null;
}