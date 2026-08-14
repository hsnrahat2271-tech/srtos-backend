import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { createServer } from "../server.mjs";

let server;
let base;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  base = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function json(path) {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, 200);
  return response.json();
}

test("health endpoint reports a controlled data mode", async () => {
  const data = await json("/api/health");
  assert.equal(data.status, "ok");
  assert.equal(data.project, "SRTOS-QLD");
  assert.equal(typeof data.liveApisRequested, "boolean");
});

test("backlog contains 16 complete and prioritised user stories", async () => {
  const data = await json("/api/project/backlog");
  assert.equal(data.stories.length, 16);
  assert.deepEqual(
    [...new Set(data.stories.map((story) => story.priority))].sort(),
    ["Could", "Must", "Should", "Won't"].sort()
  );
  for (const story of data.stories) {
    for (const key of [
      "id",
      "epic",
      "story",
      "acceptance",
      "priority",
      "rationale",
      "points",
      "dependency",
      "sprint",
      "owner"
    ]) {
      assert.ok(story[key] !== undefined && story[key] !== "", `${story.id} is missing ${key}`);
    }
  }
});

test("three sprint workloads are balanced and total 50 points", async () => {
  const data = await json("/api/project/sprints");
  assert.equal(data.sprints.length, 3);
  assert.deepEqual(data.sprints.map((sprint) => sprint.points), [16, 18, 16]);
  assert.equal(data.sprints.reduce((sum, sprint) => sum + sprint.points, 0), 50);
});

test("journey plan returns a recommended multimodal option", async () => {
  const data = await json(
    "/api/journey?origin=South%20Bank&destination=University%20of%20Queensland&accessible=true"
  );
  assert.ok(data.options.length >= 3);
  assert.ok(data.options.some((option) => option.id === data.recommendedId));
  assert.equal(data.accessible, true);
  assert.ok(data.source.mode);
});

test("dashboard exposes vehicles, alerts, predictions and source labels", async () => {
  const data = await json("/api/dashboard");
  assert.ok(data.vehicles.length > 0);
  assert.ok(data.alerts.length > 0);
  assert.ok(data.predictions.length > 0);
  assert.ok(data.sources.translink.mode);
  assert.ok(data.sources.qldTraffic.mode);
});

test("integration guide assigns a specific function to every connector", async () => {
  const data = await json("/api/integrations");
  assert.equal(data.integrations.length, 4);
  for (const integration of data.integrations) {
    assert.ok(integration.name);
    assert.ok(integration.authentication);
    assert.ok(integration.format);
    assert.ok(integration.functions.length >= 2);
    assert.ok(integration.internalRoutes.length >= 1);
    assert.ok(integration.fallback);
  }
});
