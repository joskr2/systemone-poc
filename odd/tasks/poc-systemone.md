# POC: DSH + System One (Laya/Jev) — memoria, índice y skills

## Objetivo

Comprobar de punta a punta que DSH puede trabajar con el método ODD, skills locales,
memoria persistente (Engram), índice del repo (CodeGraph), documentación (Context7),
navegador (Playwright) y un único punto de decisión tipada intercambiable entre Laya
y Jev (`systemone_decide`).

## Problema

El valor de cada pieza (memoria, índice, skills, decisiones tipadas) no está probado
junto en un flujo real. Sin una app de prueba no se puede validar Playwright ni
CodeGraph, y sin un selector unificado no se puede validar el cambio Laya ↔ Jev.

## Alcance

- App demo en TypeScript (varias carpetas, prueba unitaria, pantalla local).
- Skills locales: odd-workflow, ponytail, ponytail-review, caveman.
- MCP en el perfil web de DSH: engram, codegraph, context7, playwright.
- Laya local (`laya[serve]`) + smoke test `/v1/systemone`.
- Plugin `dsh-systemone-poc` con la herramienta `systemone_decide`.
- Pruebas manuales de punta a punta y medición comparativa.

Fuera de alcance: automatizar todas las verificaciones dentro de DSH, desplegar en
producción, hacer commits/push (requiere autorización explícita).

## Restricciones

- No commit/push/release sin pedirlo (AGENTS.md del repo).
- Pruebas en repo de práctica aislado, nunca producción.
- Claves fuera del repositorio (variables de entorno).
- Documentación del repo en español; código, identificadores y UI en inglés.

## Verificación del punto de partida (2026-09-29)

| Pieza | Estado real observado |
|---|---|
| Node / npm / Homebrew | v22.23.2 / 10.9.8 / 7.0.6 — OK |
| DSH (`@deepseek-ai/dsh`) | 0.2.0-rc.2 en caché npx — OK |
| `@deepseek-ai/dsh-mcp-client` | 0.0.1-rc.1 — OK, `insert` es el formato correcto de patch |
| Skills DSH | `.dsh/skills` es root de proyecto rank 100 (dsh-skill-filesystem) — OK |
| Instrucciones | `AGENTS.md` es candidato por defecto (dsh-agent-instructions) — OK |
| Engram | 2.2.1 instalado (`engram mcp` disponible) — OK |
| CodeGraph | 1.2.0 instalado (`init`, `serve --mcp` disponibles) — OK |
| Perfil DSH web | existe con patch propio (ui-settings-general, llm-pi-ai) — OK |
| Laya (PyPI) | 0.3.22, extra `[serve]`, requiere Python ≥3.10 — sistema tiene 3.9.6 |
| App de prueba | NO existía — se crea en esta POC |
| Skills ponytail/caveman | repos existen (HTTP 200), frontmatter válido — copiadas |

Desviación justificada: el venv de Laya usa `uv` con Python 3.12
(`~/.local/bin/python3.12`) porque el `python3` del sistema es 3.9.6.
Desviación justificada: Engram se conecta con `--tools=agent` (18 herramientas) en vez
del perfil completo (22, incluye administración destructiva) para no inflar el prompt.

## Tareas

| ID | Tarea | Ruta | Estado |
|---|---|---|---|
| T1 | App demo TS: varias carpetas, prueba unitaria, pantalla local | delegada (2+ archivos nuevos) | hecha |
| T2 | Copiar skills ponytail, ponytail-review, caveman (+ licencias/origen) | inline (copia mecánica) | hecha |
| T3 | `codegraph init` + `status` sobre el repo | inline (comando) | hecha |
| T4 | MCP engram + codegraph en `~/.dsh/profiles/web/cordis.patch.yml` | inline (1 archivo) | hecha |
| T5 | MCP context7 + playwright | inline (1 archivo) | hecha |
| T6 | Laya local: venv, `laya[serve]`, smoke `/v1/systemone` | inline + background | hecha |
| T7 | Plugin `dsh-systemone-poc` con `systemone_decide` | delegada (paquete nuevo) | hecha (falta E2E en DSH) |
| T8 | Pruebas punta a punta (6 casos del plan) | manual en DSH | pendiente (requiere modelo) |
| T9 | Medición comparativa | manual | pendiente |
| T10 | Comparación de 3 harnesses con la misma tarea (pi+gentle-shell / OpenCode / DSH) | ejecutada | hecha |
| T11 | Capa de decisión como MCP en harnesses tradicionales + matriz de tokens (off/on × default/high/max) | construida y medida | hecha |
| T12 | Preflight obligatorio + benchmark Laya vs Jev + ciclo max 5×5 por harness | completa (pi y OpenCode 5+5) | hecha |
| T13 | Ronda 5: EXP1 imponer `implement` + EXP2 tarea ambigua + umbral de Laya + etapa 6 limpia | EXP1/EXP2 en curso; umbral cerrado | parcial |

## Criterios de aceptación

- DSH ejecuta una tarea usando las prácticas y herramientas de la POC.
- Engram conserva una decisión entre sesiones.
- CodeGraph responde sobre el repo sin editar archivos.
- Playwright y Context7 funcionan en sus casos.
- Cambiar Laya por Jev conserva la misma herramienta y el mismo formato de respuesta.

## Checks por tarea

