/**
 * Pure HTTP client for a System One decision service (Laya or Jev).
 *
 * This module deliberately has no `@deepseek-ai/*` imports: it runs in plain
 * Node 22 so the HTTP contract can be smoke-tested without the DSH runtime.
 * @module systemone-plugin/client
 */

/** The route labels the decision service may answer with. */
export const ROUTES = ["inspect", "implement", "test", "clarify"];

/** Instructions and criteria sent with every `route` question. */
const ROUTE_QUESTION = {
  type: "choice",
  instructions: "¿Cuál es el siguiente modo de trabajo?",
  criteria: {
    inspect: "Primero hay que entender patrones o contexto existente.",
    implement: "El cambio está claro y autorizado.",
    test: "El cambio ya existe y hay que verificarlo.",
    clarify: "Falta una decisión del usuario que afecta alcance o comportamiento."
  }
};

/**
 * Build the `state` string sent to the service: the task plus optional repo context.
 * @param task - short summary of the task at hand.
 * @param repoContext - extra repository context, appended only when non-empty.
 * @returns the composed state.
 */
function buildState(task, repoContext) {
  const hasRepoContext = typeof repoContext === "string" && repoContext.length > 0;
  return hasRepoContext ? `${task}\n\n${repoContext}` : task;
}

/**
 * Ask the decision service for a typed route decision.
 * @param options - request options.
 * @param options.url - full endpoint URL, e.g. `http://127.0.0.1:8000/v1/systemone`.
 * @param options.model - routing model name sent to the service.
 * @param options.apiKey - bearer token; the header is omitted when falsy.
 * @param options.task - short summary of the task at hand.
 * @param options.repoContext - relevant repository context, appended to the state.
 * @param options.timeoutMs - request timeout in milliseconds.
 * @param options.fetchImpl - fetch implementation, injectable for tests.
 * @returns the normalized decision.
 */
export async function decide({
  url,
  model,
  apiKey,
  task,
  repoContext,
  timeoutMs = 30000,
  fetchImpl = fetch
}) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const body = {
    model,
    state: buildState(task, repoContext),
    questions: { route: ROUTE_QUESTION }
  };

  let response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(message, { cause: error });
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`systemone request failed: HTTP ${response.status} ${text.slice(0, 200)}`);
  }

  const payload = await response.json();
  const route = payload?.answers?.route;
  if (!route?.choice) throw new Error("systemone response missing answers.route.choice");

  return {
    route: route.choice,
    confidence: route.answer_confidence ?? route.confidence,
    probabilities: route.probabilities,
    model: payload.routing?.model ?? model,
    decision_confidence: route.confidence
  };
}
