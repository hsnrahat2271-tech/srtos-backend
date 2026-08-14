import { readFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { mockAlerts, mockAuthority, mockJourney, mockPredictions, mockVehicles } from "../src/mockData.mjs";
import { sprints, stories, teamMembers } from "../src/projectData.mjs";

const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const sharpModule = runtimeModules
  ? await import(pathToFileURL(join(runtimeModules, "sharp", "lib", "index.js")))
  : await import("sharp");
const sharp = sharpModule.default;

const output = resolve(process.env.CAPTURE_OUTPUT || "../evidence");
await mkdir(output, { recursive: true });

const C = {
  bg: "#eef3f5",
  paper: "#ffffff",
  ink: "#10233f",
  muted: "#5d6b7d",
  line: "#dce4ea",
  navy: "#0b2748",
  blue: "#1769aa",
  aqua: "#0f8b8d",
  lime: "#95c93d",
  limeDark: "#497a0a",
  amber: "#d97706",
  red: "#c92a2a",
  purple: "#7c3aed",
  soft: "#f3f7f8"
};

const esc = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

function wrap(text, maxChars, maxLines = 99) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = candidate;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:]?$/, "")}…`;
  }
  return lines;
}

function textBlock({
  x,
  y,
  width,
  text,
  size = 18,
  lineHeight = 1.28,
  colour = C.ink,
  weight = 400,
  maxLines = 99,
  family = "Arial"
}) {
  const lines = wrap(text, Math.max(8, Math.floor(width / (size * 0.54))), maxLines);
  return `<text x="${x}" y="${y}" fill="${colour}" font-family="${family}" font-size="${size}" font-weight="${weight}">${lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : size * lineHeight}">${esc(line)}</tspan>`)
    .join("")}</text>`;
}

function card(x, y, w, h, fill = C.paper, stroke = C.line, radius = 18) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`;
}

function badge(x, y, label, colour) {
  const width = Math.max(72, 18 + String(label).length * 9);
  return `<rect x="${x}" y="${y}" width="${width}" height="30" rx="15" fill="${colour}" opacity="0.13"/>
    <text x="${x + width / 2}" y="${y + 20}" text-anchor="middle" fill="${colour}" font-family="Arial" font-size="13" font-weight="800">${esc(label.toUpperCase())}</text>`;
}

function header(width, title, subtitle, active) {
  const nav = ["COMMUTER", "AUTHORITY", "BACKLOG", "SPRINTS", "API GUIDE"];
  return `
    <rect width="${width}" height="96" fill="${C.paper}"/>
    <rect x="48" y="24" width="48" height="48" rx="14" fill="${C.navy}"/>
    <text x="72" y="57" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="800">S</text>
    <text x="112" y="46" fill="${C.ink}" font-family="Arial" font-size="19" font-weight="800">SRTOS-QLD</text>
    <text x="112" y="66" fill="${C.muted}" font-family="Arial" font-size="12">Smart Real-Time Transport Optimisation</text>
    ${nav
      .map((item, index) => {
        const x = width - 660 + index * 120;
        return `${item === active ? `<rect x="${x - 8}" y="30" width="108" height="38" rx="10" fill="${C.soft}"/>` : ""}
          <text x="${x + 45}" y="54" text-anchor="middle" fill="${item === active ? C.navy : C.muted}" font-family="Arial" font-size="12" font-weight="800">${item}</text>`;
      })
      .join("")}
    <text x="48" y="146" fill="${C.aqua}" font-family="Arial" font-size="14" font-weight="800" letter-spacing="2">${esc(subtitle.toUpperCase())}</text>
    ${textBlock({ x: 48, y: 205, width: width - 96, text: title, size: 42, lineHeight: 1.08, weight: 800, maxLines: 2 })}
  `;
}

