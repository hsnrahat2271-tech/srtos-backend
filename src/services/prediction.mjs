import { mockPredictions } from "../mockData.mjs";

export function calculateCongestionRisk({ activeEvents = 0, averageDelayMinutes = 0, peakHour = true }) {
  const eventComponent = Math.min(45, activeEvents * 7);
  const delayComponent = Math.min(40, averageDelayMinutes * 5);
  const peakComponent = peakHour ? 15 : 0;
  const score = Math.max(0, Math.min(100, Math.round(eventComponent + delayComponent + peakComponent)));
  const level = score >= 75 ? "High" : score >= 40 ? "Moderate" : "Low";
  return {
    score,
    level,
    factors: { activeEvents, averageDelayMinutes, peakHour },
    method: "Transparent weighted prototype model, not a production ML forecast."
  };
}

export function getCorridorPredictions() {
  return mockPredictions;
}

export const predictionServiceDescription = {
  name: "SRTOS congestion prediction service",
  authentication: "Internal service; no external key.",
  format: "JSON.",
  functions: [
    "Combines incident count, observed delay and peak-period weighting.",
    "Returns a transparent Low, Moderate or High congestion risk.",
    "Uses a deterministic model for assessment evidence; a production system would train and validate a model on historical observations."
  ],
  internalRoutes: ["/api/dashboard", "/api/authority/summary"],
  fallback: "The deterministic model is itself the prototype implementation."
};
