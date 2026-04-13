"use client";

import { useEffect, useRef, useState } from "react";


export interface GeofenceAlert {
    vehicleId: string;
    vehicleName: string;
    geofenceId: string;
    geofenceName: string;
    geofenceType: string;
    event: "enter" | "exit";
    timestamp: number;
}

const MAX_ALERTS = 20;

export function useGeofenceAlerts() {
    const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
    const alertsRef = useRef<GeofenceAlert[]>([]);

    useEffect(() => {
        function handleMessage(event: MessageEvent) {
            try {
                const message = JSON.parse(event.data);
                if (message.type === "geofence-alert") {
                    const alert = message.data as GeofenceAlert;
                    alertsRef.current = [alert, ...alertsRef.current].slice(0, MAX_ALERTS);
                    setAlerts([...alertsRef.current]);
                }
            } catch {
                // ignore — non-JSON or unrelated message
            }
        }

        window.addEventListener("ws-message", handleMessage as EventListener);

        return () => {
            window.removeEventListener("ws-message", handleMessage as EventListener);
        };
    }, []);

    function dismissAlert(index: number) {
        setAlerts((prev) => prev.filter((_, i) => i !== index));
    }

    return { alerts, dismissAlert };
}