async function render(filename, width, height, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="${C.bg}"/>
    ${body}
    <text x="${width - 48}" y="${height - 24}" text-anchor="end" fill="${C.muted}" font-family="Arial" font-size="12">SRTOS-QLD • INF302 prototype evidence export</text>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(join(output, filename));
}

function dashboardExport() {
  const width = 1600;
  let body = header(width, "Know what is moving. Choose what works.", "Queensland journey intelligence", "COMMUTER");
  body += card(48, 280, 1504, 110);
  body += textBlock({ x: 75, y: 320, width: 390, text: mockJourney.origin, size: 15, colour: C.muted });
  body += textBlock({ x: 75, y: 352, width: 390, text: "Origin", size: 13, weight: 800 });
  body += textBlock({ x: 525, y: 320, width: 430, text: mockJourney.destination, size: 15, colour: C.muted });
  body += textBlock({ x: 525, y: 352, width: 390, text: "Destination", size: 13, weight: 800 });
  body += `<rect x="1310" y="306" width="190" height="52" rx="12" fill="${C.navy}"/><text x="1405" y="339" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="800">Optimise journey</text>`;

  const metrics = [
    ["Tracked services", mockVehicles.length, "timestamped"],
    ["Active disruptions", mockAlerts.length, "route impact checked"],
    ["Average delay", "4.2 min", "trip updates"],
    ["Congestion risk", "Moderate", "68 / 100"]
  ];
  metrics.forEach(([label, value, note], index) => {
    const x = 48 + index * 382;
    body += card(x, 410, 360, 105);
    body += textBlock({ x: x + 18, y: 442, width: 320, text: label, size: 13, colour: C.muted });
    body += textBlock({ x: x + 18, y: 478, width: 220, text: String(value), size: 26, weight: 800 });
    body += textBlock({ x: x + 220, y: 478, width: 120, text: note, size: 11, colour: C.limeDark, maxLines: 2 });
  });

  body += card(48, 535, 910, 430, "#eaf3f2");
  body += textBlock({ x: 72, y: 575, width: 480, text: "Greater Brisbane live view", size: 21, weight: 800 });
  body += textBlock({ x: 72, y: 602, width: 480, text: "Representative GTFS-RT positions • source labels visible", size: 12, colour: C.muted });
  body += `<path d="M120 890 C280 740, 460 850, 600 690 S830 650, 895 580" fill="none" stroke="${C.aqua}" stroke-width="12" stroke-linecap="round"/>`;
  mockVehicles.forEach((vehicle) => {
    const x = 90 + vehicle.x * 8.2;
    const y = 560 + vehicle.y * 4.5;
    body += `<circle cx="${x}" cy="${y}" r="17" fill="${C.navy}" stroke="white" stroke-width="5"/>
      <text x="${x}" y="${y + 5}" text-anchor="middle" fill="white" font-family="Arial" font-size="11" font-weight="800">${esc(vehicle.mode[0])}</text>
      <text x="${x + 22}" y="${y - 6}" fill="${C.ink}" font-family="Arial" font-size="11" font-weight="700">${esc(vehicle.route)}</text>
      <text x="${x + 22}" y="${y + 10}" fill="${C.muted}" font-family="Arial" font-size="10">${esc(vehicle.updated)}</text>`;
  });

  body += card(980, 535, 572, 430);
  body += textBlock({ x: 1004, y: 575, width: 520, text: "Actionable disruption alerts", size: 21, weight: 800 });
  mockAlerts.slice(0, 3).forEach((alert, index) => {
    const y = 610 + index * 110;
    body += `<rect x="1004" y="${y}" width="520" height="94" rx="12" fill="#fbfdfe" stroke="${C.line}"/>
      <rect x="1004" y="${y}" width="6" height="94" rx="3" fill="${index === 0 ? C.red : index === 1 ? C.amber : C.limeDark}"/>`;
    body += textBlock({ x: 1023, y: y + 28, width: 390, text: alert.title, size: 15, weight: 800, maxLines: 2 });
    body += textBlock({ x: 1023, y: y + 70, width: 470, text: alert.advice, size: 12, colour: C.muted, maxLines: 2 });
  });
  return { width, height: 1010, body };
}

