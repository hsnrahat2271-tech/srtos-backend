export const mockVehicles = [
  { id: "BUS-66", mode: "Bus", route: "66", x: 22, y: 66, delayMinutes: 2, updated: "30 sec ago" },
  { id: "RAIL-IP", mode: "Train", route: "Ipswich", x: 43, y: 48, delayMinutes: 4, updated: "44 sec ago" },
  { id: "FERRY-C1", mode: "Ferry", route: "CityCat", x: 61, y: 58, delayMinutes: 0, updated: "18 sec ago" },
  { id: "BUS-111", mode: "Bus", route: "111", x: 72, y: 36, delayMinutes: 1, updated: "35 sec ago" },
  { id: "RAIL-GC", mode: "Train", route: "Gold Coast", x: 82, y: 70, delayMinutes: 7, updated: "51 sec ago" }
];

export const mockAlerts = [
  {
    id: "ALT-101",
    severity: "High",
    type: "Rail delay",
    title: "Signal fault near South Brisbane",
    location: "South Brisbane station",
    affected: "Gold Coast and Beenleigh lines",
    advice: "Allow 12 extra minutes or use route 111 bus.",
    updated: "4 min ago"
  },
  {
    id: "ALT-102",
    severity: "Moderate",
    type: "Road incident",
    title: "Lane restriction on Coronation Drive",
    location: "Milton inbound",
    affected: "Bus routes 444 and 453",
    advice: "Route optimiser is avoiding the affected corridor.",
    updated: "9 min ago"
  },
  {
    id: "ALT-103",
    severity: "Low",
    type: "Ferry notice",
    title: "CityCat boarding change",
    location: "North Quay terminal",
    affected: "CityCat services",
    advice: "Use temporary pontoon B.",
    updated: "16 min ago"
  }
];

export const mockPredictions = [
  { corridor: "Coronation Drive", risk: 82, level: "High", delay: 14, factor: "Incident + peak demand" },
  { corridor: "Pacific Motorway", risk: 68, level: "Moderate", delay: 9, factor: "Peak demand" },
  { corridor: "Inner City rail", risk: 57, level: "Moderate", delay: 7, factor: "Signal fault" },
  { corridor: "Brisbane River ferries", risk: 19, level: "Low", delay: 1, factor: "Normal conditions" }
];

export const mockJourney = {
  origin: "South Bank, Brisbane",
  destination: "University of Queensland, St Lucia",
  generatedAt: "Demo snapshot",
  recommendedId: "J1",
  options: [
    {
      id: "J1",
      mode: "Bus + walk",
      duration: 24,
      eta: "08:54",
      reliability: 91,
      transfers: 0,
      emissions: "Low",
      accessible: true,
      reason: "Fastest reliable option; avoids Coronation Drive incident.",
      steps: ["Walk 4 min to Cultural Centre", "Bus 66 to UQ Lakes", "Walk 2 min to destination"]
    },
    {
      id: "J2",
      mode: "Ferry + walk",
      duration: 31,
      eta: "09:01",
      reliability: 96,
      transfers: 0,
      emissions: "Low",
      accessible: true,
      reason: "Most reliable and scenic option.",
      steps: ["Walk 6 min to South Bank terminal", "CityCat to UQ St Lucia", "Walk 3 min"]
    },
    {
      id: "J3",
      mode: "Cycle",
      duration: 27,
      eta: "08:57",
      reliability: 88,
      transfers: 0,
      emissions: "Zero",
      accessible: false,
      reason: "Lowest-emission option using separated paths.",
      steps: ["Join Bicentennial Bikeway", "Cross Eleanor Schonell Bridge", "Enter UQ via College Road"]
    }
  ]
};

export const mockAuthority = {
  networkHealth: 91,
  activeVehicles: 438,
  activeIncidents: 7,
  averageDelay: 4.2,
  onTimePerformance: 87,
  accessibleServices: 94,
  feedFreshness: "42 seconds",
  corridors: mockPredictions
};
