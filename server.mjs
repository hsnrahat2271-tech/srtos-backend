import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { config, sourceLabel } from "./src/config.mjs";
import { getTrafficEvents, qldTrafficApiDescription } from "./src/adapters/qldTraffic.mjs";
import { mappingApiDescription, planJourney } from "./src/adapters/mapping.mjs";
import { getTranslinkSnapshot, getTripUpdates, translinkApiDescription } from "./src/adapters/translink.mjs";
import {
  calculateCongestionRisk,
  getCorridorPredictions,
  predictionServiceDescription
} from "./src/services/prediction.mjs";
import { mockAuthority } from "./src/mockData.mjs";
import {
  definitionOfDone,
  priorities,
  sprints,
  stories,
  teamMembers
} from "./src/projectData.mjs";

const root = fileURLToPath(new URL("./public/", import.meta.url));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(response, status, value) {
  const body = JSON.stringify(value, null, 2);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  response.end(body);
}

function sendError(response, error, status = 500) {
  sendJson(response, status, {
    error: error.message || "Unexpected error",
    source: sourceLabel(false, "Request failed safely.")
  });
}

async function dashboardPayload() {
  const [translink, traffic, tripUpdates] = await Promise.all([
    getTranslinkSnapshot(),
    getTrafficEvents(),
    getTripUpdates()
  ]);
  const delays = tripUpdates.updates.map((item) => Number(item.delaySeconds || 0) / 60);
  const averageDelayMinutes = delays.length
    ? delays.reduce((total, value) => total + value, 0) / delays.length
    : mockAuthority.averageDelay;
  const allAlerts = [...translink.alerts, ...traffic.events];
  const risk = calculateCongestionRisk({
    activeEvents: allAlerts.length,
    averageDelayMinutes,
    peakHour: true
  });
  return {
    summary: {
      activeVehicles: translink.vehicles.length,
      activeIncidents: allAlerts.length,
      averageDelay: Number(averageDelayMinutes.toFixed(1)),
      congestionRisk: risk.level,
      riskScore: risk.score
    },
    vehicles: translink.vehicles,
    alerts: allAlerts,
    predictions: getCorridorPredictions(),
    sources: {
      translink: translink.source,
      qldTraffic: traffic.source,
      tripUpdates: tripUpdates.source,
      prediction: sourceLabel(true, risk.method)
    }
  };
}

async function authorityPayload() {
  const dashboard = await dashboardPayload();
  return {
    ...mockAuthority,
    activeVehicles: dashboard.summary.activeVehicles || mockAuthority.activeVehicles,
    activeIncidents: dashboard.summary.activeIncidents,
    averageDelay: dashboard.summary.averageDelay,
    corridors: dashboard.predictions,
    alerts: dashboard.alerts,
    sources: dashboard.sources
  };
}

async function apiRoute(request, response, url) {
  if (url.pathname === "/api/health") {
    sendJson(response, 200, {
      status: "ok",
      project: "SRTOS-QLD",
      liveApisRequested: config.useLiveApis,
      qldTrafficKeyConfigured: Boolean(config.qldTrafficApiKey)
    });
    return true;
  }
  if (url.pathname === "/api/project/backlog") {
    sendJson(response, 200, { stories, priorities, definitionOfDone, teamMembers });
    return true;
  }
  if (url.pathname === "/api/project/sprints") {
    sendJson(response, 200, { sprints, stories, teamMembers, definitionOfDone });
    return true;
  }
  if (url.pathname === "/api/integrations") {
    sendJson(response, 200, {
      integrations: [
        translinkApiDescription,
        qldTrafficApiDescription,
        mappingApiDescription,
        predictionServiceDescription
      ],
      policy: "The interface labels fallback data. Live data is never claimed when a connector is unavailable."
    });
    return true;
  }
  if (url.pathname === "/api/dashboard") {
    sendJson(response, 200, await dashboardPayload());
    return true;
  }
  if (url.pathname === "/api/authority/summary") {
    sendJson(response, 200, await authorityPayload());
    return true;
  }
  if (url.pathname === "/api/journey") {
    const origin = url.searchParams.get("origin") || "";
    const destination = url.searchParams.get("destination") || "";
    const accessible = url.searchParams.get("accessible") === "true";
    try {
      sendJson(response, 200, await planJourney({ origin, destination, accessible }));
    } catch (error) {
      sendError(response, error, 400);
    }
    return true;
  }
  return false;
}

async function staticRoute(response, url) {
  const requested = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\/+/, "");
  const safe = normalize(requested).replace(/^(\.\.(\/|\\|$))+/, "");
  const path = join(root, safe);
  if (!path.startsWith(root)) return false;
  try {
    const info = await stat(path);
    if (!info.isFile()) return false;
    const data = await readFile(path);
    response.writeHead(200, {
      "Content-Type": mime[extname(path)] || "application/octet-stream",
      "Content-Length": data.length,
      "Cache-Control": "no-cache"
    });
    response.end(data);
    return true;
  } catch {
    return false;
  }
}

export function createServer() {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    try {
      if (url.pathname.startsWith("/api/") && (await apiRoute(request, response, url))) return;
      if (await staticRoute(response, url)) return;
      sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      sendError(response, error);
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createServer();
  server.listen(config.port, "127.0.0.1", () => {
    console.log(`SRTOS-QLD prototype running at http://127.0.0.1:${config.port}`);
  });
}
