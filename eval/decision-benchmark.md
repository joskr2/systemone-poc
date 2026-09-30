# Benchmark de servicios de decisión: Laya vs Jev

Fecha: 2026-09-30. Mismas entradas para ambos, 12 casos (3 por ruta esperada),
3 repeticiones por caso, vía `client.js` (sin LLM en el medio).

## Resultados

| caso | esperado | Jev (rutas ×3) | conf | Laya (rutas ×3) | conf |
|---|---|---|---|---|---|
| C01 validación email con patrón existente | inspect | inspect ×3 | 1.00 | **implement** ×3 | 0.46 |
| C02 cambiar texto de botón | implement | implement ×3 | 1.00 | implement ×3 | 0.83 |
| C03 verificar fix de ayer | test | test ×3 | 1.00 | test ×3 | 0.64 |
| C04 elegir entre dos diseños de API | clarify | clarify ×3 | 1.00 | **implement** ×3 | 0.52 |
| C05 entender flujo UI→servicio | inspect | inspect ×3 | 1.00 | inspect ×3 | 0.84 |
| C06 endpoint ya especificado | implement | implement ×3 | 1.00 | implement ×3 | 0.98 |
| C07 correr suite sin regresiones | test | test ×3 | 1.00 | **clarify** ×3 | 0.71 |
| C08 decidir migración a Postgres | clarify | clarify ×3 | 1.00 | **implement** ×3 | 0.85 |
| C09 bug: entender causa raíz | inspect | inspect ×3 | 0.99 | inspect ×3 | 0.57 |
| C10 renombrar variable local | implement | implement ×3 | 0.97 | implement ×3 | 0.64 |
| C11 validar contador de la UI | test | test ×3 | 1.00 | test ×3 | 0.75 |
| C12 definir qué muestra el contador | clarify | clarify ×3 | 1.00 | clarify ×3 | 0.55 |

| métrica | Jev | Laya |
|---|---|---|
| acierto vs esperado | **12/12 (100%)** | 8/12 (67%) |
| estabilidad (3/3 igual) | 12/12 | 12/12 |
| confianza media | **0.997** | 0.695 |
| latencia media / p50 | 266 ms / 262 ms | **91 ms / 58 ms** |

Acuerdo entre servicios (mayoría): **8/12 (67%)**.

## Lectura

- **Jev**: perfecto en este set, con confianza casi binaria y estable. Coste: 3× la
  latencia de Laya y servicio alojado (clave).
- **Laya**: 3× más rápido y local, pero sesgado a la acción: donde Jev pide
  inspeccionar o aclarar, Laya tiende a `implement` (C01, C04, C08) y una vez a
  `clarify` donde tocaba `test` (C07).
- Ambos son deterministas por caso en esta muestra (3/3 idénticos); la varianza de
  Laya aparece entre formulaciones distintas del mismo estado, no dentro de una.

## Límites

- Las rutas "esperadas" son juicio del autor del set (12 casos, no un benchmark público).
- n=3 repeticiones; latencia medida con la matriz de fondo corriendo (puede inflarse levemente).
- Antes de integrar Laya en pi/OpenCode: repetir este set ampliado y decidir umbral de
  confianza (p. ej. no actuar sobre `clarify` con confianza < 0.3).

## Implicación para la POC

Jev es el candidato para la ruta por defecto; Laya sirve como opción local rápida
(útil en bucles de muchas decisiones cortas), con la salvedad del sesgo a `implement`.
La integración de Laya en pi/OpenCode queda pendiente (el puente se probó con Jev).
