import z from "@deepseek-ai/schemastery";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { decide } from "./client.js";

export const name = "systemone-poc";
export const inject = ["tools"];
export const Config = z.object({ url: z.string(), model: z.string(), apiKey: z.string() });

export function apply(ctx, config) {
  const url = config.url || process.env.SYSTEMONE_URL || "http://127.0.0.1:8000/v1/systemone";
  const model = config.model || process.env.SYSTEMONE_MODEL || "multilingual";
  const apiKey = config.apiKey || process.env.SYSTEMONE_API_KEY || "";
  ctx.tools.register(defineTool({
    name: "systemone_decide",
    description: "Ask the System One decision service for a typed route decision before starting a programming task. Returns route (inspect | implement | test | clarify), confidence and probabilities. Use it as guidance, not as the implementation.",
    parameters: {
      task: { type: "string", required: true, description: "Short summary of the task at hand." },
      // Optional: the parameter DSL only accepts `required: true` when present, so absence means optional.
      repo_context: { type: "string", description: "Relevant repository context: existing patterns, similar code, constraints. Keep it short." }
    },
    output: {
      schema: { type: "object", additionalProperties: false, properties: {
        route: { type: "string", required: true },
        confidence: { type: "number", required: true },
        decision_confidence: { type: "number" },
        probabilities: { type: "object", additionalProperties: true, required: true },
        model: { type: "string", required: true }
      } },
      render: (_args, value) => [{ type: "text", text: `route=${value.route} confidence=${value.confidence.toFixed(4)} model=${value.model} probabilities=${JSON.stringify(value.probabilities)}` }]
    },
    execute(args) {
      return decide({ url, model, apiKey, task: args.task, repoContext: args.repo_context });
    }
  }));
}
