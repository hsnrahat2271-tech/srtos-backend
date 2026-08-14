const truthy = new Set(["1", "true", "yes", "on"]);

export const config = {
  port: Number(process.env.PORT || 4173),
  useLiveApis: truthy.has(String(process.env.USE_LIVE_APIS || "false").toLowerCase()),
  translinkBase: process.env.TRANSLINK_GTFS_RT_BASE || "https://gtfsrt.api.translink.com.au/api/realtime/SEQ",
  qldTrafficBase: process.env.QLD_TRAFFIC_BASE || "https://api.qldtraffic.qld.gov.au",
  qldTrafficApiKey: process.env.QLD_TRAFFIC_API_KEY || "",
  nominatimBase: process.env.NOMINATIM_BASE || "https://nominatim.openstreetmap.org",
  osrmBase: process.env.OSRM_BASE || "https://router.project-osrm.org",
  userAgent: process.env.APP_USER_AGENT || "SRTOS-QLD-Student-Prototype/1.0 student@example.edu"
};

export function sourceLabel(live, detail) {
  return {
    mode: live ? "live" : "demonstration fallback",
    detail,
    generatedAt: new Date().toISOString()
  };
}
