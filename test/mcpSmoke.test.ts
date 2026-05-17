import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { startHttpServer } from "../src/server/http.js";
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

  it("serves a health endpoint for load balancers", async () => {
    const httpServer = await startHttpServer({ port: 0, host: "127.0.0.1" });
    const address = httpServer.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected HTTP server to listen on an ephemeral TCP port.");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });

    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });
});
