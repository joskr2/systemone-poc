// Preflight de decisión: llama a System One ANTES de arrancar el agente.
// Uso: node preflight.mjs "<task>" ["<repo_context>"]
// Salida: una línea JSON { ok, ms, route, confidence, probabilities, model, decision_confidence }
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { decide } from '../systemone-plugin/client.js';

const here = dirname(fileURLToPath(import.meta.url));
try {
  const raw = readFileSync(join(here, '..', '.env'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch { /* sin .env: usa defaults/entorno */ }

const task = process.argv[2] || '';
const repoContext = process.argv[3] || '';
const url = process.env.SYSTEMONE_URL || 'http://127.0.0.1:8000/v1/systemone';
const model = process.env.SYSTEMONE_MODEL || 'multilingual';
const apiKey = process.env.SYSTEMONE_API_KEY || '';

const t0 = Date.now();
try {
  const r = await decide({ url, model, apiKey, task, repoContext });
  console.log(JSON.stringify({ ok: true, ms: Date.now() - t0, ...r }));
} catch (e) {
  console.log(JSON.stringify({ ok: false, ms: Date.now() - t0, error: String(e && e.message ? e.message : e) }));
  process.exit(1);
}