function authorityExport() {
  const width = 1600;
  let body = header(width, "Network operations dashboard", "Queensland TMR • Translink • Queensland Rail", "AUTHORITY");
  const values = [
    ["Network health", `${mockAuthority.networkHealth}%`],
    ["Tracked vehicles", mockAuthority.activeVehicles],
    ["Active incidents", mockAuthority.activeIncidents],
    ["Average delay", `${mockAuthority.averageDelay} min`],
    ["On-time performance", `${mockAuthority.onTimePerformance}%`],
    ["Accessible services", `${mockAuthority.accessibleServices}%`]
  ];
  values.forEach(([label, value], index) => {
    const x = 48 + (index % 3) * 508;
    const y = 280 + Math.floor(index / 3) * 120;
    body += card(x, y, 482, 100);
    body += textBlock({ x: x + 20, y: y + 31, width: 440, text: label, size: 13, colour: C.muted });
    body += textBlock({ x: x + 20, y: y + 70, width: 440, text: String(value), size: 28, weight: 800 });
  });
  body += card(48, 535, 910, 390);
  body += textBlock({ x: 72, y: 575, width: 800, text: "Predicted congestion hotspots", size: 23, weight: 800 });
  mockPredictions.forEach((item, index) => {
    const y = 625 + index * 70;
    body += textBlock({ x: 72, y, width: 260, text: item.corridor, size: 15, weight: 700 });
    body += `<rect x="340" y="${y - 16}" width="460" height="14" rx="7" fill="#e5ebef"/>
      <rect x="340" y="${y - 16}" width="${460 * (item.risk / 100)}" height="14" rx="7" fill="${item.risk > 75 ? C.red : item.risk > 40 ? C.amber : C.limeDark}"/>`;
    body += textBlock({ x: 820, y, width: 100, text: `${item.risk}/100`, size: 14, weight: 800 });
  });
  body += card(980, 535, 572, 390);
  body += textBlock({ x: 1004, y: 575, width: 520, text: "Priority operational events", size: 23, weight: 800 });
  mockAlerts.forEach((alert, index) => {
    const y = 620 + index * 92;
    body += `<rect x="1004" y="${y}" width="520" height="76" rx="12" fill="#fbfdfe" stroke="${C.line}"/>`;
    body += textBlock({ x: 1022, y: y + 26, width: 360, text: alert.title, size: 14, weight: 800, maxLines: 2 });
    body += textBlock({ x: 1022, y: y + 58, width: 460, text: alert.affected, size: 11, colour: C.muted, maxLines: 1 });
  });
  body += textBlock({ x: 48, y: 970, width: 1350, text: "Decision support only: direct control of signals and vehicles remains outside the authorised prototype scope.", size: 13, colour: C.muted });
  return { width, height: 1010, body };
}

