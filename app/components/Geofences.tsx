"use client";

import { useEffect } from "react";
import { geofencesToGeoJSON } from "../data/geofences";
import maplibregl from "maplibre-gl";

export default function Geofences({ map }: { map: maplibregl.Map | null }) {
    useEffect(() => {
        if (!map) return;

        // Add Geofence data as a source
        map.addSource("geofences", {
            type: "geojson",
            data: geofencesToGeoJSON(),
        });

        // Fill layer - the colored area
        map.addLayer({
            id: "geofence-fill",
            type: "fill",
            source: "geofences",
            paint: {
                "fill-color": ["get", "color"],
                "fill-opacity": 0.15,
            },
        });

        //  Outline Layer
        map.addLayer({
            id: "geofence-outline",
            type: "line",
            source: "geofences",
            paint: {
                "line-color": ["get", "color"],
                "line-width": 2,
                "line-dasharray": [3, 2],
            },
        });

        //  Label Layer - zone name
        map.addLayer({
            id: "geofence-label",
            type: "symbol",
            source: "geofences",
            layout: {
                "text-field": ["get", "name"],
                "text-size": 12,
                "text-anchor": "center",
            },
            paint: {
                "text-color": "#ffffff",
                "text-halo-color": "#000000",
                "text-halo-width": 1,
            },
        });

        //  popup on click
        map.on("click", "geofence-fill", (e) => {
            const feature = e.features?.[0];
            if (!feature) return;
            const { name, type } = feature.properties;

            new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
                    <div style="color: #000; font-size: 13px; line-height: 1.4;">
                        <strong>${name}</strong><br/>
                        Type: ${type}
                    </div>
                `)
                .addTo(map);
        });

        map.on("mouseenter", "geofence-fill", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "geofence-fill", () => { map.getCanvas().style.cursor = "" });

        return () => {
            if (map.getLayer("geofence-fill")) map.removeLayer("geofence-fill");
            if (map.getLayer("geofence-outline")) map.removeLayer("geofence-outline");
            if (map.getLayer("geofence-label")) map.removeLayer("geofence-label");
            if (map.getSource("geofences")) map.removeSource("geofences");
        }
    }, [map]);

    return null;
}