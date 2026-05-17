import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createMcpServer } from "../src/server/mcpServer.js";
import { moduleListFixture } from "./fixtures.js";

describe("MCP server", () => {
  it("initializes and lists tools", async () => {
    const fetchImpl = async (url: string) => {
      if (url.endsWith("moduleList.json")) {
        return new Response(JSON.stringify(moduleListFixture), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    };
    const server = createMcpServer({ fetchImpl: fetchImpl as typeof fetch });
    const client = new Client({ name: "test-client", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const tools = await client.listTools();

    expect(tools.tools.map((tool) => tool.name).sort()).toEqual([
      "check_timetable_conflicts",
      "export_nusmods_url",
      "generate_timetable",
      "get_module_details",
      "get_module_timetable",
      "search_modules",
    ]);

    await client.close();
    await server.close();
  });

  it("validates bad tool input", async () => {
    const server = createMcpServer({ fetchImpl: (async () => new Response(JSON.stringify(moduleListFixture), { status: 200 })) as typeof fetch });
    const client = new Client({ name: "test-client", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({ name: "get_module_timetable", arguments: { moduleCode: "CS2106", semester: 9 } });

    expect(result.isError).toBe(true);

    await client.close();
    await server.close();
  });
});