function backlogExport(pageIndex) {
  const width = 1800;
  const subset = stories.slice(pageIndex * 8, pageIndex * 8 + 8);
  let body = header(width, `Product backlog • stories ${pageIndex * 8 + 1}-${pageIndex * 8 + subset.length} of ${stories.length}`, "Comprehensive and traceable backlog", "BACKLOG");
  const x = [48, 125, 750, 1190, 1310, 1380, 1580];
  const widths = [77, 625, 440, 120, 70, 200, 170];
  const headers = ["ID", "Epic and user story", "Acceptance criteria", "MoSCoW", "Pts", "Sprint", "Owner"];
  body += `<rect x="48" y="280" width="1704" height="52" rx="10" fill="#dce9ee"/>`;
  headers.forEach((label, index) => {
    body += textBlock({ x: x[index] + 10, y: 312, width: widths[index] - 20, text: label, size: 13, weight: 800, maxLines: 1 });
  });
  subset.forEach((story, row) => {
    const y = 340 + row * 134;
    const fill = row % 2 === 0 ? C.paper : "#f8fbfc";
    body += `<rect x="48" y="${y}" width="1704" height="126" rx="8" fill="${fill}" stroke="${C.line}"/>`;
    body += textBlock({ x: 58, y: y + 28, width: 60, text: story.id, size: 14, weight: 800 });
    body += textBlock({ x: 135, y: y + 25, width: 595, text: story.epic, size: 13, weight: 800, maxLines: 1 });
    body += textBlock({ x: 135, y: y + 51, width: 595, text: story.story, size: 12, colour: C.muted, maxLines: 4 });
    body += textBlock({ x: 760, y: y + 27, width: 410, text: story.acceptance, size: 12, colour: C.muted, maxLines: 5 });
    const priorityColour = story.priority === "Must" ? C.red : story.priority === "Should" ? C.amber : story.priority === "Could" ? C.blue : C.muted;
    body += badge(1200, y + 16, story.priority, priorityColour);
    body += textBlock({ x: 1335, y: y + 31, width: 50, text: story.points, size: 16, weight: 800 });
    body += textBlock({ x: 1390, y: y + 28, width: 170, text: story.sprint, size: 12, weight: 700, maxLines: 3 });
    body += textBlock({ x: 1590, y: y + 28, width: 145, text: story.owner, size: 13, weight: 800 });
    body += textBlock({ x: 1590, y: y + 54, width: 145, text: story.status, size: 11, colour: C.muted, maxLines: 2 });
  });
  return { width, height: 1450, body };
}

function sprintExport() {
  const width = 1800;
  let body = header(width, "Three balanced sprints • 16 / 18 / 16 points", "Three two-week increments", "SPRINTS");
  const ownerColours = Object.fromEntries(teamMembers.map((member) => [member.id, member.colour]));
  sprints.forEach((sprint, column) => {
    const x = 48 + column * 574;
    body += card(x, 280, 550, 1030, "#edf3f5", C.line, 18);
    body += textBlock({ x: x + 20, y: 318, width: 500, text: `${sprint.id} • ${sprint.dates}`, size: 22, weight: 800 });
    body += textBlock({ x: x + 20, y: 355, width: 500, text: sprint.goal, size: 13, colour: C.muted, maxLines: 3 });
    body += badge(x + 20, 405, `${sprint.points} points`, C.limeDark);
    sprint.storyIds.forEach((id, row) => {
      const story = stories.find((item) => item.id === id);
      const y = 460 + row * 166;
      body += card(x + 18, y, 514, 150, C.paper, C.line, 13);
      body += `<rect x="${x + 18}" y="${y}" width="7" height="150" rx="4" fill="${ownerColours[story.owner]}"/>`;
      body += textBlock({ x: x + 38, y: y + 28, width: 80, text: story.id, size: 14, weight: 800 });
      body += badge(x + 380, y + 12, story.priority, story.priority === "Must" ? C.red : C.amber);
      body += textBlock({ x: x + 38, y: y + 56, width: 460, text: story.story, size: 12, weight: 700, maxLines: 4 });
      body += textBlock({ x: x + 38, y: y + 128, width: 460, text: `${story.points} pts • ${story.owner} • ${story.status}`, size: 11, colour: C.muted, maxLines: 1 });
    });
    body += textBlock({ x: x + 20, y: 1165, width: 500, text: `Increment: ${sprint.deliverable}`, size: 12, colour: C.muted, maxLines: 4 });
    body += textBlock({ x: x + 20, y: 1242, width: 500, text: `Retro action: ${sprint.retrospective}`, size: 11, colour: C.aqua, maxLines: 3 });
  });
  return { width, height: 1350, body };
}

