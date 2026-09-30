# ¿Puede una IA decidir *cómo empezar* antes de que otra IA programe?

**POC: System One como capa de decisión previa para agentes de programación.**

> **En una frase**: conecté un modelo de decisiones (Jev/Laya) a tres entornos de agentes
> (Pi, OpenCode y DSH) para que la ruta de trabajo —*explorar, implementar, probar o
> preguntar*— se decida **antes** de arrancar al agente. La integración funciona y es
> determinista; el ahorro de coste, en la tarea medida, **no apareció** (+13% en Pi,
> +16% en OpenCode). Este repositorio contiene el código, los datos y los informes.

---

## 1. La idea, en simple

Un agente de programación (una IA que lee y escribe código) antes de tocar nada tiene que
decidir **por dónde empezar**: ¿exploro el proyecto?, ¿implemento el cambio?, ¿lo pruebo?,
¿o pido más información?

Normalmente esa decisión la toma el propio modelo grande, "pensando" — y pensar cuesta
tokens (tiempo y dinero). **System One** es una familia de modelos distinta: no escribe
texto, **clasifica**. Recibe la tarea y devuelve una ruta tipada con probabilidades en
milisegundos:

| Ruta | Qué significa |
|---|---|
| `inspect` | Primero entender el código o los patrones existentes |
| `implement` | El cambio está claro: hacerlo |
| `test` | El cambio ya existe: verificarlo |
| `clarify` | Falta una decisión del usuario que afecta el alcance |

**La pregunta de esta POC**: si esa decisión la toma System One *antes* de arrancar al
agente (un **preflight**), ¿el agente trabaja mejor o más barato?

## 2. Glosario express

| Término | En una línea |
|---|---|
| **LLM** | Modelo de lenguaje: la IA que lee y escribe texto/código (aquí, DeepSeek V4.1 Flash). |
| **Harness** | El programa que conecta al modelo con tu proyecto: archivos, terminal, herramientas. Pi, OpenCode y DSH son harnesses. |
| **MCP** | Un "adaptador estándar" para enchufar herramientas externas a un harness (aquí, System One). |
| **System One** | Modelo de decisión **no generativo**: no escribe, clasifica. Dos implementaciones probadas: **Jev** (alojado) y **Laya** (local). |
| **Preflight** | Comprobación previa: consultar la decisión **antes** de que el agente empiece. |
| **Token** | Unidad de texto que el modelo procesa o genera. Más tokens = más coste. |
| **cacheRead** | Parte del contexto que el proveedor reutiliza desde caché (se re-paga en cada turno, pero más barato). |

## 3. Qué se construyó

```
                    ┌──────────────────────────┐
                    │   System One (Jev/Laya)  │   decide la ruta
                    └────────────▲─────────────┘
                                 │  preflight (antes de arrancar)
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   ┌────┴─────┐           ┌──────┴──────┐          ┌──────┴──────┐
   │   DSH    │           │     Pi      │          │  OpenCode   │
   │ (plugin  │           │  (MCP +     │          │  (MCP +     │
   │  nativo) │           │  preflight) │          │  preflight) │
   └────┬─────┘           └──────┬──────┘          └──────┬──────┘
        │                        │                        │
        └────────────────────────┴────────────────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  Agente + LLM (DeepSeek) │  ejecuta el trabajo
                    └──────────────────────────┘
```

| Pieza | Para qué | Dónde |
|---|---|---|
| `systemone-plugin/` | Plugin **nativo de DSH** que expone la herramienta `systemone_decide` | `systemone-plugin/` |
| `systemone-mcp/` | **Servidor MCP** (stdio) que expone la misma herramienta a Pi y OpenCode, más el `preflight.mjs` | `systemone-mcp/` |
| `demo-app/` | Aplicación TypeScript de prueba (tareas + tests con Vitest) | `demo-app/` |
| `eval/` | Informes de cada ronda de medición (con números crudos) | `eval/` |
| `odd/tasks/` | Documento de trabajo del método ODD usado durante la POC | `odd/tasks/poc-systemone.md` |

Las tres superficies comparten el **mismo contrato HTTP** (`client.js`): cambiar de Jev a
Laya es cambiar tres variables de entorno, sin tocar código.

## 4. Cómo se midió

- **Misma tarea** en todos los casos: *en `demo-app`, rechazar títulos de tarea duplicados
  (sin distinguir mayúsculas), con test, ejecutando `npm test`*.
- **Mismo modelo** en todos los casos: `opencode-go/deepseek-v4.1-flash`, razonamiento
  `max`.
