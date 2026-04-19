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

    const [collapsed, setCollapsed] = useState(false);

    function toggleLayer(label: string) {
        if (!map) return;

        const newValue = !layers[label];
        setLayers((prev) => ({ ...prev, [label]: newValue }));

        const group = layerGroups.find((g) => g.label === label);
        if (!group) return;

        group.layerIds.forEach((layerId) => {
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(
                    layerId,
                    "visibility",
                    newValue ? "visible" : "none"
                );
            }
        });
    }

    function toggleStatus(status: string) {
        if (!map) return;

        const newStatuses = { ...statuses, [status]: !statuses[status] };
        setStatuses(newStatuses);

        const activeStatuses = Object.entries(newStatuses)
            .filter(([, active]) => active)
            .map(([s]) => s);

        if (map.getLayer("unclustered-point")) {
            map.setFilter("unclustered-point", [
                "all",
                ["!", ["has", "point_count"]],
                ["in", ["get", "status"], ["literal", activeStatuses]],
            ]);
        }

        if (map.getLayer("trail-lines")) {
            map.setFilter("trail-lines", [
                "in",
                ["get", "status"],
                ["literal", activeStatuses],
            ]);
        }
    }

    return (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 max-w-[calc(100vw-1.5rem)]">
            {collapsed ? (
                <button
                    onClick={() => setCollapsed(false)}
                    className="w-10 h-10 bg-gray-900/90 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-gray-800/90 transition-colors"
                    aria-label="Show layer controls"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14-7H5m14 14H5"
                        />
                    </svg>
                </button>
            ) : (
                <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 sm:p-4 min-w-[160px] sm:min-w-[180px]">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Layers
                        </h3>
                        <button
                            onClick={() => setCollapsed(true)}
                            className="text-gray-500 hover:text-gray-300 p-1 -m-1"
                            aria-label="Hide layer controls"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                    <div className="flex flex-col gap-2 mb-4">
                        {layerGroups.map((group) => (
                            <label
                                key={group.label}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={layers[group.label]}
                                    onChange={() => toggleLayer(group.label)}
                                    className="rounded"
                                />
                                <span className="text-sm text-gray-200">
                                    {group.label}
                                </span>
                            </label>
                        ))}
                    </div>

                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                        Status
                    </h3>
                    <div className="flex flex-col gap-2">
                        {statusFilters.map((sf) => (
                            <label
                                key={sf.value}
                                className="flex items-center gap-2 cursor-pointer"
                            >
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
                                <span className="text-sm text-gray-200">
                                    {sf.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