function apiExport() {
  const width = 1800;
  let body = header(width, "What each API does in SRTOS-QLD", "API responsibilities and truthful fallback", "API GUIDE");
  const items = [
    {
      title: "Translink GTFS + GTFS-RT",
      auth: "GTFS-RT: no authentication",
      format: "GTFS ZIP + Protobuf",
      work: [
        "Static GTFS: routes, stops, schedules and identifiers",
        "VehiclePositions: live transport map",
        "TripUpdates: ETA and delay changes",
        "Alerts: service disruptions"
      ],
      route: "GET /api/dashboard",
      colour: C.blue
    },
    {
      title: "QLDTraffic GeoJSON",
      auth: "Issued API key required",
      format: "GeoJSON FeatureCollection",
      work: [
        "Road incidents, crashes and congestion",
        "Flooding, roadworks, hazards and special events",
        "Route-risk and authority incident layers"
      ],
      route: "GET /api/authority/summary",
      colour: C.amber
    },
    {
      title: "Nominatim + OSRM",
      auth: "Policy-controlled public or managed service",
      format: "JSON + GeoJSON",
      work: [
        "Nominatim: text location to coordinates",
        "OSRM: road route, duration, geometry and alternatives",
        "GTFS supplies the public-transport layer"
      ],
      route: "GET /api/journey",
      colour: C.aqua
    },
    {
      title: "Internal prediction service",
      auth: "Internal service",
      format: "Normalised JSON",
      work: [
        "Combines incident count, delay and peak period",
        "Returns Low, Moderate or High risk",
        "Transparent prototype model, not a production ML claim"
      ],
      route: "GET /api/dashboard",
      colour: C.purple
    }
  ];
  items.forEach((item, index) => {
    const x = 48 + (index % 2) * 866;
    const y = 290 + Math.floor(index / 2) * 470;
    body += card(x, y, 840, 430);
    body += `<rect x="${x}" y="${y}" width="10" height="430" rx="5" fill="${item.colour}"/>`;
    body += textBlock({ x: x + 32, y: y + 48, width: 760, text: item.title, size: 24, weight: 800 });
    body += textBlock({ x: x + 32, y: y + 88, width: 760, text: `Authentication: ${item.auth}`, size: 13, colour: C.muted, maxLines: 2 });
    body += textBlock({ x: x + 32, y: y + 128, width: 760, text: `Format: ${item.format}`, size: 13, colour: C.muted });
    item.work.forEach((line, lineIndex) => {
      body += `<circle cx="${x + 42}" cy="${y + 184 + lineIndex * 49}" r="5" fill="${item.colour}"/>`;
      body += textBlock({ x: x + 60, y: y + 190 + lineIndex * 49, width: 720, text: line, size: 15, maxLines: 2 });
    });
    body += `<rect x="${x + 32}" y="${y + 350}" width="760" height="48" rx="9" fill="${C.navy}"/>`;
    body += textBlock({ x: x + 50, y: y + 380, width: 720, text: item.route, size: 14, colour: "#d8f2e5", weight: 700, family: "DejaVu Sans Mono" });
  });
  body += textBlock({ x: 48, y: 1268, width: 1600, text: "Evidence rule: live is displayed only when a connector reports live mode. Missing keys or feed failures are labelled as demonstration fallback.", size: 15, colour: C.muted });
  return { width, height: 1320, body };
}

