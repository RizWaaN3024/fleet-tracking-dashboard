"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const turf = __importStar(require("@turf/turf"));
// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT) || 8080;
const UPDATE_INTERVAL = 1000;
const HEARTBEAT_INTERVAL = 25000;
const MAX_HISTORY = 1000;
const MAX_ALERT_HISTORY = 500;
// CORS: allow specific origins from env, or allow all in dev
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()) ?? ["*"];
// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const vehicles = [
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
const geofences = [
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
// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------
const vehicleHistory = new Map();
const alertHistory = [];
const vehicleZones = new Map();
// ---------------------------------------------------------------------------
// Business logic
// ---------------------------------------------------------------------------
function simulateMovement() {
    const now = Date.now();
    vehicles.forEach((v) => {
        if (v.status !== "moving")
            return;
        v.heading += (Math.random() - 0.5) * 30;
        const rad = (v.heading * Math.PI) / 180;
        const distance = v.speed * 0.00002;
        v.lng += Math.sin(rad) * distance;
        v.lat += Math.cos(rad) * distance;
        v.speed = Math.max(10, Math.min(80, v.speed + (Math.random() - 0.5) * 5));
        const history = vehicleHistory.get(v.id) ?? [];
        history.push({
            lng: v.lng,
            lat: v.lat,
            speed: v.speed,
            status: v.status,
            timestamp: now,
        });
        if (history.length > MAX_HISTORY)
            history.shift();
        vehicleHistory.set(v.id, history);
    });
}
function detectGeofenceEvents() {
    const events = [];
    vehicles.forEach((v) => {
        const point = turf.point([v.lng, v.lat]);
        const previousZones = vehicleZones.get(v.id);
        const currentZones = new Set();
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
        previousZones?.forEach((zoneId) => {
            if (!currentZones.has(zoneId)) {
                const gf = geofences.find((g) => g.id === zoneId);
                if (!gf)
                    return;
                events.push({
                    vehicleId: v.id,
                    vehicleName: v.name,
                    geofenceId: gf.id,
                    geofenceName: gf.name,
                    geofenceType: gf.type,
                    event: "exit",
                    timestamp: Date.now(),
                });
            }
        });
        vehicleZones.set(v.id, currentZones);
    });
    events.forEach((e) => alertHistory.unshift(e));
    if (alertHistory.length > MAX_ALERT_HISTORY) {
        alertHistory.length = MAX_ALERT_HISTORY;
    }
    return events;
}
// ---------------------------------------------------------------------------
// Express (REST API)
// ---------------------------------------------------------------------------
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: ALLOWED_ORIGINS.includes("*") ? true : ALLOWED_ORIGINS }));
app.use(express_1.default.json());
// Health check — Railway/Render ping this to verify the service is alive
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        clients: wss?.clients.size ?? 0,
    });
});
app.get("/api/vehicles", (_req, res) => {
    res.json({ vehicles });
});
app.get("/api/vehicles/:id/history", (req, res) => {
    const { id } = req.params;
    const { limit, since } = req.query;
    let history = vehicleHistory.get(id) ?? [];
    if (since) {
        const sinceMs = Number(since);
        if (!isNaN(sinceMs)) {
            history = history.filter((p) => p.timestamp >= sinceMs);
        }
    }
    if (limit) {
        const limitN = Number(limit);
        if (!isNaN(limitN)) {
            history = history.slice(-limitN);
        }
    }
    res.json({
        vehicleId: id,
        count: history.length,
        history,
    });
});
app.get("/api/geofences", (_req, res) => {
    res.json({ geofences });
});
app.get("/api/alerts", (req, res) => {
    const { limit, vehicleId, type } = req.query;
    let filtered = alertHistory;
    if (vehicleId)
        filtered = filtered.filter((a) => a.vehicleId === vehicleId);
    if (type)
        filtered = filtered.filter((a) => a.geofenceType === type);
    if (limit) {
        const limitN = Number(limit);
        if (!isNaN(limitN))
            filtered = filtered.slice(0, limitN);
    }
    res.json({
        count: filtered.length,
        alerts: filtered,
    });
});
// ---------------------------------------------------------------------------
// HTTP server + WebSocket server (shared port)
// ---------------------------------------------------------------------------
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
function broadcast(message) {
    const payload = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(payload);
        }
    });
}
wss.on("connection", (ws) => {
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
        }
        catch (error) {
            console.error("Invalid message received", error);
        }
    });
    // welcome + initial state
    ws.send(JSON.stringify({
        type: "welcome",
        data: {
            vehicleCount: vehicles.length,
            updateInterval: UPDATE_INTERVAL,
        },
    }));
    ws.send(JSON.stringify({
        type: "vehicle-update",
        data: vehicles,
        timestamp: Date.now(),
    }));
    ws.on("close", () => {
        console.log(`Client disconnected. Total clients: ${wss.clients.size}`);
    });
});
// ---------------------------------------------------------------------------
// Intervals
// ---------------------------------------------------------------------------
const simulationInterval = setInterval(() => {
    simulateMovement();
    broadcast({
        type: "vehicle-update",
        data: vehicles,
        timestamp: Date.now(),
    });
    const events = detectGeofenceEvents();
    events.forEach((event) => {
        console.log(`[GEOFENCE] ${event.vehicleName} ${event.event}ed ${event.geofenceName}`);
        broadcast({ type: "geofence-alert", data: event });
    });
}, UPDATE_INTERVAL);
const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client) => {
        if (client.readyState !== ws_1.WebSocket.OPEN)
            return;
        if (client.isAlive === false) {
            console.log("[HEARTBEAT] Client unresponsive - terminating");
            client.terminate();
            return;
        }
        client.isAlive = false;
        client.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
    });
}, HEARTBEAT_INTERVAL);
// ---------------------------------------------------------------------------
// Start + graceful shutdown
// ---------------------------------------------------------------------------
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`  HTTP:      http://localhost:${PORT}`);
    console.log(`  WebSocket: ws://localhost:${PORT}`);
    console.log(`  Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});
function shutdown(signal) {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    clearInterval(simulationInterval);
    clearInterval(heartbeatInterval);
    wss.clients.forEach((client) => client.close(1001, "Server shutting down"));
    wss.close(() => {
        server.close(() => {
            console.log("Server closed cleanly");
            process.exit(0);
        });
    });
    // force exit if graceful shutdown hangs
    setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
    }, 10000);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
