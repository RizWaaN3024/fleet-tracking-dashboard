import { WebSocketServer, WebSocket } from "ws";
import express from "express";
import cors from "cors";
import * as turf from "@turf/turf";

interface Vehicle {
    id: string;
    name: string;
    status: "moving" | "idle" | "offline";
    speed: number;
    lng: number;
    lat: number;
    heading: number;
}

interface Geofence {
    id: string;
    name: string;
    type: "warehouse" | "restricted" | "delivery-zone";
    coordinates: [number, number][];
}

const vehicles: Vehicle[] = [
    { id: "v1", name: "Truck A1", status: "moving", speed: 42, lng: 77.5946, lat: 12.9716, heading: 45 },
    { id: "v2", name: "Truck A2", status: "moving", speed: 38, lng: 77.6150, lat: 12.9350, heading: 120 },
    { id: "v3", name: "Van B1", status: "idle", speed: 0, lng: 77.5700, lat: 12.9550, heading: 0 },
    { id: "v4", name: "Van B2", status: "moving", speed: 55, lng: 77.6300, lat: 12.9800, heading: 200 },
    { id: "v5", name: "Bike C1", status: "offline", speed: 0, lng: 77.5500, lat: 12.9900, heading: 0 },
    { id: "v6", name: "Truck A3", status: "moving", speed: 61, lng: 77.6400, lat: 12.9600, heading: 310 },
    { id: "v7", name: "Van B3", status: "idle", speed: 0, lng: 77.5800, lat: 13.0000, heading: 0 },
    { id: "v8", name: "Bike C2", status: "moving", speed: 28, lng: 77.6100, lat: 12.9450, heading: 75 },
    { id: "v9", name: "Truck A4", status: "moving", speed: 47, lng: 77.5650, lat: 12.9250, heading: 160 },
    { id: "v10", name: "Van B4", status: "offline", speed: 0, lng: 77.6250, lat: 13.0100, heading: 0 },
];

const geofences: Geofence[] = [
    {
        id: "gf1",
        name: "Central Warehouse",
        type: "warehouse",
        coordinates: [
            [77.5850, 12.9780],
            [77.6000, 12.9780],
            [77.6000, 12.9680],
            [77.5850, 12.9680],
            [77.5850, 12.9780],
        ],
    },
    {
        id: "gf2",
        name: "Airport Restricted Zone",
        type: "restricted",
        coordinates: [
            [77.6800, 12.9500],
            [77.7100, 12.9500],
            [77.7100, 12.9300],
            [77.6800, 12.9300],
            [77.6800, 12.9500],
        ],
    },
    {
        id: "gf3",
        name: "North Delivery Zone",
        type: "delivery-zone",
        coordinates: [
            [77.5600, 13.0050],
            [77.6000, 13.0150],
            [77.6200, 13.0050],
            [77.6000, 12.9900],
            [77.5600, 13.0050],
        ],
    },
];

interface HistoryPoint {
    lng: number;
    lat: number;
    speed: number;
    status: string;
    timestamp: number;
}

const MAX_HISTORY = 1000;
const vehicleHistory = new Map<string, HistoryPoint[]>();

interface AlertRecord {
    vehicleId: string;
    vehicleName: string;
    geofenceId: string;
    geofenceName: string;
    geofenceType: string;
    event: "enter" | "exit";
    timestamp: number;
}

const alertHistory: AlertRecord[] = [];
const MAX_ALERT_HISTORY = 500;

// State Tracking
// Map<vehicleId, Set<geofenceId>> - which zones each vehicle is currently inside
const vehicleZones = new Map<string, Set<string>>();


function simulateMovement() {
    const now = Date.now();

    vehicles.forEach((v) => {
        if (v.status !== "moving") return;

        v.heading += (Math.random() - 0.5) * 30;
        const rad = (v.heading * Math.PI) / 180;
        const distance = v.speed * 0.00002;

        v.lng += Math.sin(rad) * distance;
        v.lat += Math.cos(rad) * distance;
        v.speed = Math.max(10, Math.min(80, v.speed + (Math.random() - 0.5) * 5));

        // record history
        const history = vehicleHistory.get(v.id) ?? [];
        history.push({
            lng: v.lng,
            lat: v.lat,
            speed: v.speed,
            status: v.status,
            timestamp: now
        });
        if (history.length > MAX_HISTORY) history.shift();
        vehicleHistory.set(v.id, history);
    });
}

// Geofence Detection
interface GeofenceEvent {
    vehicleId: string;
    vehicleName: string;
    geofenceId: string;
    geofenceName: string;
    geofenceType: string;
    event: "enter" | "exit";
    timestamp: number;
}

