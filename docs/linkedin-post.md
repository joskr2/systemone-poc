# Versión divulgativa — para compartir

> Tono amigable, sin jerga, con las métricas justas. Lista para publicar (LinkedIn o
> similar). Los conceptos técnicos se explican en una línea, sin perder el rigor.

---

## Post para LinkedIn

**¿Puede una IA decidir cómo empezar antes de que otra IA programe?**

Estoy probando una idea: antes de que un asistente de programación toque el código,
¿puede otra herramienta decirle por dónde empezar?

En esta POC conecté una capa de decisión llamada **System One** a tres entornos de
trabajo con IA (Pi, OpenCode y DSH). Antes de arrancar, recomienda una ruta: revisar el
proyecto, implementar el cambio, probarlo o pedir más información.

Para ubicar las piezas:

🧠 **DeepSeek V4.1 Flash** es el LLM: el modelo de lenguaje que escribió el código. Un
LLM entiende y genera texto — y también código.

⚖️ **Jev y Laya** son las dos opciones de System One. No son LLMs generativos: **no
escriben, clasifican**. Reciben la tarea y devuelven una recomendación con su nivel de
confianza en milisegundos.

🔌 **MCP** es el adaptador estándar que permite enchufar esa herramienta a los
asistentes.

Comparé la misma tarea 5 veces con la recomendación y 5 sin ella, en Pi y en OpenCode.
¿El resultado? La integración funcionó siempre… pero **no ahorró**: el coste subió 13%
en Pi y 16% en OpenCode. En todas las pruebas la recomendación fue "revisar primero", y
esa revisión añadió trabajo en lugar de evitarlo.

También comparé las dos opciones: en un benchmark pequeño, **Jev acertó 12 de 12** casos
y **Laya 8 de 12** (Laya fue más rápida, pero tiende a recomendar "implementar" cuando
conviene revisar).

Y probé herramientas de apoyo: memoria entre sesiones (Engram) y exploración de código
(CodeGraph).

La lección: dar una buena recomendación a una IA no garantiza que gaste menos. Hay que
medir qué recomienda y qué provoca. Siguiente experimento: ¿y si la recomendación es
"implementa directamente"?

\#InteligenciaArtificial #DesarrolloDeSoftware #AgentesDeIA #Aprendizaje

---

## Versión corta (para un comentario o un resumen)

Antes de programar, una IA tiene que decidir *por dónde empezar*. Probé que esa decisión
la tome un modelo especializado (System One: Jev/Laya) en vez del modelo que escribe el
código (DeepSeek V4.1). La integración funcionó y la decisión llegó siempre a tiempo…
pero en esta tarea el coste subió (13-16%) en vez de bajar: la ruta recomendada
("revisar primero") añadía trabajo. Moraleja: una buena decisión no es automáticamente
una decisión barata — hay que medir el efecto real de cada ruta.
