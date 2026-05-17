import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NusmodsClient, type NusmodsClientOptions } from "../clients/nusmodsClient.js";
import { registerTools } from "../tools/registerTools.js";

export function createMcpServer(clientOptions: NusmodsClientOptions = {}): McpServer {
  const server = new McpServer({
    name: "nusmods-mcp",
    version: "0.1.0",
  });

  registerTools(server, new NusmodsClient(clientOptions));
  return server;
}