- **5 ejecuciones sin System One (OFF) y 5 con System One (ON)** por harness, orden
  alternado, con el repositorio restaurado (snapshot con hash) entre ejecuciones.
- En **ON**, el `preflight` consulta System One **antes de arrancar** y entrega la
  decisión en las instrucciones del agente: el tratamiento no depende de que el modelo
  recuerde llamar a la herramienta.
- Métricas **separadas**: coste facturado, tokens de entrada, de salida, de razonamiento
  y de caché, además de duración.

## 5. Resultados

### 5.1 Matriz `max` — 5 OFF vs 5 ON (promedio por ejecución)

| Métrica | Pi OFF | Pi ON | Δ | OpenCode OFF | OpenCode ON | Δ |
|---|---|---|---|---|---|---|
| Coste | $0,0156 | $0,0176 | **+13%** | $0,0369 | $0,0427 | **+16%** |
| Razonamiento | 7.171 | 9.690 | **+35%** | 31.721 | 38.002 | **+20%** |
| Entrada | 34.797 | 38.732 | +11% | 79.603 | 94.395 | +19% |
| Salida | 11.427 | 13.537 | +18% | 5.008 | 4.821 | −4% |
| cacheRead | 1,16 M | 1,22 M | +5% | 979.686 | 964.301 | −2% |
| Duración | 161 s | 163 s | +2% | 321 s | 321 s | 0% |

**Interpretación**: en esta tarea, activar System One **no ahorró**: el coste y el
razonamiento subieron en ambos entornos. Todas las decisiones fueron `inspect` (revisar
primero) — y esa revisión parece haber **añadido** trabajo en vez de evitarlo. La corrida
más barata y la más cara de Pi fueron ambas ON: la varianza domina.

Detalles, datos crudos y dispersión: [`eval/round4-max-matrix.md`](eval/round4-max-matrix.md).

### 5.2 El coste del esquema (System One no es "gratis")

El esquema de la herramienta + la línea de decisión añaden **~200 tokens al prefijo** de
cada solicitud (216 en Pi, 201 en OpenCode), que se re-pagan en cada turno. Es pequeño
frente al total, pero es real: conviene no tratar esos tokens como "cero".

### 5.3 Jev vs Laya (benchmark de 12 casos × 3)

| Medida | Jev | Laya |
|---|---|---|
| Aciertos | **12/12** | 8/12 |
| Confianza media | **0,997** | 0,695 |
| Latencia p50 | 262 ms | **58 ms** |

Laya es ~4× más rápida y local, pero **sesgada a la acción**: recomienda `implement`
donde Jev pide `inspect`/`clarify`. Y su confianza **no discrimina** aciertos de errores:
un umbral (p. ej. "no actuar bajo 0,3") no arregla el problema — los cuatro fallos tienen
confianza 0,46-0,85. Análisis completo:
[`eval/laya-threshold-analysis.md`](eval/laya-threshold-analysis.md) ·
[`eval/decision-benchmark.md`](eval/decision-benchmark.md).

### 5.4 Herramientas complementarias

| Herramienta | Para qué | Resultado |
|---|---|---|
| **Engram** | Memoria entre sesiones | ✅ guardar → recuperar verificado en los 3 harnesses |
| **CodeGraph** | Explorar relaciones del código | ✅ probado en Pi y DSH |
| **Context7** | Documentación de librerías | ✅ probado en Pi y DSH |
| **Búsqueda web** | Información externa | ✅ probada en Pi y DSH |
| **Playwright** | Automatizar el navegador | ✅ probado en Pi y DSH |
| **Caveman** | Reducir la extensión de las respuestas | −42% tokens de salida (Pi), −14% (DSH) |
| **Ponytail** | Empujar a la solución mínima | −29% en DSH; en Pi quedó inconcluso |
| **ODD** | Ordenar y registrar el trabajo | usado en toda la POC (ver `odd/tasks/`) |

Detalles: [`eval/tool-tests.md`](eval/tool-tests.md).

## 6. Qué aprendimos

1. **La integración funciona y es determinista**: 20/20 ejecuciones ON pasaron por
   System One vía preflight; el agente no puede "olvidarse" de consultarla.
2. **Decidir bien no es ahorrar**: una buena ruta puede *añadir* trabajo (`inspect` hace
   que el agente explore más). El ahorro depende de **qué** decide y de cómo lo ejecuta.
