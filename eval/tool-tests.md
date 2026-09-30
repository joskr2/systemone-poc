# Etapa 6 — resultados por herramienta

Ejecutado: 2026-09-30. Modelo en pi/DSH: `opencode-go/deepseek-v4.1-flash` (pi thinking
default = high; DSH default). OpenCode: pendiente (matriz max en curso).

## 1. Engram (guardar → recuperar en otra sesión)

| harness | A guardó | B recuperó | B respondió correcto | notas |
|---|---|---|---|---|
| pi | ✅ #2099 (verificó con bash/read/grep) | ✅ `mem_search` + `mem_context` | ✅ cita el id y las capas | — |
| DSH | ✅ #2098 (verificó con codegraph) | ✅ `mem_search` + `mem_get_observation` ×2 | ✅ cita el id | — |
| OpenCode | ❌ **se negó a guardar** | ✅ (encontró #2099) | ✅ | Detectó que la convención era falsa en el estado actual del repo (la feature se implementa y restaura en cada corrida). Verificación epistémica correcta; mi texto de prueba era defectuoso. |

**Veredicto**: el mecanismo guardar→recuperar funciona en los tres; corregir el texto
de la convención para describir algo verdadero en el baseline (p. ej. "los tests viven
en `tests/domain` y `tests/app`; el dominio es puro y devuelve copias").

## 2. CodeGraph (localizar código)

| harness | llamada | respuesta | notas |
|---|---|---|---|
| pi | ✅ `codegraph` ×2 | ✅ cadena de 4 archivos (render→main→store→task) | también bash/read |
| DSH | ✅ `codegraph_explore` ×2 | ✅ tabla con la cadena completa | llamó `systemone_decide` (inspect 0.98) por AGENTS.md |

## 3. Context7 (docs de librería)

| harness | llamada | respuesta | notas |
|---|---|---|---|
| pi | ✅ resolve + query-docs | ✅ cita `/vitest-dev/vitest` timers.md | llamó `systemone_decide` ×2 por su cuenta |
| DSH | ✅ resolve + query-docs ×2 | ✅ cita biblioteca y fuentes | también bash/glob/engram |

## 4. Búsqueda web

| harness | llamada | respuesta |
|---|---|---|
| pi | ✅ `web_search` + `fetch_content` ×2 | ✅ Vite 8.3.1 con fuente (registry.npmjs.org) |
| DSH | ✅ `web_search` + `web_fetch` ×2 | ✅ Vite 8.3.1, dos fuentes independientes |

## 5. Caveman (reducción de salida)

Mismo prompt ("explica en bullets qué hace y qué no hace `store.ts`"), con y sin skill:

| harness | con caveman | sin caveman | delta |
|---|---|---|---|
| pi | 1.133 tokens out | 1.949 tokens out | **−42%** |
| DSH | 2.139 chars | 2.479 chars | −14% |

n=1 por celda. En pi el efecto es claro; en DSH más débil (el `skill` se cargó, pero el
formato de salida no se comprimió igual). Repetir con 3 corridas antes de conclusiones.

## 6. Playwright (interfaz)

| harness | llamada | resultado |
|---|---|---|
| pi | ✅ `browser_navigate` + snapshot×2 + type + click + evaluate + close | ✅ levantó el server (:5180), verificó el botón Add con evidencia y dejó todo apagado (sin leftovers) |
| DSH | ✅ flujo completo + `job_kill` (server como job) | ✅ "Verificación completada y todo apagado"; `systemone_decide`→`test` 0.99; sin leftovers |

## 7. Ponytail (solución mínima)

| harness | con skill | sin skill | delta | notas |
|---|---|---|---|---|
| pi | 5.344 chars | 5.384 chars | ~0 | inconcluso (timeout + MCP flaky por carga) |
| DSH | 4.096 chars | 5.742 chars | **−29%** | ON citó "la ladder de ponytail" (skill aplicada); OFF encontró en Engram la propuesta previa del ON (contaminación leve) |

Dirección consistente (la skill reduce/estructura la propuesta) pero n=1 y con confounds;
repetir en máquina limpia para concluir.

## Nota metodológica

No correr sesiones concurrentes durante mediciones: la carga degradó las sesiones
(arranques MCP fallidos, duraciones infladas). Las etapas 6 se corrieron en paralelo con
la matriz por necesidad de tiempo; las de OpenCode quedan pendientes para una corrida
limpia.

