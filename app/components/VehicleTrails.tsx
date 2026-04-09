"use client";

import { useEffect } from "react";
import { vehicles } from "../data/vehicles";
import maplibregl from "maplibre-gl";

const statusColors: Record<string, string> = {
    moving: "#22c55e",
    idle: "#eab308",
    offline: "#ef4444",
};

function trailsToGeoJSON(): GeoJSON.FeatureCollection {
    return {
        type: "FeatureCollection",
        features: vehicles
            .filter((v) => v.trail.length >= 2)
            .map((v) => ({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [...v.trail, [v.lng, v.lat]],
                },
                properties: {
                    id: v.id,
                    status: v.status,
                },
            })),
    };
}

export default function VehicleTrails({ map }: { map: maplibregl.Map | null }) {
    useEffect(() => {
        if (!map) return;

        map.addSource("trails", {
            type: "geojson",
            data: trailsToGeoJSON(),
        });

        map.addLayer({
            id: "trail-lines",
            type: "line",
            source: "trails",
            paint: {
                "line-color": [
                    "match",
                    ["get", "status"],
                    "moving", statusColors.moving,
                    "idle", statusColors.idle,
                    "offline", statusColors.offline,
                    "#888",
                ],
                "line-width": 2,
                "line-opacity": 0.6,
            },
            layout: {
                "line-cap": "round",
                "line-join": "round",
            },
        });

        const interval = setInterval(() => {
            const source = map.getSource("trails") as maplibregl.GeoJSONSource;
            if (source) {
                source.setData(trailsToGeoJSON());
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            if (map.getLayer("trail-lines")) map.removeLayer("trail-lines");
            if (map.getSource("trails")) map.removeSource("trails");
        };
    }, [map]);

    return null;
}