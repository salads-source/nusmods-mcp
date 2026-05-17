import http from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "./mcpServer.js";

export interface HttpServerOptions {
  port: number;
  host?: string;
}

export async function startHttpServer(options: HttpServerOptions): Promise<http.Server> {
  const transports = new Map<string, StreamableHTTPServerTransport>();

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
      if (url.pathname !== "/mcp") {
        response.writeHead(404).end("Not found");
        return;
      }

      const body = request.method === "POST" ? await readJsonBody(request) : undefined;
      let transport: StreamableHTTPServerTransport | undefined;
      const sessionId = request.headers["mcp-session-id"];

      if (typeof sessionId === "string") {
        transport = transports.get(sessionId);
      } else if (request.method === "POST" && body && isInitializeRequest(body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId) => {
            transports.set(newSessionId, transport!);
          },
        });
        transport.onclose = () => {
          if (transport?.sessionId) {
            transports.delete(transport.sessionId);
          }
        };
        await createMcpServer().connect(transport);
      }

      if (!transport) {
        response.writeHead(400).end("Missing or invalid MCP session.");
        return;
      }

      await transport.handleRequest(request, response, body);
    } catch (error) {
      if (!response.headersSent) {
        response.writeHead(500, { "content-type": "application/json" });
      }
      response.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : "Internal server error",
          },
          id: null,
        }),
      );
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(options.port, options.host, resolve);
  });

  return server;
}

async function readJsonBody(request: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
