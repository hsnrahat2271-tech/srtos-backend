export const teamMembers = [
  {
    id: "M1",
    name: "Member 1 - replace with name",
    role: "Journey planning and mapping",
    colour: "#2563eb"
  },
  {
    id: "M2",
    name: "Member 2 - replace with name",
    role: "Real-time tracking and GTFS",
    colour: "#0891b2"
  },
  {
    id: "M3",
    name: "Member 3 - replace with name",
    role: "Incidents and prediction",
    colour: "#d97706"
  },
  {
    id: "M4",
    name: "Member 4 - replace with name",
    role: "Accessibility, privacy and authority dashboard",
    colour: "#7c3aed"
  }
];

export const stories = [
  {
    id: "US01",
    epic: "Multimodal journey planning",
    story: "As a commuter, I want to enter an origin and destination so that I can plan a Queensland journey.",
    acceptance: "Valid locations produce journey results; missing locations show a clear validation message.",
    priority: "Must",
    rationale: "Starts the core user journey.",
    points: 5,
    dependency: "None",
    sprint: "Sprint 1",
    owner: "M1",
    status: "Done"
  },
  {
    id: "US02",
    epic: "Multimodal journey planning",
    story: "As a commuter, I want to compare bus, train, ferry, tram, walking, cycling and car options so that I can choose the most suitable mode.",
    acceptance: "At least three relevant mode options display with duration and interchange information.",
    priority: "Must",
    rationale: "Directly solves fragmented mode comparison.",
    points: 5,
    dependency: "US01",
    sprint: "Sprint 1",
    owner: "M1",
    status: "Done"
  },
  {
    id: "US03",
    epic: "Smart route optimisation",
    story: "As a commuter, I want the system to recommend the fastest reliable route so that I can arrive on time.",
    acceptance: "One option is labelled Recommended and includes ETA, duration and reason for selection.",
    priority: "Must",
    rationale: "Provides the central optimisation benefit.",
    points: 3,
    dependency: "US02",
    sprint: "Sprint 1",
    owner: "M1",
    status: "Done"
  },
  {
    id: "US04",
    epic: "Real-time transport tracking",
    story: "As a commuter, I want to see live service positions so that I know where my transport is.",
    acceptance: "The map shows service ID, mode, position and last update for available vehicles.",
    priority: "Must",
    rationale: "Core real-time capability promised in Assessment 1.",
    points: 5,
    dependency: "Translink GTFS and GTFS-RT",
    sprint: "Sprint 2",
    owner: "M2",
    status: "Done"
  },
  {
    id: "US05",
    epic: "Real-time transport tracking",
    story: "As a commuter, I want service status and data timestamps so that I can judge whether information is current.",
    acceptance: "Each live panel displays source mode, freshness and the most recent update time.",
    priority: "Must",
    rationale: "Prevents misleading travel decisions.",
    points: 3,
    dependency: "US04",
    sprint: "Sprint 2",
    owner: "M2",
    status: "Done"
  },
  {
    id: "US06",
    epic: "Delay and incident alerts",
    story: "As a commuter, I want disruption alerts for my route so that I can respond before I am delayed.",
    acceptance: "Relevant alerts show severity, location, affected service and recommended action.",
    priority: "Must",
    rationale: "Addresses unpredictable disruptions.",
    points: 5,
    dependency: "US01, Translink alerts, QLDTraffic",
    sprint: "Sprint 2",
    owner: "M3",
    status: "Done"
  },
  {
    id: "US07",
    epic: "Smart route optimisation",
    story: "As a commuter, I want an alternative route when disruption affects my journey so that I can continue travelling.",
    acceptance: "An affected journey displays at least one alternative with a revised ETA and explanation.",
    priority: "Must",
    rationale: "Turns alerts into an actionable outcome.",
    points: 5,
    dependency: "US03, US06",
    sprint: "Sprint 2",
    owner: "M3",
    status: "Done"
  },
  {
    id: "US08",
    epic: "Platform quality",
    story: "As a user, I want control over saved location data so that my travel information remains private.",
    acceptance: "Location storage requires consent; the user can clear saved journey data.",
    priority: "Must",
    rationale: "Location data creates a material privacy risk.",
    points: 3,
    dependency: "None",
    sprint: "Sprint 1",
    owner: "M4",
    status: "Done"
  },
  {
    id: "US09",
    epic: "Predictive congestion analysis",
    story: "As a commuter, I want predicted congestion risk so that I can avoid likely delays.",
    acceptance: "The system displays Low, Moderate or High risk with contributing factors and forecast window.",
    priority: "Should",
    rationale: "High value but the MVP can function without prediction.",
    points: 5,
    dependency: "US04, US05, historical observations",
    sprint: "Sprint 3",
    owner: "M3",
    status: "Done"
  },
  {
    id: "US10",
    epic: "Personalisation",
    story: "As a regular commuter, I want to save a journey and receive updates so that I do not need to re-enter it every day.",
    acceptance: "A journey can be saved, listed and linked to relevant disruption notifications.",
    priority: "Should",
    rationale: "Improves repeat use but is not essential to first use.",
    points: 3,
    dependency: "US06, US08",
    sprint: "Sprint 3",
    owner: "M2",
    status: "Done"
  },
  {
    id: "US11",
    epic: "Accessibility",
    story: "As a traveller with accessibility needs, I want accessible route preferences so that unsuitable options are excluded.",
    acceptance: "Users can select step-free travel and accessible options are visibly identified.",
    priority: "Should",
    rationale: "Supports inclusive transport and broader user needs.",
    points: 3,
    dependency: "US01",
    sprint: "Sprint 3",
    owner: "M4",
    status: "Done"
  },
  {
    id: "US12",
    epic: "Transport authority dashboard",
    story: "As a Queensland transport planner, I want a network dashboard so that I can identify disruptions and congestion hotspots.",
    acceptance: "The dashboard shows active incidents, service health, average delay and high-risk corridors.",
    priority: "Should",
    rationale: "Delivers stakeholder value beyond the commuter app.",
    points: 5,
    dependency: "US04, US06, US09",
    sprint: "Sprint 3",
    owner: "M4",
    status: "Done"
  },
  {
    id: "US13",
    epic: "Platform quality",
    story: "As a commuter, I want cached information during an API outage so that the app remains informative.",
    acceptance: "When a connector fails, the interface displays cached data and a visible fallback label.",
    priority: "Could",
    rationale: "Improves resilience after the core workflow is complete.",
    points: 3,
    dependency: "US04, US06",
    sprint: "Future / stretch",
    owner: "M2",
    status: "Prototype"
  },
  {
    id: "US14",
    epic: "Sustainability insight",
    story: "As a commuter, I want an estimated emissions comparison so that I can choose a lower-emission journey.",
    acceptance: "Journey options display a clearly labelled estimated emissions indicator.",
    priority: "Could",
    rationale: "Supports sustainability without blocking the MVP.",
    points: 3,
    dependency: "US02",
    sprint: "Future / stretch",
    owner: "M1",
    status: "Backlog"
  },
  {
    id: "US15",
    epic: "Ticketing",
    story: "As a passenger, I want to purchase fares in the app so that planning and payment occur in one place.",
    acceptance: "Deferred and not implemented in this release.",
    priority: "Won't",
    rationale: "Payment integration is excluded from the agreed prototype scope.",
    points: 8,
    dependency: "Payment provider and fare rules",
    sprint: "Future release",
    owner: "M3",
    status: "Deferred"
  },
  {
    id: "US16",
    epic: "Infrastructure control",
    story: "As a traffic operator, I want the system to control signals directly so that congestion can be actively managed.",
    acceptance: "Deferred and not implemented in this release.",
    priority: "Won't",
    rationale: "Requires regulated infrastructure access outside project authority.",
    points: 13,
    dependency: "TMR operational approval and safety integration",
    sprint: "Future release",
    owner: "M4",
    status: "Deferred"
  }
];

