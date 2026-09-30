# Comparación: la misma tarea en 3 harnesses (2026-09-30)

## Diseño

- Prompt idéntico (textual) para los tres, en el mismo repo y el mismo estado inicial:
  > En demo-app de este repo: agrega validación para no permitir títulos de tarea
  > duplicados (sin distinguir mayúsculas). Cubre el caso con un test, implementa el
  > cambio y corre `npm test`. Reporta el resultado observado. No hagas commit.
- Corridas secuenciales; entre corridas el repo se restauró al snapshot inicial (sin commits).
- Modelo en los tres: `opencode-go/deepseek-v4.1-flash`.
- Estado inicial: 16 tests en verde.

## Resultados

| | **pi + gentle-shell** | **OpenCode (gentle-orchestrator)** | **DSH headless (POC)** |
|---|---|---|---|
| Comando | `pi -p --mode json -a` | `opencode run --standalone --auto --format json` | `dsh --profile headless --json` |
| Duración (aprox) | ~111 s | ~77 s | ~58 s |
| Llamadas a herramientas | 17 | 16 | 17 |
| Desglose | bash 10, edit 3, read 1, `gentle_review` 2, `mem_save` 1 | shell 8, execute 5, edit 2, read 1 | `systemone_decide` 1, bash 5, `codegraph` 1, read 3, edit 3, `mem_save` 1, `mem_judge` 3 |
| CodeGraph | no usado (exploró con bash/find) | sí (1 explore) | sí (1 explore) |
| Engram | sí (1 save) | sí (save + judge) | sí (save + judge ×3) |
| systemone_decide | no disponible (lo reportó) | no disponible (lo buscó y lo reportó) | invocado (1.º falló por bug de schema; corregido y re-verificado ✅) |
| Método | test-first | test-first (RED→GREEN explícito) | decisión → explorar → implementar → probar |
| Resultado | ✅ 17/17 (1 test nuevo) | ✅ 18/18 (2 tests nuevos) | ✅ 18/18 (2 tests nuevos) |
| Notas | `gentle_review` bloqueado (sin terminal); usó `-a` (trust del proyecto) | reportó la ausencia de la herramienta DSH sin inventarla | usó todo el stack de la POC (decisión + índice + memoria) |

## Hallazgos

1. **Bug real del plugin, cazado por el E2E**: el schema de salida de `systemone_decide`
   no declaraba `decision_confidence`; DSH rechaza valores no declarados
   (`additionalProperties: false`) y la llamada falló dentro del harness. Corregido en
   `systemone-plugin/index.js` y re-verificado contra Jev (`route=inspect`, 0.94).
2. **`systemone_decide` es específico de DSH** (plugin con `@deepseek-ai/dsh-tools`).
   pi y OpenCode no lo tienen; ambos lo detectaron y lo reportaron sin simularlo.
3. **Engram se usó en los tres**; CodeGraph en 2 de 3 (pi prefirió explorar con bash).
4. **Calidad equivalente** en la misma tarea (tres implementaciones con el mismo
   patrón de dominio); la diferencia observable está en el método y en qué
   herramientas decide usar cada harness.
5. Las duraciones incluyen el arranque de cada harness con sus MCP; una corrida por
   harness no es evidencia estadística.

## Reproducir

```bash
# repo restaurado primero; sin commits
pi -p --mode json -a "$(cat task.txt)"
opencode run --standalone --auto --format json "$(cat task.txt)"
dsh --profile headless --json "$(cat task.txt)"
```

Artefactos de cada corrida (logs y archivos modificados): temporales de la sesión de
pruebas; el estado final del repo es el inicial (16 tests).
