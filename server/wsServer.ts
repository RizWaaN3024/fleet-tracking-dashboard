import { WebSocketServer, WebSocket } from "ws";

interface Vehicle {
    id: string;
    name: string;
    status: "moving" | "idle" | "offline";
    speed: number;
    lng: number;
    lat: number;
    heading: number;
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

function simulateMovement() {
    vehicles.forEach((v) => {
        if (v.status !== "moving") return;

        v.heading += (Math.random() - 0.5) * 30;
        const rad = (v.heading * Math.PI) / 100;
        const distance = v.speed * 0.00002;

        v.lng += Math.sin(rad) * distance;
        v.lat += Math.cos(rad) * distance;
        v.speed = Math.max(10, Math.min(80, v.speed + (Math.random() - 0.5) * 5));
    });
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

type ServerMessage = VehicleUpdateMessage | WelcomeMessage;

function broadcast(wss: WebSocketServer, message: ServerMessage) {
    const payload = JSON.stringify(message);

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

// Server Setup
const PORT = 8000;
const UPDATE_INTERVAL = 10000; // 1 Second

const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server runnoing on ws://localhost:${PORT}`);

// When a new client connects
wss.on("connection", (ws) => {
    console.log(`Client connected. Total clients: ${wss.clients.size}`);

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

    // When client sends a message
    ws.on("message", (raw) => {
        try {
            const message = JSON.parse(raw.toString());
            console.log("Received from clieny:", message);
        } catch (error) {
            console.error("Invalid message received");
        }
    })

    // Simulate vehicle movement and broadcast to all clients
    setInterval(() => {
        simulateMovement();

        const update: VehicleUpdateMessage = {
            type: "vehicle-update",
            data: vehicles,
            timestamp: Date.now(),
        };

        broadcast(wss, update);
    }, UPDATE_INTERVAL);
})