# SRTOS QLD - Smart Transport & Route Operations System for Queensland

A real-time transit planning and monitoring system for South East Queensland, integrating live Translink GTFS-Realtime data, QLD Traffic API, and Project OSRM routing services.

**Live Demo:** https://srtos-qld-brisbane-smart-commute.lovable.app/

## Features

- **Live Transit Data**: Real-time bus, train, ferry, and tram services via Translink GTFS-Realtime
- **Traffic Integration**: Current traffic events and incidents from QLD Traffic API
- **Route Planning**: Trip planning with Project OSRM road routing and accessibility options
- **Congestion Risk Analysis**: Predictive congestion assessment based on active incidents and delays
- **Decision Support Dashboard**: Monitoring system for transport authorities
- **Fallback Data**: Graceful degradation with demonstration data when APIs unavailable

## Architecture

```
srtos-qld/
├── server.mjs                 # Node.js HTTP server & API routes
├── api_test.mjs              # API testing utility
├── capture.mjs               # Data capture utilities
├── export-evidence.mjs        # Evidence export for assessment
├── src/
│   ├── config.mjs            # Configuration & environment setup
│   ├── mockData.mjs          # Fallback demonstration data
│   ├── projectData.mjs       # Project tracking (sprints, stories, team)
│   ├── adapters/
│   │   ├── translink.mjs     # Translink GTFS-Realtime adapter
│   │   ├── qldTraffic.mjs    # QLD Traffic API adapter
│   │   └── mapping.mjs       # Route planning (OSRM + Nominatim)
│   └── services/
│       └── prediction.mjs    # Congestion risk prediction
└── public/                   # Static assets (HTML, CSS, JS frontend)
```

## API Endpoints

### Dashboard & Monitoring
- `GET /api/health` - Service health status
- `GET /api/dashboard` - Live dashboard data (vehicles, alerts, predictions)
- `GET /api/authority/summary` - Authority-level summary with corridors

### Integrations
- `GET /api/integrations` - Available data sources and fallback policy

### Trip Planning
- `GET /api/journey?origin=<location>&destination=<location>&accessible=<bool>` - Plan journey

### Project Tracking
- `GET /api/project/backlog` - Product backlog (stories, priorities, DoD)
- `GET /api/project/sprints` - Sprint information and team assignments

## Environment Setup

Create a `.env` file in the root directory:

```env
# Server
PORT=4173

# Data Sources
USE_LIVE_APIS=false

# Translink GTFS-Realtime
TRANSLINK_GTFS_RT_BASE=https://gtfsrt.api.translink.com.au/api/realtime/SEQ

# QLD Traffic API
QLD_TRAFFIC_BASE=https://api.qldtraffic.qld.gov.au
QLD_TRAFFIC_API_KEY=your_api_key_here

# Routing & Geocoding
NOMINATIM_BASE=https://nominatim.openstreetmap.org
OSRM_BASE=https://router.project-osrm.org

# User Agent for API requests
APP_USER_AGENT=SRTOS-QLD-Student-Prototype/1.0 student@example.edu
```

## Running Locally

### Prerequisites
- Node.js 16+

### Installation & Start
```bash
npm install
npm start
```

Server runs at `http://127.0.0.1:4173`

### Development Mode
```bash
npm run dev
```

### Testing
```bash
npm test
```

## Data Sources

| Source | Type | Format | Status |
|--------|------|--------|--------|
| **Translink** | Live Transit | GTFS-Realtime (Protobuf) | SEQ services |
| **QLD Traffic** | Traffic Events | JSON API | Queensland-wide |
| **Project OSRM** | Road Routing | REST API | Global coverage |
| **Nominatim** | Geocoding | REST API | OpenStreetMap |

All sources support fallback to demonstration data.

## Assessment Details

**Course:** INF302 - Information Systems Integration  
**Institution:** Australian International Institute of Higher Education (AIIHE)  
**Assessment:** Integrated IT System Project  

Decision support system demonstrating:
- Real-time data integration
- API adapter pattern
- Event-driven architecture
- Risk assessment algorithms
- System resilience & fallback strategies

## Key Technologies

- **Runtime**: Node.js (ES Modules)
- **Server**: Built-in HTTP module
- **Data Formats**: JSON, GTFS-Realtime (Protobuf)
- **APIs**: REST
- **Architecture**: Modular adapters with service layer

## Disclaimer

This is a **decision support and demonstration system only**. It does not purchase tickets, control infrastructure, or make autonomous transport decisions. All data is presented for informational purposes. Fallback data is used when live connectors are unavailable.

## License

MIT

## Author

Rahat - Australian International Institute of Higher Education

---

**Deployment:** Vercel (https://srtos-qld-brisbane-smart-commute.lovable.app/)  
**Last Updated:** August 2026
