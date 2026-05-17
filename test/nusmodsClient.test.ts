import { describe, expect, it, vi } from "vitest";
import { NusmodsClient } from "../src/clients/nusmodsClient.js";
import { cs2106Fixture, moduleListFixture } from "./fixtures.js";

describe("NusmodsClient", () => {
  it("searches modules using mocked NUSMods responses", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.endsWith("moduleList.json")) {
        return jsonResponse(moduleListFixture);
      }
      if (url.endsWith("CS2106.json")) {
        return jsonResponse(cs2106Fixture);
      }
      return jsonResponse({ moduleCode: "X", title: "X" });
    }) as unknown as typeof fetch;

    const client = new NusmodsClient({ fetchImpl });
    const results = await client.searchModules("operating", "2025-2026");

    expect(results[0]).toMatchObject({
      moduleCode: "CS2106",
      title: "Introduction to Operating Systems",
      department: "Computer Science",
      semesters: [1, 2],
    });
  });
});

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
