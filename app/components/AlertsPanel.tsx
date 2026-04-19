"use client";

import { useGeofenceAlerts } from "../hooks/useGeofenceAlerts";

const alertColors: Record<string, { bg: string; border: string; text: string }> = {
    warehouse: { bg: "bg-blue-950", border: "border-blue-500", text: "text-blue-300" },
    restricted: { bg: "bg-red-950", border: "border-red-500", text: "text-red-300" },
    "delivery-zone": { bg: "bg-green-950", border: "border-green-500", text: "text-green-300" },
};

function formatTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString();
}

export default function AlertsPanel() {
    const { alerts, dismissAlert } = useGeofenceAlerts();

    if (alerts.length === 0) return null;

    return (
        <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:bottom-4 sm:right-4 sm:w-80 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto flex flex-col gap-2 z-10">
            {alerts.map((alert, i) => {
                const colors = alertColors[alert.geofenceType] ?? alertColors.warehouse;
                return (
                    <div
                        key={`${alert.vehicleId}-${alert.geofenceId}-${alert.timestamp}`}
                        className={`${colors.bg} ${colors.border} border-l-4 rounded-r-lg p-3 shadow-lg backdrop-blur-sm`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>
                                    {alert.event === "enter" ? "🟢 Entered" : "🔴 Exited"} {alert.geofenceType.replace("-", " ")}
                                </p>
                                <p className="text-sm font-medium mt-1 truncate">
                                    {alert.vehicleName}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                    {alert.geofenceName}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {formatTime(alert.timestamp)}
                                </p>
                            </div>
                            <button
                                onClick={() => dismissAlert(i)}
                                className="text-gray-500 hover:text-gray-300 text-xs p-1 -m-1"
                                aria-label="Dismiss alert"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
