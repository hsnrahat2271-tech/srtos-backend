import { config, sourceLabel } from "../config.mjs";
import { mockJourney } from "../mockData.mjs";

async function geocode(query) {
  const url = new URL("/search", config.nominatimBase);
  url.searchParams.set("q", `${query}, Queensland, Australia`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "au");
  const response = await fetch(url, {
    headers: { "User-Agent": config.userAgent, Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);
  const result = (await response.json())[0];
  if (!result) throw new Error(`No geocoding result for ${query}`);
  return { latitude: Number(result.lat), longitude: Number(result.lon), label: result.display_name };
}

async function roadRoute(origin, destination) {
  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = new URL(`/route/v1/driving/${coordinates}`, config.osrmBase);
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("alternatives", "true");
  url.searchParams.set("steps", "true");
  const response = await fetch(url, { headers: { "User-Agent": config.userAgent } });
  if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);
  return response.json();
}

export async function planJourney({ origin, destination, accessible = false }) {
  if (!origin || !destination) {
    throw new Error("Origin and destination are required.");
  }
  if (!config.useLiveApis) {
    return {
      ...mockJourney,
      origin,
      destination,
      accessible,
      source: sourceLabel(false, "Reproducible multimodal journey demonstration.")
    };
  }

  try {
    const [originPoint, destinationPoint] = await Promise.all([geocode(origin), geocode(destination)]);
    const route = await roadRoute(originPoint, destinationPoint);
    const road = route.routes?.[0];
    const minutes = road ? Math.max(1, Math.round(road.duration / 60)) : 0;
    return {
      ...mockJourney,
      origin,
      destination,
      accessible,
      options: [
        {
          id: "LIVE-ROAD",
          mode: "Road route",
          duration: minutes,
          eta: `${minutes} min from departure`,
          reliability: 80,
          transfers: 0,
          emissions: "Estimated",
          accessible: true,
          reason: "Live OSRM road calculation; public-transport options still use the GTFS demonstration layer.",
          steps: (road?.legs?.[0]?.steps || []).slice(0, 6).map((step) => step.name || step.maneuver?.type || "Continue")
        },
        ...mockJourney.options
      ],
      geometry: road?.geometry || null,
      source: sourceLabel(true, "Nominatim geocoding and OSRM road routing; GTFS demonstration for public transport.")
    };
  } catch (error) {
    return {
      ...mockJourney,
      origin,
      destination,
      accessible,
      source: sourceLabel(false, `Mapping fallback: ${error.message}`)
    };
  }
}

export const mappingApiDescription = {
  name: "Nominatim and OSRM mapping services",
  authentication: "No key in the prototype; production use must follow provider policy or use managed/self-hosted instances.",
  format: "JSON and GeoJSON.",
  functions: [
    "Nominatim converts origin and destination text into geographic coordinates.",
    "OSRM calculates road route geometry, distance, duration and alternative road paths.",
    "Public transport routing is not supplied by OSRM; SRTOS combines GTFS schedules with the road/walk layer."
  ],
  internalRoutes: ["/api/journey"],
  fallback: "Local multimodal journey options and route illustration."
};
