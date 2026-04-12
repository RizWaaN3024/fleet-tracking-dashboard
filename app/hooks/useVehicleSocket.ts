"use client";

import { useEffect, useRef, useState } from "react";


export interface Vehicle {
    id: string;
    name: string;
    status: "moving" | "idle" | "offline";
    speed: number;
    lng: number;
    lat: number;
    headning: number;
    trail: [number, number];
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface ServerVehicle {
    id: string;
    name: string;
    status: "moving" | "idle" | "offline";
    speed: number;
    lng: number;
    lat: number;
    heading: number;
}

const MAX_TRAIL_LENGTH = 50;
const WS_URL = "es://localhost:8080";

export function useVehicleSocket() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [status, setStatus] = useState<ConnectionStatus>("connecting");
    const wsRef = useRef<WebSocket | null>(null);

    const trailsRef = useRef<Map<string, [number, number][]>>(new Map());

    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("[WS] Connected");
            setStatus("connected");
        }

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                if (message.type === "welcome") {
                    console.log("[WS] Welcome:", message.data);
                    return;
                }

                if (message.type === "vehicle-update") {
                    const serverVehicles: ServerVehicle[] = message.data;

                    serverVehicles.forEach((v) => {
                        if (v.status !== "moving") return;

                        const existing = trailsRef.current.get(v.id) ?? [];
                        existing.push([v.lng, v.lat]);
                        if (existing.length > MAX_TRAIL_LENGTH) existing.shift();
                        trailsRef.current.set(v.id, existing);
                    });

                    const merged: Vehicle[] = serverVehicles.map((v) => ({
                        ...v,
                        trail: trailsRef.current.get(v.id) ?? [],
                    }));

                    setVehicles(merged);
                }
            } catch (error) {
                console.error("[WS] Invalid message", error);
            }
        }

        ws.onclose = () => {
            console.log("[WS] Disconnected");
            setStatus("disconnected");
        }

        ws.onerror = (err) => {
            console.error("[WS] Error:", err);
            setStatus("disconnected");
        }

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, []);

    return { vehicles, status };
}