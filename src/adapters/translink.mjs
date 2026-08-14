import { config, sourceLabel } from "../config.mjs";
import { mockAlerts, mockVehicles } from "../mockData.mjs";

const endpoints = {
  tripUpdates: "TripUpdates",
  vehiclePositions: "VehiclePositions",
  alerts: "alerts"
};

async function decodeFeed(buffer) {
  const imported = await import("gtfs-realtime-bindings");
  const bindings = imported.default ?? imported;
  return bindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
}

async function requestFeed(kind) {
  const endpoint = endpoints[kind];
  if (!endpoint) throw new Error(`Unknown Translink feed: ${kind}`);
  const response = await fetch(`${config.translinkBase}/${endpoint}`, {
    headers: { "User-Agent": config.userAgent }
  });
  if (!response.ok) throw new Error(`Translink ${kind} returned HTTP ${response.status}`);
  return decodeFeed(await response.arrayBuffer());
}

function normaliseVehicles(feed) {
  return (feed.entity || [])
    .filter((entity) => entity.vehicle?.position)
    .slice(0, 25)
    .map((entity, index) => ({
      id: entity.vehicle.vehicle?.id || entity.id || `vehicle-${index + 1}`,
      mode: "Translink service",
      route: entity.vehicle.trip?.routeId || "Unknown",
      latitude: entity.vehicle.position.latitude,
      longitude: entity.vehicle.position.longitude,
      delayMinutes: 0,
      updated: entity.vehicle.timestamp ? new Date(Number(entity.vehicle.timestamp) * 1000).toISOString() : "Unknown"
    }));
}

function translatedText(value) {
  return value?.translation?.[0]?.text || "";
}

function normaliseAlerts(feed) {
  return (feed.entity || [])
    .filter((entity) => entity.alert)
    .slice(0, 20)
    .map((entity, index) => ({
      id: entity.id || `alert-${index + 1}`,
      severity: "Advisory",
      type: translatedText(entity.alert.headerText) || "Service alert",
      title: translatedText(entity.alert.headerText) || "Translink service update",
      location: "Translink network",
      affected: (entity.alert.informedEntity || []).map((item) => item.routeId).filter(Boolean).join(", ") || "See alert",
      advice: translatedText(entity.alert.descriptionText) || "Check the affected service before travelling.",
      updated: "Live feed"
    }));
}

export async function getTranslinkSnapshot() {
  if (!config.useLiveApis) {
    return {
      vehicles: mockVehicles,
      alerts: mockAlerts.filter((item) => item.type !== "Road incident"),
      source: sourceLabel(false, "Reproducible sample matching Translink GTFS-RT fields.")
    };
  }

  try {
    const [vehicleFeed, alertFeed] = await Promise.all([
      requestFeed("vehiclePositions"),
      requestFeed("alerts")
    ]);
    return {
      vehicles: normaliseVehicles(vehicleFeed),
      alerts: normaliseAlerts(alertFeed),
      source: sourceLabel(true, "Translink SEQ GTFS-Realtime vehicle positions and alerts.")
    };
  } catch (error) {
    return {
      vehicles: mockVehicles,
      alerts: mockAlerts.filter((item) => item.type !== "Road incident"),
      source: sourceLabel(false, `Translink fallback: ${error.message}`)
    };
  }
}

export async function getTripUpdates() {
  if (!config.useLiveApis) {
    return {
      updates: [{ routeId: "Gold Coast", delaySeconds: 420 }, { routeId: "66", delaySeconds: 120 }],
      source: sourceLabel(false, "Reproducible trip-update sample.")
    };
  }
  try {
    const feed = await requestFeed("tripUpdates");
    const updates = (feed.entity || [])
      .filter((entity) => entity.tripUpdate)
      .slice(0, 30)
      .map((entity) => ({
        routeId: entity.tripUpdate.trip?.routeId || "Unknown",
        tripId: entity.tripUpdate.trip?.tripId || "Unknown",
        delaySeconds: entity.tripUpdate.delay || entity.tripUpdate.stopTimeUpdate?.[0]?.arrival?.delay || 0
      }));
    return { updates, source: sourceLabel(true, "Translink SEQ GTFS-Realtime trip updates.") };
  } catch (error) {
    return {
      updates: [{ routeId: "Gold Coast", delaySeconds: 420 }, { routeId: "66", delaySeconds: 120 }],
      source: sourceLabel(false, `Trip-update fallback: ${error.message}`)
    };
  }
}

export const translinkApiDescription = {
  name: "Translink GTFS and GTFS-Realtime",
  authentication: "No authentication required for the documented GTFS-RT feed.",
  format: "Static GTFS ZIP plus GTFS-Realtime v2.0 Protocol Buffers.",
  functions: [
    "Static GTFS supplies routes, stops, scheduled trips and timetable reference data.",
    "VehiclePositions supplies current vehicle coordinates for the live tracking map.",
    "TripUpdates supplies predicted arrival changes and delay values.",
    "Alerts supplies disruptions and service notices for commuter warnings."
  ],
  internalRoutes: ["/api/dashboard", "/api/journey"],
  fallback: "Local representative vehicles, alerts and delay values."
};
