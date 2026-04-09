"use client";

import { useState } from "react";
import maplibregl from "maplibre-gl";

interface LayerGroup {
    label: string;
    layerIds: string[];
}

const layerGroups: LayerGroup[] = [
    {
        label: "Vehicles",
        layerIds: ["clusters", "cluster-count", "unclustered-point"],
    },
    {
        label: "Trails",
        layerIds: ["trail-lines"],
    },
    {
        label: "Geofences",
        layerIds: ["geofence-fill", "geofence-outline", "geofence-label"],
    },
];

interface StatusFilter {
    label: string;
    value: string;
    color: string;
}

const statusFilters: StatusFilter[] = [
    { label: "Moving", value: "moving", color: "#22c55e" },
    { label: "Idle", value: "idle", color: "#eab308" },
    { label: "Offline", value: "offline", color: "#ef4444" },
];

export default function LayerControls({ map }: { map: maplibregl.Map | null }) {
    const [layers, setLayers] = useState<Record<string, boolean>>({
        Vehicles: true,
        Trails: true,
        Geofences: true,
    });

    const [statuses, setStatuses] = useState<Record<string, boolean>>({
        moving: true,
        idle: true,
        offline: true,
    });

    function toggleLayer(label: string) {
        if (!map) return;

        const newValue = !layers[label];
        setLayers((prev) => ({ ...prev, [label]: newValue }));

        const group = layerGroups.find((g) => g.label === label);
        if (!group) return;

        group.layerIds.forEach((layerId) => {
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, "visibility", newValue ? "visible" : "none");
            }
        });
    }

    function toggleStatus(status: string) {
        if (!map) return;

        const newStatuses = { ...statuses, [status]: !statuses[status] };
        setStatuses(newStatuses);

        // build a filter that shows only active statuses
        const activeStatuses = Object.entries(newStatuses)
            .filter(([, active]) => active)
            .map(([s]) => s);

        // update vehicle layer filter
        if (map.getLayer("unclustered-point")) {
            map.setFilter("unclustered-point", [
                "all",
                ["!", ["has", "point_count"]],
                ["in", ["get", "status"], ["literal", activeStatuses]],
            ]);
        }

        // update trail layer filter
        if (map.getLayer("trail-lines")) {
            map.setFilter("trail-lines", ["in", ["get", "status"], ["literal", activeStatuses]]);
        }
    }

    return (
        <div className="absolute top-20 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 z-10 min-w-[180px]">
            {/* Layer toggles */}
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Layers
            </h3>
            <div className="flex flex-col gap-2 mb-4">
                {layerGroups.map((group) => (
                    <label key={group.label} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={layers[group.label]}
                            onChange={() => toggleLayer(group.label)}
                            className="rounded"
                        />
                        <span className="text-sm text-gray-200">{group.label}</span>
                    </label>
                ))}
            </div>

            {/* Status filters */}
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Status
            </h3>
            <div className="flex flex-col gap-2">
                {statusFilters.map((sf) => (
                    <label key={sf.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={statuses[sf.value]}
                            onChange={() => toggleStatus(sf.value)}
                            className="rounded"
                        />
                        <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: sf.color }}
                        />
                        <span className="text-sm text-gray-200">{sf.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
