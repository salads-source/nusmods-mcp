#!/usr/bin/env node
import { startHttpServer } from "./server/http.js";
import { startStdioServer } from "./server/stdio.js";

interface CliOptions {
  transport: "stdio" | "http";
  port: number;
  host?: string;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.transport === "http") {
    await startHttpServer({ port: options.port, host: options.host });
    console.error(`NUSMods MCP server listening on http://${options.host ?? "localhost"}:${options.port}/mcp`);
    return;
  }

  await startStdioServer();
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    transport: "stdio",
    port: 3000,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--transport") {
      const value = args[index + 1];
      if (value !== "stdio" && value !== "http") {
        throw new Error("--transport must be either stdio or http.");
      }
      options.transport = value;
      index += 1;
    } else if (arg === "--port") {
      const value = Number.parseInt(args[index + 1] ?? "", 10);
      if (!Number.isFinite(value)) {
        throw new Error("--port must be a number.");
      }
      options.port = value;
      index += 1;
    } else if (arg === "--host") {
      options.host = args[index + 1];
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      console.log("Usage: nusmods-mcp [--transport stdio|http] [--port 3000] [--host 127.0.0.1]");
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
