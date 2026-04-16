"use client";

import { HistoryPoint } from "../lib/api";
import maplibregl from "maplibre-gl";
import { useEffect } from "react";


interface Props {
    map: maplibregl.Map | null;
    history: HistoryPoint[];
}

export default function HistoryTrail({ map, history }: Props) {
    useEffect(() => {
        if (!map) return;

        map.addSource("history-trail", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer({
            id: "history-line",
            type: "line",
            source: "history-trail",
            paint: {
                "line-color": "#3b82f6",
                "line-width": 3,
                "line-opacity": 0.8,
                "line-dasharray": [2, 1],
            },
            layout: {
                "line-cap": "round",
                "line-join": "round",
            },
        });

        return () => {
            if (map.getLayer("history-line")) map.removeLayer("history-line");
            if (map.getSource("history-trail")) map.removeSource("history-trail");
        };
    }, [map]);

    useEffect(() => {
        if (!map) return;

        const source = map.getSource("history-trail") as maplibregl.GeoJSONSource | undefined;
        if (!source) return;

        if (history.length < 2) {
            source.setData({ type: "FeatureCollection", features: [] });
            return;
        }

        source.setData({
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: history.map((p) => [p.lng, p.lat]),
                    },
                    properties: {},
                },
            ],
        });
    }, [map, history]);

    return null;
}