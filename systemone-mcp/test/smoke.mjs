/**
 * End-to-end smoke test of the systemone-mcp stdio server.
 *
 * Spawns `node server.js` over StdioClientTransport, lists the tools and calls
 * `systemone_decide` against the real backend configured in the POC `.env`
 * (Jev by default). Run with: `node test/smoke.mjs`.
 */
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const SERVER_PATH = fileURLToPath(new URL("../server.js", import.meta.url));
const TASK = "Tarea: agregar validación de email. El repositorio ya tiene una validación similar en otro formulario.";
const REPO_CONTEXT = "existe una validación similar";

/** Fail the process with a clear message. */
function fail(message) {
  console.error(`SMOKE FAILED: ${message}`);
  process.exit(1);
}

/** Assert a condition, failing with a clear message otherwise. */
function check(condition, message) {
  if (!condition) fail(message);
}

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [SERVER_PATH],
  env: process.env,
  stderr: "inherit"
});
const client = new Client({ name: "systemone-mcp-smoke", version: "0.1.0" });

try {
  await client.connect(transport);

  const { tools } = await client.listTools();
  console.log("tools:", tools.map((tool) => tool.name).join(", "));
  check(
    tools.some((tool) => tool.name === "systemone_decide"),
    `systemone_decide not found in tool list: ${JSON.stringify(tools.map((tool) => tool.name))}`
  );

  const result = await client.callTool({
    name: "systemone_decide",
    arguments: { task: TASK, repo_context: REPO_CONTEXT }
  });

  const text =
    Array.isArray(result.content) && result.content.length > 0
      ? result.content.map((block) => block.text ?? JSON.stringify(block)).join("\n")
      : "";
  console.log("result:", text);

  check(!result.isError, `tool returned an error: ${text}`);
  check(text.includes("route="), `result text does not contain a route: ${text}`);
  check(text.includes("confidence="), `result text does not contain a confidence: ${text}`);
  check(text.includes("model=jev-latest"), `result text does not mention model=jev-latest: ${text}`);

  console.log("SMOKE OK");
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await client.close().catch(() => {});
}
