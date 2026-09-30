/**
 * Plain-Node end-to-end smoke test of the System One HTTP client.
 *
 * Requires a local decision service (Laya by default) already listening on
 * http://127.0.0.1:8000. Run with: `node test/smoke.mjs`.
 */
import { decide, ROUTES } from "../client.js";

const URL = "http://127.0.0.1:8000/v1/systemone";
const MODEL = "multilingual";
const TASK = "Tarea: agregar validación de email. El repositorio ya tiene una validación similar en otro formulario.";
const REPO_CONTEXT = "existe una validación similar en otro formulario";
const SUM_TOLERANCE = 0.02;

/** Fail the process with a clear message. */
function fail(message) {
  console.error(`SMOKE FAILED: ${message}`);
  process.exit(1);
}

/** Assert a condition, failing with a clear message otherwise. */
function check(condition, message) {
  if (!condition) fail(message);
}

let decision;
try {
  decision = await decide({ url: URL, model: MODEL, task: TASK, repoContext: REPO_CONTEXT });
} catch (error) {
  fail(`request to ${URL} failed: ${error instanceof Error ? error.message : String(error)}`);
}

console.log(JSON.stringify(decision, null, 2));

check(ROUTES.includes(decision.route), `route ${JSON.stringify(decision.route)} is not one of ${ROUTES.join(" | ")}`);
check(typeof decision.confidence === "number" && Number.isFinite(decision.confidence) && decision.confidence >= 0 && decision.confidence <= 1, `confidence ${decision.confidence} is not a number in [0, 1]`);

const probabilities = decision.probabilities;
check(probabilities !== null && typeof probabilities === "object", `probabilities is not an object: ${JSON.stringify(probabilities)}`);
for (const route of ROUTES) {
  check(typeof probabilities[route] === "number" && Number.isFinite(probabilities[route]), `probabilities.${route} is not a number: ${JSON.stringify(probabilities[route])}`);
}
const sum = ROUTES.reduce((total, route) => total + probabilities[route], 0);
check(Math.abs(sum - 1) <= SUM_TOLERANCE, `probabilities sum to ${sum}, expected 1 ± ${SUM_TOLERANCE}`);

console.log(`probabilities sum = ${sum}`);
console.log("SMOKE OK");
