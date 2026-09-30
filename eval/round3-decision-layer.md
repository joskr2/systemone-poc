# Capa de decisión System One en harnesses tradicionales — matriz de tokens

Fecha: 2026-09-30. Repo: `dsh-systemone-poc`.

## 1. Pregunta

En los harness tradicionales (pi+gentle-shell, OpenCode+gentle-ai) la fase de
decisión ("¿explorar o implementar?") la resuelve el propio LLM generativo
(DeepSeek 4.1), pagando tokens de razonamiento y turnos extra. La hipótesis:
inyectar modelos System One (Jev/Laya) — que **no generan texto**, responden
decisiones tipadas en una pasada (~300 ms) y **no consumen tokens** — en esa fase
reduce el gasto total del flujo, y el efecto crece con el nivel de thinking.

## 2. Qué se construyó y por qué

- **`systemone-mcp/`**: servidor MCP stdio (SDK oficial `@modelcontextprotocol/sdk`
  1.31.0 + zod 4) que expone `systemone_decide`. Reutiliza `systemone-plugin/client.js`
  (contrato HTTP único) y lee el `.env` del repo sin pisar `process.env`.
  *Por qué*: la capa de decisión era un plugin nativo de DSH; para que entre en
  pi y OpenCode debía ser agnóstica (MCP), no un plugin por harness.
- **Conexión**:
  - pi: `~/.pi/agent/mcp.json` → entrada `systemone` (comando `node server.js`).
  - OpenCode: `~/.config/opencode/opencode.json` → `mcp.servers.systemone` (`type: local`).
  - Verificación: pi llamó `mcp__systemone__systemone_decide` ✅; OpenCode llamó
    `tools.systemone.systemone_decide` ✅ (ambos contra Jev).
- **Variantes on/off**: copias de las configs con y sin la entrada, intercambiadas
  por corrida. Backups en `$T/mcp/*-orig.json`. Estado final: **habilitado** en ambos.

## 3. Matriz

Objetivo idéntico para todas las celdas (mismo prompt, mismo repo, mismo estado
inicial de 16 tests, restaurado entre corridas, sin commits):

> En demo-app de este repo: agrega validación para no permitir títulos de tarea
> duplicados (sin distinguir mayúsculas). Cubre el caso con un test, implementa el
> cambio y corre `npm test`. Reporta el resultado observado. No hagas commit.
> Usa CodeGraph para localizar el código relevante antes de editar.

Celdas: `{off, on}` × `{default, high, max}` en pi y OpenCode; en DSH `{Jev, Laya}`
(la capa de decisión es nativa ahí). Modelo: `opencode-go/deepseek-v4.1-flash`.
Timeout: 300 s (pi/DSH), 420 s (OpenCode).

## 4. Medición

- pi: `message_end.message.usage` por mensaje (input, output, reasoning, cacheRead, cost).
- OpenCode: `step_finish.part.tokens` por step (+cost).
- DSH: `usage` por mensaje en el log de sesión (`session.v4.jsonl.zstd`).
- Todos los "total" incluyen cacheRead (el prefijo re-leído en cada turno).

## 5. Resultados

### pi + gentle-shell

| cond | nivel | dur | tests | msgs | in | cacheRead | out | reason | total | cost | decisión |
|---|---|---|---|---|---|---|---|---|---|---|---|
| off | default | 126 s | 17 | 45 | 27.119 | 1.440.512 | 8.111 | 3.498 | 1.475.742 | $0,01326 | — |
| off | high | 126 s | 17 | 40 | 20.902 | 1.237.632 | 9.228 | 3.788 | 1.267.762 | $0,01238 | — |
| off | max | 161 s | 17 | 44 | 97.479 | 1.435.136 | 13.877 | 9.240 | 1.546.492 | $0,02725 | — |
| **on** | default | **77 s** | 17 | 40 | 48.765 | 1.360.384 | 7.806 | 2.769 | 1.416.955 | $0,01608 | 1 |
| **on** | high | 104 s | 17 | 38 | 14.091 | 1.255.808 | 6.550 | 3.415 | 1.276.449 | **$0,00981** | 2 |
| **on** | max | 130 s | 18 | 40 | 43.508 | 1.203.840 | 10.223 | 5.839 | **1.257.571** | **$0,01627** | 1 |

Deltas on−off: razonamiento −21% (default), −10% (high), **−37%** (max);
costo −40% (max); duración −39% / −17% / −19%. pi llamó la herramienta en las 3 celdas.

### OpenCode

