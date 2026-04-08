"use client";

import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import { vehicles } from "../data/vehicles";

const statusColors: Record<string, string> = {
    moving: "#22c55e",
    idle: "#eab308",
    offline: "#ef4444",
};

function vehicleToGeojson(): GeoJSON.FeatureCollection {
    return {
        type: "FeatureCollection",
        features: vehicles.map((v) => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [v.lng, v.lat],
            },
            properties: {
                id: v.id,
                name: v.name,
                status: v.status,
                speed: v.speed,
            },
        })),
    };
}

export default function VehicleMarkers({ map }: { map: maplibregl.Map | null }) {
    useEffect(() => {
        if (!map) return;

        // Add GeoJSON source with clustereing enabled
        map.addSource("vehicles", {
            type: "geojson",
            data: vehicleToGeojson(),
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
        });

        // Layer for cluster circles
        map.addLayer({
            id: "clusters",
            type: "circle",
            source: "vehicles",
            filter: ["has", "point_count"],
            paint: {
                "circle-radius": [
                    "step",
                    ["get", "point_count"],
                    15,
                    5, 20,
                    10, 25,
                ],
                "circle-color": "#3b82f6",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#fff"
            },
        });

        // Layer for cluster count text
        map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "vehicles",
            filter: ["has", "point_count"],
            layout: {
                "text-field": "{point_count_abbreviated}",
                "text-size": 13,
            },
            paint: {
                "text-color": "#ffffff",
            },
        });

        // Layer for individual (unclustered) vehicle points
        map.addLayer({
            id: "unclustered-point",
            type: "circle",
            source: "vehicles",
            filter: ["!", ["has", "point_count"]],
            paint: {
                "circle-radius": 8,
                "circle-color": [
                    "match",
                    ["get", "status"],
                    "moving", statusColors.moving,
                    "idle", statusColors.idle,
                    "offline", statusColors.offline,
                    "#888",
                ],
                "circle-stroke-width": 2,
                "circle-stroke-color": "#fff",
            },
        });

        // Click cluster -> zoom into it
        map.on("click", "clusters", async (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
            const clusterId = features[0].properties.cluster_id;
            const source = map.getSource("vehicles") as maplibregl.GeoJSONSource;
            const zoom = await source.getClusterExpansionZoom(clusterId);
            map.easeTo({ center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number], zoom });
        });

        // Click individual point -> show popup
        map.on("click", "unclustered-point", (e) => {
            const feature = e.features?.[0];
            if (!feature) return;
            const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
            const { name, status, speed } = feature.properties;

            new maplibregl.Popup({ offset: 12 })
                .setLngLat(coords)
                .setHTML(`
                    <div style="color: #000; font-size: 13px; line-height: 1.4;">
                        <strong>${name}</strong><br/>
                        Status: ${status}<br/>
                        Speed: ${speed} km/h
                    </div>
          `)
                .addTo(map);
        });

        // Change cursor on hover
        map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = ""; });
        map.on("mouseenter", "unclustered-point", () => { map.getCanvas().style.cursor = "pointer" });
        map.on("mouseleave", "unclustered-point", () => { map.getCanvas().style.cursor = "" });

        // cleanup
        return () => {
            if (map.getLayer("clusters")) map.removeLayer("clusters");
            if (map.getLayer("cluster-count")) map.removeLayer("cluster-count");
            if (map.getLayer("unclustered-point")) map.removeLayer("unclustered-point");
            if (map.getSource("vehicles")) map.removeSource("vehicles");
        };
    }, [map]);

    return null;
}