"use client";

import { useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import { vehicles } from "../data/vehicles";

export default function Sidebar({ map }: { map: maplibregl.Map | null }) {
    const [, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTick((t) => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [])

    const movingCount = vehicles.filter((v) => v.status === "moving").length;
    const idleCount = vehicles.filter((v) => v.status === "idle").length;
    const offlineCount = vehicles.filter((v) => v.status === "offline").length;
    const avgSpeed = Math.round(
        vehicles.filter((v) => v.status === "moving").reduce((sum, v) => sum + v.speed, 0) / (movingCount || 1)
    );

    function focusVehicle(lng: number, lat: number) {
        if (!map) return;
        map.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
    }

    return (
        <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
                <h2 className="text-lg font-bold">Fleet Overview</h2>
                <p className="text-sm text-gray-400 mt-1">{vehicles.length} total vehicles</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 p-4 border-b border-gray-800">
                <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Moving</p>
                    <p className="text-xl font-bold text-green-400">{movingCount}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Idle</p>
                    <p className="text-xl font-bold text-yellow-400">{idleCount}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Offline</p>
                    <p className="text-xl font-bold text-red-400">{offlineCount}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Avg Speed</p>
                    <p className="text-xl font-bold">{avgSpeed} km/h</p>
                </div>
            </div>

            {/* Vehicle List */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                        Vehicles
                    </h3>
                    <div className="flex flex-col gap-2">
                        {vehicles.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => focusVehicle(v.lng, v.lat)}
                                className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left w-full"
                            >
                                <span
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{
                                        backgroundColor:
                                            v.status === "moving" ? "#22c55e" :
                                                v.status === "idle" ? "#eab308" : "#ef4444",
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{v.name}</p>
                                    <p className="text-xs text-gray-400">
                                        {v.status === "moving" ? `${Math.round(v.speed)} km/h` : v.status}
                                    </p>
                                </div>
                                <svg
                                    className="w-4 h-4 text-gray-500 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}