| cond | nivel | dur | tests | steps | in | cacheRead | out | reason | total | cost | decisión |
|---|---|---|---|---|---|---|---|---|---|---|---|
| off | default | **427 s (timeout)** | 17 | 13 | 41.641 | 644.992 | 1.944 | 6.026 | 694.603 | $0,01296 | — |
| off | high | 84 s | 19 | 14 | 39.736 | 676.736 | 2.350 | 2.975 | 721.797 | $0,01119 | — |
| off | max | 379 s | 17 | 17 | 96.565 | 1.252.096 | 6.536 | **37.054** | 1.392.251 | $0,04440 | — |
| **on** | default | 82 s | 18 | 12 | 40.565 | 567.936 | 2.589 | 3.545 | **614.635** | $0,01147 | 2 |
| **on** | high | 78 s | 17 | 18 | 48.429 | 959.744 | 3.255 | 5.336 | 1.016.764 | $0,01530 | 0 ⚠ |
| **on** | max | 173 s | 17 | 12 | 66.122 | 752.896 | 3.231 | **14.867** | **837.116** | **$0,02304** | 2 |

Deltas on−off: en **max**: total −40%, razonamiento **−60%**, costo −48%, duración −54%,
turnos 17→12. En high el agente **no usó** la herramienta (celda "disponible sin usar",
por eso empeora). El off/default murió por timeout (celda incompleta).

### DSH (capa nativa, Jev vs Laya)

| backend | dur | tests | in | cacheRead | out | total | decisión observada |
|---|---|---|---|---|---|---|---|
| Jev | 53 s | 17 | 11.173 | 338.816 | 4.085 | **354.074** | `inspect` 0.93 |
| Laya | 64 s | 17 | 11.191 | 376.832 | 4.449 | 392.472 | `implement` 0.40 (inspect 0.25, clarify 0.28) |

## 6. Dónde se ahorra

1. **La decisión cuesta 0 tokens de LLM.** Jev/Laya no son modelos generativos: la
   llamada tarda 270–420 ms y devuelve una decisión tipada. El ahorro aparece en el
   LLM: menos deliberación (reasoning) y menos turnos.
2. **El ahorro crece con el nivel de thinking**: en `max` el LLM razona mucho más
   sobre la ruta cuando debe decidir solo (9.240 → 5.839 en pi; 37.054 → 14.867 en
   OpenCode). En `default/high` el efecto es menor o nulo.
3. **El grueso de tokens es `cacheRead`** (el prefijo: system prompt + esquemas de
   herramientas + instrucciones + skills + historia), 0,5–1,5 M por corrida y ~40–80 k
   por mensaje. Menos turnos = menos re-lecturas del prefijo → el ahorro se amplifica.
4. **Con DSH la capa nativa es la más barata en total** (354–392 k) porque el
   harness es más compacto (menos extensiones) y la decisión entra sin coste de MCP.

## 7. Influencia de las herramientas (MCP, skills, ODD)

- **MCP**: cada servidor añade su esquema al prefijo de *cada* mensaje. `systemone`
  añade 1 herramienta (coste fijo pequeño) y elimina deliberación (coste variable
  grande) — el intercambio es favorable sobre todo en thinking alto.
- **Skills/ODD**: catálogos e instrucciones viven en el prefijo (coste fijo por
  mensaje); ODD/`gentle_review` añaden pasos (pi ejecutó `gentle_review` 2–3 veces
  por corrida; OpenCode usa `execute` para agrupar llamadas, lo que reduce turnos).
- **CodeGraph**: 1–2 llamadas por corrida; sustituye lecturas múltiples por una.

## 7. Matices (de la revisión)

- **Métricas separadas**: input, output, reasoning y cacheRead se reportan por separado
  en las tablas; cacheRead domina el "total" porque el prefijo (system prompt + esquemas
  + instrucciones + historia) se re-lee en cada turno, y **no equivale al coste de tokens
  de entrada sin caché** — el coste facturado va en su propia columna.
- **"Cero tokens" es impreciso**: System One no usa un LLM generativo para decidir, pero
  su **esquema suma al prefijo de cada mensaje** y **la llamada + su resultado ocupan
  tokens del modelo principal**. El ahorro neto se mide en reasoning y turnos; el coste
  marginal de la decisión es ~0 en el servicio, no en el contexto del modelo.

## 8. Límites

- n=1 por celda; varianza alta (timeout y 379 s en OpenCode off).
- La contabilidad de cacheRead difiere por harness; los "total" son comparables en
  semántica, no exactos al token.