export const sprints = [
  {
    id: "Sprint 1",
    dates: "Weeks 1-2",
    goal: "Deliver a secure, usable end-to-end journey planning increment.",
    storyIds: ["US01", "US02", "US03", "US08"],
    points: 16,
    deliverable: "Responsive journey planner with mode comparison, recommendation and privacy controls.",
    review: "Commuter walkthrough; feedback requested on clarity of options and location consent.",
    retrospective: "Split long UI stories into smaller testable states before Sprint 2."
  },
  {
    id: "Sprint 2",
    dates: "Weeks 3-4",
    goal: "Add live transport visibility and actionable disruption response.",
    storyIds: ["US04", "US05", "US06", "US07"],
    points: 18,
    deliverable: "Live service panel, timestamps, incident alerts and alternative-route response.",
    review: "Demonstrate a simulated disruption; verify alerts are understandable and actionable.",
    retrospective: "Introduce adapter fallbacks after observing dependency on external feeds."
  },
  {
    id: "Sprint 3",
    dates: "Weeks 5-6",
    goal: "Refine the product with prediction, accessibility and authority insight.",
    storyIds: ["US09", "US10", "US11", "US12"],
    points: 16,
    deliverable: "Congestion forecast, saved routes, accessible preferences and authority dashboard.",
    review: "Joint commuter and planner review; acceptance checks and final prioritisation.",
    retrospective: "Retain the evidence traceability matrix and automate regression checks."
  }
];

export const definitionOfDone = [
  "Acceptance criteria pass",
  "Code is reviewed by another member",
  "Automated API tests pass",
  "Responsive interface is checked",
  "No personal location data is stored without consent",
  "Screenshot and code reference are recorded"
];

export const priorities = [
  {
    name: "Must",
    rule: "Required for the core journey, an actionable disruption response or essential privacy.",
    colour: "#dc2626"
  },
  {
    name: "Should",
    rule: "High user or stakeholder value, but the first usable release can operate without it.",
    colour: "#d97706"
  },
  {
    name: "Could",
    rule: "Useful enhancement delivered only if committed work and quality checks are complete.",
    colour: "#2563eb"
  },
  {
    name: "Won't",
    rule: "Explicitly outside this assessment release because of scope, authority or integration risk.",
    colour: "#64748b"
  }
];
