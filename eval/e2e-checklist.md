# Checklist E2E en DSH (POC)

Requisito previo: configura un modelo en DSH (`npx @deepseek-ai/dsh web` → Settings →
Models) y arranca DSH **desde este repositorio** (`cd ~/Documents/dev/dsh-systemone-poc`).

Antes de empezar, comprueba en el catálogo de herramientas que existe
`systemone_decide` (plugin `dsh-systemone-poc`). El backend activo lo decide el `.env`
del repo: por defecto apunta a Jev (`https://api.typesafe.ai/v1/systemone`); para usar
Laya local, apunta `SYSTEMONE_URL` a `http://127.0.0.1:8000/v1/systemone` y reinicia DSH.

## Casos (de a uno)

1. **Exploración** — «Usa CodeGraph para explicar cómo fluye una tarea desde la UI hasta
   `addTask`. No edites archivos.»
   - Esperado: usa las herramientas `mcp__codegraph__*`, no toca archivos.
2. **Cambio simple** — «Acota el cambio: no permitir agregar tareas con título vacío
   desde la UI de demo-app. Mantén el cambio pequeño y ejecuta las pruebas.»
   - Esperado: cambio acotado, sin plan largo, `npm test` reportado; `systemone_decide`
     invocado como guía.
3. **Trabajo con historial** — «¿Qué decidimos sobre el backend de System One en esta
   POC? Consúltalo en Engram antes de responder.»
   - Esperado: recupera memoria de Engram sin re-explorar el repo.
4. **Documentación** — «Consulta la documentación actual de Vitest sobre fake timers y
   propone un ejemplo para nuestro test de store.»
   - Esperado: usa Context7.
5. **Interfaz** — «Levanta la app demo (`npm run dev` en `demo-app`) y comprueba con el
   navegador que el botón Add agrega una tarea a la lista.»
   - Esperado: usa Playwright MCP; no necesitas configurar nada más.
6. **Ruta System One** — repite el caso 2 dos veces:
   - con Laya (`SYSTEMONE_URL=http://127.0.0.1:8000/v1/systemone`,
     `SYSTEMONE_MODEL=multilingual`, sin clave);
   - con Jev: el `.env` del repo ya apunta a `https://api.typesafe.ai/v1/systemone` con `SYSTEMONE_API_KEY`; para volver a Laya, comenta esas líneas del `.env` y reinicia DSH.
   - Esperado: la herramienta es la misma (`systemone_decide`) y el formato de respuesta
     no cambia; solo cambia la configuración del backend.

## Medición (DSH básico vs POC)

Misma tarea y mismo estado del repo en ambas configuraciones.

| Medida | Básico | POC |
|---|---|---|
| Resultado correcto y pruebas | | |
| Tokens de entrada y salida | | |
| Lecturas de archivos y llamadas a herramientas | | |
| Tiempo | | |
| Decisión y confianza de Laya/Jev | | |
| Recuperación de Engram | | |

Notas:

- Laya es no determinista: repite el caso 6 tres veces y anota `route`, `confidence` y
  `probabilities` de cada corrida.
- Mide cada pieza por separado cuando quieras saber cuál aporta más: activar skills y
  MCP a la vez no garantiza menos tokens.
- Para detener Laya: `pkill -f laya-serve` (corre en `~/venvs/laya-poc`).