- El coste de skills/ODD no se aisló en celdas propias (requiere más matriz).
- En la primera pasada de DSH el loop del script cortó la URL (`https`/`http`): las
  llamadas fallaron y se re-corró con env explícito. Esa pasada quedó descartada.

## 9. Arquitectura de DSH (cómo trabaja, con evidencia de esta sesión)

### Launcher, perfiles y composición

- `dsh` es un **launcher**: `dsh --profile <name>` arranca un perfil en
  `$DSH_HOME/profiles/<name>/` compuesto por `package.json` (lista `dsh.profile.bundles`)
  + `cordis.patch.yml` (tu capa).
- El árbol se compone en capas: bundles en orden (`dsh-base` + `dsh-web-app`/`dsh-headless`)
  → patch del perfil → patch del home → overlays `--patch`. Cada capa es una lista de
  *patch rows*: override por `id`, `disabled`, o `insert` de filas nuevas.
- `--dump-config` imprime el árbol compuesto sin arrancar (así verificamos cada cambio);
  `--dump-config-schema` importa los módulos (valida resolución y schema).
- Cordis (el framework de plugins): cada fila es un plugin con `name`/`config`/`disabled`;
  los plugins se activan por **servicios** (`inject`). Nuestro plugin declara
  `inject: ["tools"]` y registra la herramienta en `ctx.tools`.

### Servicios clave (vistos por dentro)

- **LLM**: `dsh-llm-pi-ai` enruta a proveedores pi-ai (dict `providers`; `opencode-go`
  con `apiKeyEnv`). El modelo de agentes nuevos lo fija `dsh-agent-default-model`
  (provider/model viven en el patch del perfil — así apuntamos a `opencode-go/deepseek-v4.1-flash`).
- **Credenciales**: store local `~/.dsh/.credentials.yaml` con `refs` (p. ej.
  `OPENCODE_GO_API_KEY`); si falta, el error es `MISSING_CREDENTIAL` y nombra el fix.
- **Herramientas**: `ctx.tools.register(defineTool({...}))` con DSL estricto:
  parámetros (solo `required: true`; ausencia = opcional) y `output.schema` con
  `additionalProperties: false` **validado en runtime** — el bug de `decision_confidence`
  salió de aquí.
- **MCP**: `@deepseek-ai/dsh-mcp-client` monta un servidor por entrada (stdio con
  probe + proceso servidor; o streamable-http). Las tools se exponen como
  `mcp__<server>__<tool>`; el env de los hijos se depura (KEY/PASSWORD/SECRET/TOKEN
  fuera). Verificado: 4 hijos directos de DSH en el arranque.
- **Instrucciones**: `dsh-agent-instructions` inyecta `AGENTS.md`/`CLAUDE.md` desde la
  raíz del proyecto (`.git`) hacia abajo como mensajes durables.
- **Skills**: `dsh-skill-filesystem` descubre `<repo>/.dsh/skills/<name>/SKILL.md`
  (rank 100), parsea frontmatter (`name` kebab + `description`) y las ofrece bajo demanda.
- **Sesión**: log event-sourced (`session.v4.jsonl.zstd`) con eventos tipados y `usage`
  por mensaje; de ahí salen los tokens de DSH.
- **Headless**: `dsh --profile headless "<task>"` corre una sesión y sale; `--json` emite
  NDJSON (`session`/`status`/`text`/`thinking`/`tool_call`/`tool_result`/`final`).
- **Plugins externos**: `dsh plugin --profile X add <pkg>` → pnpm dentro del perfil;
  compat por `peerDependencies` contra la versión del runtime.

### El flujo de una corrida

1. Boot: compone el árbol → activa plugins/servicios → conecta MCP → carga instrucciones y skills.
2. El runner crea una sesión (event-sourced) y arranca el agente con la ruta de modelo por defecto.
3. Cada paso: request al LLM (prefijo = system prompt + esquemas de tools + instrucciones
   + historia) → tool calls → DSH valida argumentos y salida → appendea eventos → siguiente paso.
4. Nuestra capa: `systemone_decide` corre **dentro** de ese loop como cualquier tool:
   el modelo la llama (lo pide `AGENTS.md`), hace un POST a Jev/Laya (sin tokens) y
   recibe la ruta tipada como resultado.

## 10. Estado dejado en la máquina

- `systemone-mcp/` en el repo; `systemone` **habilitado** en pi y OpenCode.
  Para desactivar: quitar la entrada `systemone` de `~/.pi/agent/mcp.json` y de
  `~/.config/opencode/opencode.json` (backups en `$T/mcp/*-orig.json`).
- Repo restaurado (16 tests, sin commits). Logs y artefactos por corrida en `$T/matrix/`.
