export interface Vehicle {
    id: string;
    name: string;
    status: "moving" | "idle" | "offline";
    speed: number;
    lng: number;
    lat: number;
}

export const vehicles: Vehicle[] = [
    { id: "1", name: "Truck A1", status: "moving", speed: 42, lng: 77.5946, lat: 12.9716 },
    { id: "v2", name: "Truck A2", status: "moving", speed: 38, lng: 77.6150, lat: 12.9350 },
    { id: "v3", name: "Van B1", status: "idle", speed: 0, lng: 77.5700, lat: 12.9550 },
    { id: "v4", name: "Van B2", status: "moving", speed: 55, lng: 77.6300, lat: 12.9800 },
    { id: "v5", name: "Bike C1", status: "offline", speed: 0, lng: 77.5500, lat: 12.9900 },
    { id: "v6", name: "Truck A3", status: "moving", speed: 61, lng: 77.6400, lat: 12.9600 },
    { id: "v7", name: "Van B3", status: "idle", speed: 0, lng: 77.5800, lat: 13.0000 },
    { id: "v8", name: "Bike C2", status: "moving", speed: 28, lng: 77.6100, lat: 12.9450 },
    { id: "v9", name: "Truck A4", status: "moving", speed: 47, lng: 77.5650, lat: 12.9250 },
    { id: "v10", name: "Van B4", status: "offline", speed: 0, lng: 77.6250, lat: 13.0100 },
];