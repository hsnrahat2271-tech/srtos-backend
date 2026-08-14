import { config, sourceLabel } from "../config.mjs";
import { mockAlerts } from "../mockData.mjs";

function firstCoordinate(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point") return geometry.coordinates;
  const values = geometry.coordinates || geometry.geometries?.[0]?.coordinates;
  let cursor = values;
  while (Array.isArray(cursor) && Array.isArray(cursor[0])) cursor = cursor[0];
  return Array.isArray(cursor) ? cursor : null;
}

function normaliseEvent(feature, index) {
  const properties = feature.properties || {};
  const coordinate = firstCoordinate(feature.geometry);
  return {
    id: properties.id || properties.eventId || `qld-event-${index + 1}`,
    severity: properties.impact?.severity || properties.severity || "Advisory",
    type: properties.eventType || properties.type || "Traffic event",
    title: properties.description || properties.headline || "Queensland traffic event",
    location: properties.road || properties.locality || "Queensland road network",
    affected: properties.impact?.description || properties.direction || "Road users",
    advice: properties.advice || properties.whatToExpect || "Check conditions and allow additional time.",
    longitude: coordinate?.[0],
    latitude: coordinate?.[1],
    updated: properties.lastUpdated || properties.lastUpdatedDate || "Live feed"
  };
}

export async function getTrafficEvents() {
  const fallback = mockAlerts.filter((item) => item.type === "Road incident");
  if (!config.useLiveApis || !config.qldTrafficApiKey) {
    return {
      events: fallback,
      source: sourceLabel(false, config.qldTrafficApiKey ? "Live mode disabled." : "QLD_TRAFFIC_API_KEY not configured.")
    };
  }

  try {
    const url = new URL("/v2/events", config.qldTrafficBase);
    url.searchParams.set("apikey", config.qldTrafficApiKey);
    const response = await fetch(url, { headers: { "User-Agent": config.userAgent } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const geojson = await response.json();
    return {
      events: (geojson.features || []).slice(0, 30).map(normaliseEvent),
      source: sourceLabel(true, "QLDTraffic v2 events GeoJSON.")
    };
  } catch (error) {
    return {
      events: fallback,
      source: sourceLabel(false, `QLDTraffic fallback: ${error.message}`)
    };
  }
}

export const qldTrafficApiDescription = {
  name: "QLDTraffic GeoJSON API",
  authentication: "API key required; request limits are attached to the issued key.",
  format: "GeoJSON FeatureCollection.",
  functions: [
    "Supplies road incidents, crashes, congestion, flooding, roadworks, hazards and special events.",
    "Adds road conditions to disruption alerts and route-risk calculations.",
    "Provides event geometry for the commuter and authority maps."
  ],
  internalRoutes: ["/api/dashboard", "/api/authority/summary"],
  fallback: "Local representative road incident with a visible non-live label."
};
