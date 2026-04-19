"use client";

import { useState } from "react";
import maplibregl from "maplibre-gl";
import { Vehicle } from "../data/vehicles";
import { ConnectionStatus } from "../hooks/useVehicleSocket";
import { fetchVehicleHistory, HistoryPoint } from "../lib/api";

interface Props {
    map: maplibregl.Map | null;
    vehicles: Vehicle[];
    status: ConnectionStatus;
    onHistoryLoaded?: (history: HistoryPoint[]) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({
    map,
    vehicles,
    status,
    onHistoryLoaded,
    isOpen = false,
    onClose,
}: Props) {
    const movingCount = vehicles.filter((v) => v.status === "moving").length;
    const idleCount = vehicles.filter((v) => v.status === "idle").length;
    const offlineCount = vehicles.filter((v) => v.status === "offline").length;
    const avgSpeed = Math.round(
        vehicles.filter((v) => v.status === "moving").reduce((sum, v) => sum + v.speed, 0) /
            (movingCount || 1)
    );

    const [loadingId, setLoadingId] = useState<string | null>(null);

    async function focusVehicle(vehicleId: string, lng: number, lat: number) {
        if (!map) return;

        map.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });

        setLoadingId(vehicleId);
        try {
            const history = await fetchVehicleHistory(vehicleId, { limit: 200 });
            onHistoryLoaded?.(history);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setLoadingId(null);
        }
    }

    const statusConfig = {
        connecting: { color: "bg-yellow-500", label: "Connecting..." },
        connected: { color: "bg-green-500", label: "Live" },
        disconnected: { color: "bg-red-500", label: "Disconnected" },
        reconnecting: { color: "bg-orange-500", label: "Reconnecting..." },
    };

    return (
        <>
            {/* Backdrop — mobile only */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 z-20"
                    onClick={onClose}
                    aria-hidden
                />
            )}

            {/* Sidebar — drawer on mobile, inline on desktop */}
            <aside
                className={`
                    fixed md:relative inset-y-0 left-0 z-30 md:z-auto
                    w-72 sm:w-80 bg-gray-900 border-r border-gray-800
                    flex flex-col overflow-hidden flex-shrink-0
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >
                {/* Header with connection status + close button */}
                <div className="p-4 border-b border-gray-800 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold">Fleet Overview</h2>
                        <div className="flex items-center gap-2">
                            <span
                                className={`w-2 h-2 rounded-full ${statusConfig[status].color} ${status === "connected" ? "animate-pulse" : ""}`}
                            />
                            <span className="text-xs text-gray-400">
                                {statusConfig[status].label}
                            </span>
                            <button
                                onClick={onClose}
                                className="md:hidden ml-2 p-1 -mr-1 rounded hover:bg-gray-800"
                                aria-label="Close sidebar"
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
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                        {vehicles.length} total vehicles
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 p-3 sm:p-4 border-b border-gray-800 flex-shrink-0">
                    <div className="bg-gray-800 rounded-lg p-2 sm:p-3">
                        <p className="text-xs text-gray-400">Moving</p>
                        <p className="text-lg sm:text-xl font-bold text-green-400">
                            {movingCount}
                        </p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-2 sm:p-3">
                        <p className="text-xs text-gray-400">Idle</p>
                        <p className="text-lg sm:text-xl font-bold text-yellow-400">
                            {idleCount}
                        </p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-2 sm:p-3">
                        <p className="text-xs text-gray-400">Offline</p>
                        <p className="text-lg sm:text-xl font-bold text-red-400">
                            {offlineCount}
                        </p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-2 sm:p-3">
                        <p className="text-xs text-gray-400">Avg Speed</p>
                        <p className="text-lg sm:text-xl font-bold">{avgSpeed} km/h</p>
                    </div>
                </div>

                {/* Vehicle List */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-3 sm:p-4">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                            Vehicles
                        </h3>
                        <div className="flex flex-col gap-2">
                            {vehicles.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => focusVehicle(v.id, v.lng, v.lat)}
                                    className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left w-full"
                                >
                                    <span
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{
                                            backgroundColor:
                                                v.status === "moving"
                                                    ? "#22c55e"
                                                    : v.status === "idle"
                                                        ? "#eab308"
                                                        : "#ef4444",
                                        }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {v.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {loadingId === v.id
                                                ? "Loading history..."
                                                : v.status === "moving"
                                                    ? `${Math.round(v.speed)} km/h`
                                                    : v.status}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
