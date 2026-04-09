export interface Geofence {
    id: string;
    name: string;
    type: "warehouse" | "restricted" | "delivery-zone";
    coordinates: [number, number][];
}

export const geofences: Geofence[] = [
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
        ]
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

const geofenceColors: Record<string, string> = {
    warehouse: "#3b82f6",
    restricted: "#ef4444",
    "delivery-zone": "#22c55e"
}

export function geofencesToGeoJSON(): GeoJSON.FeatureCollection {
    return {
        type: "FeatureCollection",
        features: geofences.map((gf) => ({
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [gf.coordinates],
            },
            properties: {
                id: gf.id,
                name: gf.name,
                type: gf.type,
                color: geofenceColors[gf.type],
            },
        })),
    };
}