function detectGeofenceEvents(): GeofenceEvent[] {
    const events: GeofenceEvent[] = [];

    vehicles.forEach((v) => {
        const point = turf.point([v.lng, v.lat]);
        const previousZones = vehicleZones.get(v.id);
        const currentZones = new Set<string>();

        geofences.forEach((gf) => {
            const polygon = turf.polygon([gf.coordinates]);
            const isInside = turf.booleanPointInPolygon(point, polygon);

            if (isInside) {
                currentZones.add(gf.id);

                if (!previousZones?.has(gf.id)) {
                    events.push({
                        vehicleId: v.id,
                        vehicleName: v.name,
                        geofenceId: gf.id,
                        geofenceName: gf.name,
                        geofenceType: gf.type,
                        event: "enter",
                        timestamp: Date.now(),
                    });
                }
            }
        });

        // Detect exits - zones that were in previousbut not in current
        previousZones?.forEach((zoneId) => {
            if (!currentZones.has(zoneId)) {
                const gf = geofences.find((g) => g.id === zoneId);
                if (!gf) return;
                events.push({
                    vehicleId: v.id,
                    vehicleName: v.name,
                    geofenceId: gf.id,
                    geofenceName: gf.name,
                    geofenceType: gf.type,
                    event: "exit",
                    timestamp: Date.now()
                });
            }
        });

        vehicleZones.set(v.id, currentZones);
    });
    // Persist to history
    events.forEach((e) => {
        alertHistory.unshift(e);
    });
    if (alertHistory.length > MAX_ALERT_HISTORY) {
        alertHistory.length = MAX_ALERT_HISTORY;
    }
    return events;
}

// Message Types
// Every WebSocket message has a "type" so the client knows what it is

interface VehicleUpdateMessage {
    type: "vehicle-update";
    data: Vehicle[];
    timestamp: number;
}

interface WelcomeMessage {
    type: "welcome";
    data: {
        vehicleCount: number;
        updateInterval: number;
    };
}

interface GeofenceAlertMessage {
    type: "geofence-alert";
    data: GeofenceEvent;
}

type ServerMessage = VehicleUpdateMessage | WelcomeMessage | GeofenceAlertMessage;

function broadcast(wss: WebSocketServer, message: ServerMessage) {
    const payload = JSON.stringify(message);

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

// Server Setup
const PORT = 8080;
const UPDATE_INTERVAL = 1000; // 1 second
const HEARTBEAT_INTERVAL = 25000;

interface AliveWebSocket extends WebSocket {
    isAlive?: boolean;
}

const wss = new WebSocketServer({ port: PORT });
console.log(`WebSocket server running on ws://localhost:${PORT}`);

// When a new client connects
wss.on("connection", (ws: AliveWebSocket) => {
    console.log(`Client connected. Total clients: ${wss.clients.size}`);

    ws.isAlive = true;

    ws.on("message", (raw) => {
        try {
            const message = JSON.parse(raw.toString());

            if (message.type === "pong") {
                ws.isAlive = true;
                return;
            }

            console.log("Received from client:", message);
        } catch (error) {
            console.error("Invalid message received", error);
        }
    })

    // Send welcome message with initial data
    const welcome: WelcomeMessage = {
        type: "welcome",
        data: {
            vehicleCount: vehicles.length,
            updateInterval: UPDATE_INTERVAL,
        },
    };
    ws.send(JSON.stringify(welcome));

    // Send current vehicle positions immediately
    const initialUpdate: VehicleUpdateMessage = {
        type: "vehicle-update",
        data: vehicles,
        timestamp: Date.now()
    };
    ws.send(JSON.stringify(initialUpdate));

    // When client disconnects
    ws.on("close", () => {
        console.log(`Client disconnected. Total clients: ${wss.clients.size}`);
    });
});

// Simulation + broadcast (runs once, shared across all clients)
setInterval(() => {
    simulateMovement();

    const update: VehicleUpdateMessage = {
        type: "vehicle-update",
        data: vehicles,
        timestamp: Date.now(),
    };
    broadcast(wss, update);

    // detect and broadcast geofence events
    const events = detectGeofenceEvents();
    events.forEach((event) => {
        console.log(`[GEOFENCE] ${event.vehicleName} ${event.event}ed ${event.geofenceName}`);
        broadcast(wss, { type: "geofence-alert", data: event });
    });
}, UPDATE_INTERVAL);

// Heartbeat (also runs once, shared across all clients)
setInterval(() => {
    wss.clients.forEach((client: AliveWebSocket) => {
        if (client.readyState !== WebSocket.OPEN) return;

        if (client.isAlive === false) {
            console.log("[HEARTBEAT] Client unresponsive - terminating");
            client.terminate();
            return;
        }

        client.isAlive = false;
        client.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
    })
}, HEARTBEAT_INTERVAL);

const app = express();
app.use(cors());
app.use(express.json());

const REST_PORT = 8081;

// GET /api/vehicles - list all vehicles with current state
app.get("/api/vehicles", (_req, res) => {
    res.json({ vehicles });
})