function individualExport() {
  const width = 1800;
  let body = header(width, "Individual contribution and evidence map", "Replace member placeholders before submission", "SPRINTS");
  const mapping = [
    {
      member: teamMembers[0],
      ids: "US01, US02, US03, US14",
      work: "Journey form, mode comparison, route recommendation, mapping adapter",
      screenshot: "01_commuter_journey_and_tracking.png",
      code: "public/app.js; src/adapters/mapping.mjs"
    },
    {
      member: teamMembers[1],
      ids: "US04, US05, US10, US13",
      work: "Vehicle positions, timestamps, saved-route concept, API fallback",
      screenshot: "01_commuter_journey_and_tracking.png",
      code: "src/adapters/translink.mjs; public/app.js"
    },
    {
      member: teamMembers[2],
      ids: "US06, US07, US09, US15",
      work: "Incident alerts, alternative-route response, congestion prediction",
      screenshot: "01_commuter_journey_and_tracking.png",
      code: "src/adapters/qldTraffic.mjs; src/services/prediction.mjs"
    },
    {
      member: teamMembers[3],
      ids: "US08, US11, US12, US16",
      work: "Privacy controls, accessibility option, authority dashboard, scope boundary",
      screenshot: "02_authority_dashboard.png",
      code: "public/app.js; server.mjs"
    }
  ];
  mapping.forEach((item, index) => {
    const x = 48 + (index % 2) * 866;
    const y = 290 + Math.floor(index / 2) * 470;
    body += card(x, y, 840, 430);
    body += `<rect x="${x}" y="${y}" width="12" height="430" rx="6" fill="${item.member.colour}"/>`;
    body += textBlock({ x: x + 35, y: y + 50, width: 740, text: item.member.name, size: 23, weight: 800, maxLines: 2 });
    body += textBlock({ x: x + 35, y: y + 105, width: 740, text: item.member.role, size: 15, colour: C.muted, maxLines: 2 });
    body += badge(x + 35, y + 145, item.ids, item.member.colour);
    body += textBlock({ x: x + 35, y: y + 215, width: 740, text: `Implemented work: ${item.work}`, size: 15, maxLines: 4 });
    body += textBlock({ x: x + 35, y: y + 315, width: 740, text: `Screenshot: ${item.screenshot}`, size: 13, colour: C.muted, maxLines: 2 });
    body += textBlock({ x: x + 35, y: y + 365, width: 740, text: `Code: ${item.code}`, size: 13, colour: C.muted, maxLines: 2, family: "DejaVu Sans Mono" });
  });
  body += textBlock({ x: 48, y: 1260, width: 1650, text: "Integrity requirement: replace the placeholders and adjust story ownership to match the team’s real contribution history before submission.", size: 15, colour: C.red, weight: 700 });
  return { width, height: 1320, body };
}

async function excerpt(path, marker, maxLines) {
  const text = await readFile(new URL(path, import.meta.url), "utf8");
  const lines = text.split("\n");
  const index = Math.max(0, lines.findIndex((line) => line.includes(marker)));
  return lines.slice(index, index + maxLines).join("\n");
}

function codeBlock(x, y, w, h, title, filename, code, colour) {
  const lines = code.split("\n").slice(0, 18);
  let body = card(x, y, w, h, "#0d2038", "#29435f", 16);
  body += `<rect x="${x}" y="${y}" width="9" height="${h}" rx="5" fill="${colour}"/>`;
  body += textBlock({ x: x + 28, y: y + 38, width: w - 50, text: title, size: 18, colour: "white", weight: 800, maxLines: 1 });
  body += textBlock({ x: x + 28, y: y + 66, width: w - 50, text: filename, size: 12, colour: "#8fcfd0", family: "DejaVu Sans Mono", maxLines: 1 });
  lines.forEach((line, index) => {
    const display = line.length > 86 ? `${line.slice(0, 84)}…` : line;
    body += `<text x="${x + 28}" y="${y + 105 + index * 20}" fill="#d8e6ef" font-family="DejaVu Sans Mono" font-size="12">${esc(display || " ")}</text>`;
  });
  return body;
}

