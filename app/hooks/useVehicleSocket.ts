"use client";

import { useEffect, useRef, useState } from "react";


export interface Vehicle {
    id: string;
    name: string;
    status: "moving" | "idle" | "offline";
    speed: number;
    lng: number;
    lat: number;
    heading: number;
    trail: [number, number][];
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

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
const WS_URL = "ws://localhost:8080";

// Reconnection config
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useVehicleSocket() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [status, setStatus] = useState<ConnectionStatus>("connecting");
    const wsRef = useRef<WebSocket | null>(null);

    const trailsRef = useRef<Map<string, [number, number][]>>(new Map());

    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const shouldReconnectRef = useRef(true);

    useEffect(() => {

        function connect() {
            const PONG_INTERVAL_TIMEOUT = 35000; // expect ping within 35s (server pings every 25s)
            let pingTimeoutId: NodeJS.Timeout | null = null;
            // If exceeded max attempts, give up
            if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
                console.error("[WS] Max reconnect attempts reached. Giving up.");
                setStatus("disconnected");
                return;
            }
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("[WS] Connected");
                setStatus("connected");
                reconnectAttemptsRef.current = 0;

                // Start watching for the first ping
                pingTimeoutId = setTimeout(() => {
                    console.warn("[WS] No initial ping - connection dead");
                    ws.close();
                }, PONG_INTERVAL_TIMEOUT);
            }

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    // Re-emit for other hooks to consume
                    window.dispatchEvent(new MessageEvent("ws-message", { data: event.data }));

                    if (message.type === "ping") {
                        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));

                        // reset the dead connection timer
                        if (pingTimeoutId) clearTimeout(pingTimeoutId);
                        pingTimeoutId = setTimeout(() => {
                            console.warn("[WS] No ping received in time - connection dead, forcing reconnect");
                            ws.close();
                        }, PONG_INTERVAL_TIMEOUT);
                        return;
                    }

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
                wsRef.current = null;

                if (pingTimeoutId) {
                    clearTimeout(pingTimeoutId);
                    pingTimeoutId = null;
                }

                if (!shouldReconnectRef.current) {
                    setStatus("disconnected");
                    return;
                }

                // calculate backoff delay
                const attempt = reconnectAttemptsRef.current;
                const baseDelay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, attempt), MAX_RECONNECT_DELAY);
                // add jitter: +-25% randomness
                const jitter = baseDelay * (Math.random() * 0.5 - 0.25);
                const delay = Math.max(500, baseDelay + jitter);

                reconnectAttemptsRef.current += 1;
                setStatus("reconnecting");

                console.log(`[WS] Reconnecting in ${Math.round(delay)}ms (attempt ${attempt + 1})`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, delay);
            }
            ws.onerror = (err) => {
                console.error("[WS] Error:", err);
                setStatus("disconnected");
            }
        }


        shouldReconnectRef.current = true;
        connect();

        return () => {
            shouldReconnectRef.current = false;

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, []);

    return { vehicles, status };
}