# Ronda 4 — ciclo max 5 OFF + 5 ON por harness (preflight obligatorio)

Fecha: 2026-09-30. Objetivo: repetir la medición de la capa de decisión con
tratamiento determinista y n=5 por condición, en `max`.

## Diseño

- Mismo prompt para todas las celdas (validación de duplicados en demo-app + test +
  `npm test` + CodeGraph), mismo repo, **snapshot congelado** (hash en
  `$T/matrix2/snapshot-hash.txt`), restaurado entre corridas, sin commits.
- **ON = preflight obligatorio**: `systemone-mcp/preflight.mjs` llama a System One
  ANTES de arrancar y la decisión se inyecta en el prompt. El MCP queda disponible
  (config actual); `tool_called` se registra.
- Orden alternado por pares (off,on / on,off / …). Timeouts con presupuesto 300 s (pi)
  y 600 s (OpenCode), reportados aparte.
- Modelo: `opencode-go/deepseek-v4.1-flash`; thinking `max` explícito.

## pi + gentle-shell — FINAL (5+5)

| run | cond | dur | msgs | decisión | input | cacheRead | output | reasoning | cost |
|---|---|---|---|---|---|---|---|---|---|
| 1 | off | 179 s | 48 | — | 41.636 | 1.343.488 | 13.551 | 8.679 | $0,0184 |
| 2 | on | 290 s | 57 | inspect | 48.601 | 2.113.152 | 22.237 | 16.990 | $0,0270 |
| 3 | on | 174 s | 35 | inspect | 95.857 | 1.090.176 | 17.845 | 13.392 | $0,0284 |
| 4 | off | 151 s | 33 | — | 32.511 | 973.952 | 11.258 | 7.651 | $0,0146 |
| 5 | off | 92 s | 32 | — | 30.337 | 806.656 | 8.124 | 5.585 | $0,0118 |
| 6 | on | 74 s | 27 | inspect | 10.124 | 738.048 | 6.252 | 3.825 | $0,0075 |
| 7 | on | 78 s | 30 | inspect | 13.351 | 760.704 | 6.104 | 3.444 | $0,0080 |
| 8 | off | 247 s | 38 | — | 20.906 | 1.130.240 | 13.450 | 9.968 | $0,0146 |
| 9 | off | 134 s | 47 | — | 48.597 | 1.570.432 | 10.751 | 3.973 | $0,0185 |
| 10 | on | 201 s | 42 | inspect | 25.725 | 1.406.080 | 15.245 | 10.798 | $0,0172 |

**Agregados (medias por corrida):**

| métrica | OFF | ON | delta |
|---|---|---|---|
| coste | $0,0156 | $0,0176 | **+13%** |
| reasoning | 7.171 | 9.690 | **+35%** |
| output | 11.427 | 13.537 | +18% |
| input | 34.797 | 38.732 | +11% |
| cacheRead | 1.164.954 | 1.221.632 | +5% |
| duración | 161 s | 163 s | +2% |
| tests | 17 (5/5) | 17-18 (4/5 con 17) | — |
| dispersión coste | 1,6× | **3,8×** | — |

**Lectura**: el tratamiento obligatorio **no ahorra** en max; cuesta ~13% más, con
reasoning +35% y varianza mucho mayor (la corrida más barata y la más cara son ambas
ON). `tool_called=0` en las 5 ON: el preflight es el tratamiento único. La señal de
ahorro de la ronda 3 (n=1, −40%) **no se replicó: era ruido**.

## OpenCode — FINAL (5+5)

| run | cond | dur | steps | decisión | input | cacheRead | output | reasoning | cost | tool_called |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | off | 381 s | 15 | — | 82.457 | 913.792 | 6.439 | 40.413 | $0,0432 | 0 |
| 2 | on | 331 s | 10 | inspect | 93.730 | 775.040 | 4.548 | 35.172 | $0,0402 | 0 |
| 3 | on | 353 s | 11 | inspect | 82.849 | 817.408 | 4.138 | 34.906 | $0,0383 | 0 |
| 4 | off | 260 s | 19 | — | 64.352 | 1.147.136 | 5.374 | 18.915 | $0,0277 | 0 |
| 5 | off | 291 s | 8 | — | 76.461 | 487.040 | 3.960 | 29.871 | $0,0332 | 0 |
| 6 | on | 368 s | 14 | inspect | 96.760 | 1.161.344 | 5.622 | 34.996 | $0,0424 | 1 |
| 7 | on | 200 s | 13 | inspect | 88.480 | 873.216 | 4.381 | 29.038 | $0,0359 | 0 |
| 8 | off | 567 s ⚠ | 16 | — | 110.316 | 1.173.504 | 6.340 | 60.159 | $0,0600 | 0 |
| 9 | off | 104 s | 19 | — | 64.431 | 1.176.960 | 2.927 | 9.247 | $0,0205 | 0 |
| 10 | on | 352 s | 14 | inspect | 110.156 | 1.194.496 | 5.414 | 55.896 | $0,0569 | 2 |

