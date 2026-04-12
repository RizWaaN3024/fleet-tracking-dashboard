"use client";

import { useEffect } from "react";
import { Vehicle, vehicles } from "../data/vehicles";
import maplibregl from "maplibre-gl";

const statusColors: Record<string, string> = {
    moving: "#22c55e",
    idle: "#eab308",
    offline: "#ef4444",
};

function trailsToGeoJSON(vehicles: Vehicle[]): GeoJSON.FeatureCollection {
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

interface Props {
    map: maplibregl.Map | null;
    vehicles: Vehicle[];
}

export default function VehicleTrails({ map, vehicles }: Props) {
    useEffect(() => {
        if (!map) return;

        map.addSource("trails", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
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

        return () => {
            if (map.getLayer("trail-lines")) map.removeLayer("trail-lines");
            if (map.getSource("trails")) map.removeSource("trails");
        };
    }, [map]);

    useEffect(() => {
        if (!map) return;
        const source = map.getSource("trails") as maplibregl.GeoJSONSource | undefined;
        if (source) {
            source.setData(trailsToGeoJSON(vehicles));
        }
    }, [map, vehicles]);

    return null;
}