3. **Jev es fiable, Laya es rápida**: en el benchmark, Jev acertó todo con confianza
   casi binaria; Laya voló pero con sesgo. Su confianza no sirve como filtro automático.
4. **Las preguntas interactivas rompen las ejecuciones headless**: un flujo de
   consentimiento (¿reportar un defecto?) sin usuario termina la sesión.
5. **El contexto tiene coste fijo**: cada herramienta MCP suma su esquema al prefijo, que
   se re-paga en cada turno. Menos turnos = más ahorro que cualquier micro-optimización.

## 7. Cómo reproducirlo

Requisitos: Node 22+, `npm`, y un harness (Pi, OpenCode o DSH). Para Laya: Python 3.10+.

```bash
git clone <este-repo> && cd <este-repo>

# 1) App de prueba
cd demo-app && npm install && npm test && cd ..

# 2) Backend de decisión (elige uno)
#    Laya local:
#      uv venv ~/venvs/laya-poc --python 3.12
#      uv pip install --python ~/venvs/laya-poc/bin/python "laya[serve]"
#      LAYA_HOST=127.0.0.1 LAYA_PORT=8000 LAYA_MODELS=multilingual LAYA_PRELOAD=1 \
#        ~/venvs/laya-poc/bin/laya-serve
#    Jev alojado: consigue una clave en console.typesafe.ai

# 3) Configuración (fuera del repositorio)
cat > .env <<'EOF'
SYSTEMONE_URL=https://api.typesafe.ai/v1/systemone   # o http://127.0.0.1:8000/v1/systemone
SYSTEMONE_MODEL=jev-latest                            # o multilingual
SYSTEMONE_API_KEY=tu_clave                            # vacío si usas Laya
EOF

# 4) Preflight (decisión antes de arrancar)
node systemone-mcp/preflight.mjs "Tarea de prueba" "contexto del repo"

# 5) Servidor MCP (stdio) para Pi / OpenCode
node systemone-mcp/server.js     # se enchufa desde la config MCP de cada harness

# 6) En DSH: plugin nativo
#    dsh plugin --profile <perfil> add ./systemone-plugin
```

El detalle de cada conexión (Pi, OpenCode, DSH) está en los informes de `eval/` y en el
`README.md` de `systemone-plugin/`.

## 8. Estructura del repositorio

```
.
├── AGENTS.md                 # reglas de trabajo del proyecto (para los agentes)
├── demo-app/                 # app TypeScript de prueba (dominio + UI + tests Vitest)
├── systemone-plugin/         # plugin nativo de DSH (herramienta systemone_decide)
│   ├── client.js             # contrato HTTP único (compartido)
│   └── test/smoke.mjs
├── systemone-mcp/            # servidor MCP + preflight para Pi y OpenCode
│   ├── server.js
│   ├── preflight.mjs
│   └── test/smoke.mjs
├── eval/                     # informes de medición (crudos y explicados)
│   ├── round4-max-matrix.md  # la matriz 5+5 (resultado principal)
│   ├── decision-benchmark.md # Jev vs Laya
│   ├── laya-threshold-analysis.md
│   ├── tool-tests.md         # Engram, CodeGraph, Context7, Playwright, ...
│   ├── comparison-3-harnesses.md
│   ├── round3-decision-layer.md
│   └── e2e-checklist.md
├── odd/tasks/                # documento de trabajo del método ODD
```

## 9. Límites y siguientes pasos

**Límites**: n=5 por celda; una tarea pequeña y bien delimitada; todas las decisiones
fueron `inspect` (no se midió `implement` todavía); parte de las mediciones de la etapa 6
se hicieron con carga concurrente.

**Siguientes pasos** (en curso):
1. Medir una ruta **`implement`** impuesta: ¿evita exploración y ahorra de verdad?
2. Probar una **tarea ambigua** (donde el modelo gastaría turnos decidiendo solo).
3. **Laya**: no usarla como router autónomo con umbral; explorar recalibración.
4. Repetir la etapa 6 en máquina limpia.

## 10. Créditos y licencias de terceros

- Skills de terceros copiadas con su licencia y su origen en
  `.dsh/skills/` (**ponytail** de DietrichGebert, **caveman** de JuliusBrussee).
- El ecosistema [Gentle-AI](https://github.com/Gentleman-Programming/gentle-ai) inspiró
  el método de trabajo (ODD, skills, memoria).
- **Jev** es de [TypeSafe](https://typesafe.ai); **Laya** es open source
  ([NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)).
- Licencia de este repositorio: **MIT** (ver [`LICENSE`](LICENSE)).
