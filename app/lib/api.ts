const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface HistoryPoint {
    lng: number;
    lat: number;
    speed: number;
    status: string;
    timestamp: number;
}

export interface AlertRecord {
    vehicleId: string;
    vehicleName: string;
    geofenceId: string;
    geofenceName: string;
    geofenceType: string;
    event: "enter" | "exit";
    timestamp: number;
}

export async function fetchVehicleHistory(
    vehicleId: string,
    options: { limit?: number; since?: number } = {}
): Promise<HistoryPoint[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.since) params.set("since", String(options.since));

    const url = `${API_URL}/api/vehicles/${vehicleId}/history?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`);

    const data = await res.json();
    return data.history;
}

export async function fetchAlerts(
    options: { limit?: number; vehicleId?: string; type?: string } = {}
): Promise<AlertRecord[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.vehicleId) params.set("vehicleId", options.vehicleId);
    if (options.type) params.set("type", options.type);

    const res = await fetch(`${API_URL}/api/alerts?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.status}`);

    const data = await res.json();
    return data.alerts;
}