# Laya: ¿sirve un umbral de confianza como política? (análisis)

Fecha: 2026-09-30. Datos: `eval/decision-benchmark.md` (12 casos × 3 repeticiones,
mismas entradas para Laya y Jev).

## Resultado del umbral (política sugerida: no actuar bajo 0.3)

| umbral | acepta | correctas | precisión | cobertura |
|---|---|---|---|---|
| 0.0 | 12/12 | 8 | 67% | 100% |
| **0.3** | **12/12** | **8** | **67%** | **100%** |
| 0.5 | 11/12 | 8 | 73% | 92% |
| 0.6 | 8/12 | 6 | 75% | 67% |
| 0.7 | 6/12 | 4 | 67% | 50% |
| 0.8 | 4/12 | 3 | 75% | 33% |
| 0.9 | 1/12 | 1 | 100% | 8% |

**El umbral 0.3 no filtra nada** (los 4 fallos tienen confianza ≥ 0.46) y subirlo no
separa bien: la precisión se estanca en 67-75% y la cobertura se derrumba. La confianza
de Laya **no discrimina acierto/fallo** en este set.

## Detalle (casos ordenados por confianza de Laya)

| caso | conf | ruta Laya | esperado | |
|---|---|---|---|---|
| C06 | 0.98 | implement | implement | OK |
| C08 | **0.85** | implement | clarify | **FALLO** |
| C05 | 0.84 | inspect | inspect | OK |
| C02 | 0.83 | implement | implement | OK |
| C11 | 0.75 | test | test | OK |
| C07 | **0.71** | clarify | test | **FALLO** |
| C03 | 0.64 | test | test | OK |
| C10 | 0.64 | implement | implement | OK |
| C09 | 0.57 | inspect | inspect | OK |
| C12 | 0.55 | clarify | clarify | OK |
| C04 | **0.52** | implement | clarify | **FALLO** |
| C01 | **0.46** | implement | inspect | **FALLO** |

Jev: 0.97-1.00 de confianza en los 12, con 12/12 de acierto.

## Recomendación

- **No integrar Laya como router autónomo con umbral** en este estado: el umbral no
  arregla su sesgo a `implement` (3 de sus 4 fallos son "actuar" donde tocaba
  inspeccionar/aclarar).
- Opciones viables, en orden: (a) usar **Jev** como router por defecto (12/12, conf.
  casi binaria); (b) usar Laya solo como **pre-filtro de velocidad** en decisiones donde
  el error es barato (p. ej. `implement` vs `inspect` en bucles cortos), con revisión
  del modelo cuando Laya elige `implement`; (c) recalibrar/afinar Laya antes de darle
  autoridad de ruta.
- Si se quiere umbral, exigiría **0.9+** (100% precisión pero 8% de cobertura): en la
  práctica equivale a no usarla.
