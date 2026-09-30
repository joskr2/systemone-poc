#!/usr/bin/env node
/**
 * stdio MCP server exposing the System One decision service as a tool.
 *
 * Reuses `systemone-plugin/client.js` (pure HTTP client) and reads connection
 * settings from the POC `.env` at the repository root without overriding any
 * value already present in `process.env`.
 *
 * Nothing but MCP protocol messages may go to stdout: use `console.error`.
 * @module systemone-mcp/server
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { decide } from "../systemone-plugin/client.js";

/** Absolute path of the POC `.env` (repository root), relative to this file. */
const ENV_PATH = fileURLToPath(new URL("../.env", import.meta.url));

/**
 * Parse a `.env` file into key/value pairs.
 * Lines without `=`, blank lines and `#` comments are skipped; surrounding
 * single or double quotes are stripped from the value.
 * @param text - raw `.env` content.
 * @returns the parsed entries.
 */
function parseEnv(text) {
  const entries = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    if (key === "") continue;
    let value = trimmed.slice(separator + 1).trim();
    if (value.length >= 2 && (value.startsWith('"') || value.startsWith("'"))) {
      const quote = value[0];
      if (value.endsWith(quote)) value = value.slice(1, -1);
    }
    entries[key] = value;
  }
  return entries;
}

/**
 * Load `.env` entries into `process.env` without overriding existing variables.
 */
function loadEnv() {
  let text;
  try {
    text = readFileSync(ENV_PATH, "utf8");
  } catch {
    return; // Missing `.env` is fine: defaults below still apply.
  }
  for (const [key, value] of Object.entries(parseEnv(text))) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv();

const url = process.env.SYSTEMONE_URL || "http://127.0.0.1:8000/v1/systemone";
const model = process.env.SYSTEMONE_MODEL || "multilingual";
const apiKey = process.env.SYSTEMONE_API_KEY || "";

const server = new McpServer({ name: "systemone-mcp", version: "0.1.0" });

server.registerTool(
  "systemone_decide",
  {
    description:
      "Ask the System One decision service (Laya or Jev) for a typed route decision before starting a programming task. Returns route (inspect | implement | test | clarify), confidence and probabilities. Use it as guidance, not as the implementation.",
    inputSchema: {
      task: z.string().describe("Short summary of the task at hand."),
      repo_context: z
        .string()
        .optional()
        .describe("Relevant repository context: existing patterns, similar code, constraints. Keep it short.")
    }
  },
  async ({ task, repo_context }) => {
    try {
      const decision = await decide({
        url,
        model,
        apiKey,
        task,
        repoContext: repo_context
      });
      return {
        content: [
          {
            type: "text",
            text: `route=${decision.route} confidence=${decision.confidence} model=${decision.model} probabilities=${JSON.stringify(decision.probabilities)}`
          }
        ]
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `systemone error: ${message}` }],
        isError: true
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`systemone-mcp ready (model=${model}, url=${url})`);