**Agregados (medias por corrida):**

| métrica | OFF | ON | delta |
|---|---|---|---|
| coste | $0,0369 | $0,0427 | **+16%** |
| reasoning | 31.721 | 38.002 | **+20%** |
| input | 79.603 | 94.395 | +19% |
| output | 5.008 | 4.821 | −4% |
| cacheRead | 979.686 | 964.301 | −2% |
| duración | 321 s | 321 s | 0% |
| dispersión coste | 2,9× | 1,6× | — |

⚠ Run 8 (off, exit=1): completó la tarea (17/17) pero el **review nativo de gentle-ai
falló de forma tipada** y la pregunta de consentimiento para reportarlo rompió la sesión
headless. Su coste ($0,0600) es el más alto de su condición: incluye el intento de review
y el flujo de pregunta. `tool_called`: 3 llamadas adicionales en runs 6 y 10 (el
preflight ya garantizaba el paso por System One en las 5 ON).

## Coste del esquema (no es gratis)

Prefijo inicial (primer mensaje/step con usage), aislado:

| harness | OFF | ON | delta |
|---|---|---|---|
| pi | ~68.425 | ~68.641 | **+216** |
| OpenCode | ~36.982 | ~37.183 | **+201** |

El esquema de la herramienta + la línea de decisión añaden ~200-220 tokens al prefijo,
re-pagados cada turno (~7-9 k por corrida en pi, ~2-3 k en OpenCode). Coherente con la
revisión: el coste marginal no es cero; el ahorro debía venir de reasoning/turnos y en
max no apareció.

## Veredicto contra el criterio de aprobación

Criterio: (1) todas las ON pasan por System One; (2) misma tarea con el mismo criterio
de aceptación; (3) el ahorro se repite sin perder calidad.

1. ✅ **Cumplido por construcción** (preflight) — 10/10 corridas ON de pi, y las de
   OpenCode hasta ahora; `tool_called=0` confirma que no hubo dependencia del modelo.
2. ✅ **Cumplido** — 17/17 tests en 9 de 10 corridas de pi (una escribió un test extra:
   cubre un caso negativo adicional; mismo cambio de fondo) y en todas las de OpenCode.
3. ❌ **No cumplido en max** — el ahorro no se repite; hay coste adicional con más
   varianza: pi **+13% coste / +35% reasoning**; OpenCode **+16% coste / +20% reasoning**.
   Por la regla acordada ("si max mantiene la señal → high"), **el ciclo `high` queda
   descartado** con esta tarea y estos harnesses.

**Conclusión**: la capa de decisión queda **aprobada como tratamiento determinista y
como router de calidad** (benchmark Jev 12/12 vs Laya 8/12) — **no aprobada como ahorro
de tokens en max**. El valor medible está en la precisión de ruta y en la posibilidad de
*imponer* flujo (una decisión `implement` evita exploración), no en un ahorro automático.

**Observaciones finales del ciclo**:

- El preflight cumplió: 10/10 ON de pi y 10/10 de OpenCode pasaron por System One;
  `tool_called` extra solo en 3 corridas de OpenCode (el modelo volvió a llamar la
  herramienta además de la decisión inyectada).
- Todas las corridas ON decidieron `inspect` (Jev 0.68-0.80): el efecto de una decisión
  `implement` (hipótesis de menos turnos) no se midió — siguiente experimento natural.
- Calidad estable: 17/17 tests en 19 de 20 corridas (una de pi escribió un test extra).
- Run 8 de OpenCode (exit 1): el review nativo de gentle-ai falló tipadamente y la
  pregunta de consentimiento rompió la sesión headless (hallazgo en Engram, no reportado
  por decisión del usuario).

## Etapa 6 (resumen)

Ver `eval/tool-tests.md`: Engram guardar→recuperar ✅ en los tres; CodeGraph, Context7
y búsqueda web ✅ en pi y DSH; Playwright ✅ en pi; Caveman −42% (pi) / −14% (DSH);
Ponytail inconcluso (repetición limpia pendiente). OpenCode: pendiente de corrida limpia.

## Siguientes pasos (ronda 5, en curso)

1. **EXP1 — imponer `implement`**: 5 corridas ON con ruta impuesta `implement` por
   harness (misma tarea), para medir si el flujo barato impuesto ahorra turnos/tokens.
2. **EXP2 — tarea ambigua** (pi, 3 OFF + 3 ON): Jev decide `implement` (0.55); Laya
   diría `clarify` (0.42). Mide el escenario donde el modelo gastaría turnos decidiendo.
3. **Umbral de Laya**: análisis cerrado — **el umbral no discrimina** (ver
   `eval/laya-threshold-analysis.md`); no integrar como router autónomo con umbral.
4. **Etapa 6 limpia**: repetir Ponytail y la etapa 6 de OpenCode sin carga concurrente
   (pendiente de máquina libre).