- T1: `npm test` (vitest) en verde + build de la pantalla local. ✅ 16 tests, build OK, dev server sirve HTML.
- T2: frontmatter válido (`name` kebab-case + `description`) y licencia/origen presentes. ✅
- T3: `codegraph status` reporta índice con archivos. ✅ 7 archivos, 35 nodos, 116 edges.
- T4: `dsh --dump-config` incluye las entradas y arranque sin errores de MCP. ✅
- T6: `curl /v1/systemone` devuelve `route` con probabilidades y confianza. ✅
- T7: la herramienta responde igual contra Laya y contra Jev cambiando solo configuración. ⏳ probado contra Laya standalone; falta dentro de DSH.

## Evidencia

- **T1**: `demo-app/` — 11 archivos; `npm test` → 16/16 en verde; `npm run build` → OK; dev server en :5180 sirve HTML. TS 7.0.2 + Vite 8.3.1 + Vitest 5.0.2 (resueltos por npm).
- **T2**: `.dsh/skills/{ponytail,ponytail-review,caveman}` con `LICENSE` y `SOURCE.md` (commit de origen).
- **T3**: `codegraph explore "addTask"` devuelve blast radius y fuente verbatim desde el índice.
- **T4/T5**: `--dump-config` exit 0 sin warnings; arranque real de 40s: DSH con 4 MCP hijos directos (`codegraph serve --mcp`, `engram mcp --tools=agent`, `@playwright/mcp`, `@upstash/context7-mcp`), 0 warnings en el log, cierre sin huérfanos.
- **T6**: `~/venvs/laya-poc` con Python 3.12.13; `laya-serve` en 127.0.0.1:8000; `/health` → `{"status":"ok","loaded":["multilingual"],"device":"mps"}`; smoke `/v1/systemone` → `route=implement` (0.64 / 0.53 en dos corridas: el servicio es no determinista).
- **T7**: `dsh plugin --profile web add …` → `dsh-systemone-poc` como `link:`; entrada `systemone-poc` en el patch; `node test/smoke.mjs` → SMOKE OK; `defineTool` validado contra el DSL real (ver hallazgos).
- **T7/Jev (2026-09-30)**: clave en `.env` validada (`GET https://api.typesafe.ai/v1/models` → 200, modelos `jev-latest` y `jev-preview`); el cliente del plugin contra Jev → `route=inspect` 0.97 estable en 2 corridas (~300–400 ms), mismo formato de salida que Laya — intercambiabilidad de backend probada a nivel de plugin, sin cambios de código.

## Hallazgos

- El DSL de parámetros de DSH **prohíbe `required: false`**: la ausencia de la clave es lo que marca opcional (`@deepseek-ai/dsh-tools@0.2.0-rc.2`).
- Laya (RL) es **no determinista** entre llamadas: la misma tarea dio `implement` 0.64 y 0.53. Hay que medir repeticiones para T9.
- Engram auto-promueve el repo hijo como proyecto (`git_child`) al guardar desde el repo; después acepta el proyecto explícito.
- El arranque de DSH tarda más con MCP por `npx` en frío (probe + descarga); pre-calentar con `--help` lo evita.
- **T10 (2026-09-30)**: misma tarea en pi+gentle-shell (~111 s, 17 llamadas, test-first, `mem_save`), OpenCode (~77 s, 16 llamadas, test-first, codegraph+engram) y DSH headless (~58 s, 17 llamadas, systemone+codegraph+engram). Los tres en verde (17 o 18 tests) y repo restaurado. Detalle en `eval/comparison-3-harnesses.md`.
- **Bug del plugin cazado por el E2E real**: el schema de salida de `systemone_decide` no declaraba `decision_confidence`; DSH rechaza propiedades no declaradas (`additionalProperties: false`) y la llamada falló dentro del harness. Corregido en `systemone-plugin/index.js` y re-verificado contra Jev (`route=inspect`, 0.94).
- **Ronda 4 — ciclo max 5×5 (pi, final)**: con preflight obligatorio, ON cuesta **+13%** ($0,0156→$0,0176 por corrida), reasoning **+35%**, dispersión 3,8× (vs 1,6× OFF). **La señal de ahorro de la ronda 3 (n=1) no se replicó** — era ruido. `tool_called=0` en todas las ON (el preflight es el tratamiento único). OpenCode (parcial 3+2): misma dirección (+13% coste, +18% reasoning).
- **Benchmark Laya vs Jev**: Jev 12/12 (conf. 0.997, 262 ms p50) vs Laya 8/12 (0.695, 58 ms p50, sesgada a `implement`). Doc: `eval/decision-benchmark.md`.
- **Etapa 6**: Engram guardar→recuperar ✅ en los tres (OpenCode se negó a guardar una convención falsa — verificación epistémica); CodeGraph/Context7/búsqueda web ✅ en pi y DSH; Playwright ✅ en pi; Caveman −42% (pi) / −14% (DSH); Ponytail inconcluso (timeout + MCP flaky por carga). Doc: `eval/tool-tests.md`.

## Siguiente paso

1. Configurar un modelo en DSH (`npx @deepseek-ai/dsh web` → Settings → Models).
2. Ejecutar el checklist `eval/e2e-checklist.md` (6 casos) y anotar la tabla de medición.
3. Reiniciar DSH desde este repo (el `.env` ya apunta a Jev) y confirmar en una tarea real que `systemone_decide` responde con `model=jev-latest`.
