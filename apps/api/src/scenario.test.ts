import { describe, expect, it } from "vitest";
import { buildApp } from "./server.js";
import { getScenarioPackById, getStoreFallbackSeed } from "./lib/scenario.js";

describe("scenario resolution", () => {
  it("valid scenario id resolves correctly", () => {
    const resolved = getScenarioPackById("retail_peak");
    expect(resolved.id).toBe("retail_peak");
  });

  it("invalid id falls back to retail_v1", () => {
    const resolved = getScenarioPackById("does-not-exist");
    expect(resolved.id).toBe("retail_v1");
  });

  it("/api/scenario returns non-empty id/label/description", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/scenario?id=retail_peak"
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as { id: string; label: string; description: string };
    expect(body.id.length).toBeGreaterThan(0);
    expect(body.label.length).toBeGreaterThan(0);
    expect(body.description.length).toBeGreaterThan(0);

    await app.close();
  });

  it("store fallback seed uses active pack seed shape", () => {
    const fallbackSeed = getStoreFallbackSeed("retail_peak");

    expect(fallbackSeed).toHaveProperty("incidents");
    expect(fallbackSeed).toHaveProperty("integrations");
    expect(fallbackSeed).toHaveProperty("policies");
    expect(fallbackSeed).toHaveProperty("auditEvents");
    expect(Array.isArray(fallbackSeed.incidents)).toBe(true);
    expect(Array.isArray(fallbackSeed.integrations)).toBe(true);
    expect(Array.isArray(fallbackSeed.policies)).toBe(true);
    expect(Array.isArray(fallbackSeed.auditEvents)).toBe(true);
  });
});