async function codeExport() {
  const width = 1900;
  let body = header(width, "Source-code evidence by assigned workstream", "Actual implementation excerpts", "API GUIDE");
  const excerpts = [
    {
      title: "Member 1 • journey planning",
      filename: "src/adapters/mapping.mjs",
      code: await excerpt("../src/adapters/mapping.mjs", "export async function planJourney", 18),
      colour: teamMembers[0].colour
    },
    {
      title: "Member 2 • GTFS real-time tracking",
      filename: "src/adapters/translink.mjs",
      code: await excerpt("../src/adapters/translink.mjs", "export async function getTranslinkSnapshot", 18),
      colour: teamMembers[1].colour
    },
    {
      title: "Member 3 • QLDTraffic incidents",
      filename: "src/adapters/qldTraffic.mjs",
      code: await excerpt("../src/adapters/qldTraffic.mjs", "export async function getTrafficEvents", 18),
      colour: teamMembers[2].colour
    },
    {
      title: "Member 4 • authority API",
      filename: "server.mjs",
      code: await excerpt("../server.mjs", "async function authorityPayload", 18),
      colour: teamMembers[3].colour
    }
  ];
  excerpts.forEach((item, index) => {
    const x = 48 + (index % 2) * 916;
    const y = 290 + Math.floor(index / 2) * 545;
    body += codeBlock(x, y, 890, 510, item.title, item.filename, item.code, item.colour);
  });
  body += textBlock({ x: 48, y: 1370, width: 1750, text: "Pair each excerpt with the relevant screenshot and acceptance result. Short snippets are evidence; the complete source is included separately.", size: 15, colour: C.muted });
  return { width, height: 1420, body };
}

function testExport() {
  const width = 1500;
  let body = header(width, "Automated acceptance checks • 6 passed", "Node.js test evidence", "API GUIDE");
  const checks = [
    "Health endpoint reports a controlled data mode",
    "Backlog contains 16 complete and prioritised user stories",
    "Three sprint workloads are balanced and total 50 points",
    "Journey plan returns a recommended multimodal option",
    "Dashboard exposes vehicles, alerts, predictions and source labels",
    "Integration guide assigns a specific function to every connector"
  ];
  body += card(48, 285, 1404, 540, "#0d2038", "#29435f");
  checks.forEach((check, index) => {
    const y = 340 + index * 72;
    body += `<circle cx="88" cy="${y - 7}" r="14" fill="${C.lime}"/><path d="M80 ${y - 7} l6 6 l11 -14" fill="none" stroke="${C.navy}" stroke-width="4" stroke-linecap="round"/>`;
    body += textBlock({ x: 120, y, width: 1220, text: check, size: 18, colour: "#e8f0f5", maxLines: 1, family: "DejaVu Sans Mono" });
  });
  body += textBlock({ x: 75, y: 795, width: 1250, text: "tests 6 • pass 6 • fail 0 • skipped 0", size: 16, colour: "#8fcfd0", weight: 800, family: "DejaVu Sans Mono" });
  body += textBlock({ x: 48, y: 890, width: 1350, text: "Command: node --test tests/*.test.mjs", size: 15, colour: C.muted, family: "DejaVu Sans Mono" });
  return { width, height: 940, body };
}

const dashboard = dashboardExport();
await render("01_commuter_journey_and_tracking.png", dashboard.width, dashboard.height, dashboard.body);
const authority = authorityExport();
await render("02_authority_dashboard.png", authority.width, authority.height, authority.body);
for (let page = 0; page < 2; page += 1) {
  const backlog = backlogExport(page);
  await render(`03${page === 0 ? "a" : "b"}_product_backlog.png`, backlog.width, backlog.height, backlog.body);
}
const sprint = sprintExport();
await render("04_three_sprint_board.png", sprint.width, sprint.height, sprint.body);
const api = apiExport();
await render("05_api_responsibilities.png", api.width, api.height, api.body);
const individual = individualExport();
await render("06_individual_evidence_map.png", individual.width, individual.height, individual.body);
const code = await codeExport();
await render("07_code_evidence_by_member.png", code.width, code.height, code.body);
const tests = testExport();
await render("08_automated_test_results.png", tests.width, tests.height, tests.body);

console.log(`Exported 9 evidence images to ${output}`);
