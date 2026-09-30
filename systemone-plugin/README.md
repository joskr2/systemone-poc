# dsh-systemone-poc

Plugin local de DSH que expone **una sola herramienta**, `systemone_decide`, para pedir una
decisión de ruta tipada a un servicio de decisión System One (Laya o Jev, mismo contrato HTTP)
antes de empezar una tarea de programación.

La herramienta devuelve:

- `route`: `inspect` | `implement` | `test` | `clarify`
- `confidence`: confianza de la respuesta elegida, en `[0, 1]`
- `probabilities`: probabilidad de cada ruta
- `model`: modelo de enrutado que respondió

Es una guía, no una implementación: el agente decide qué hacer con la ruta.

## Estructura

| Archivo | Función |
|---|---|
| `index.js` | Pegamento del plugin (registra la herramienta en DSH). Solo se ejecuta dentro del runtime de DSH. |
| `client.js` | Cliente HTTP puro, sin imports de `@deepseek-ai/*`. Se puede ejecutar en Node 22 normal. |
| `test/smoke.mjs` | Prueba de humo de punta a punta contra un servicio local ya arrancado. |
| `package.json` | Solo `peerDependencies`: el runtime de DSH resuelve los imports `@deepseek-ai/*`. |

## Variables de entorno

| Variable | Por defecto | Qué configura |
|---|---|---|
| `SYSTEMONE_URL` | `http://127.0.0.1:8000/v1/systemone` | Endpoint completo del servicio de decisión. |
| `SYSTEMONE_MODEL` | `multilingual` | Nombre del modelo de enrutado que se envía en el cuerpo. |
| `SYSTEMONE_API_KEY` | vacío | Si tiene valor, se añade la cabecera `Authorization: Bearer <valor>`. |

Las variables solo se usan si la configuración del plugin no define `url`, `model` o `apiKey`.
La configuración del plugin tiene prioridad sobre el entorno.

## Laya y Jev

Los dos backends hablan el mismo contrato HTTP, así que **se cambian solo con variables de
entorno** (o con la configuración del plugin) y la herramienta `systemone_decide` no cambia:

- **Laya local**: `SYSTEMONE_URL=http://127.0.0.1:8000/v1/systemone`, `SYSTEMONE_MODEL=multilingual`.
  Es el valor por defecto, pensado para el servidor de Laya ya arrancado en local.
- **Jev**: se apunta `SYSTEMONE_URL` al endpoint de Jev y `SYSTEMONE_MODEL` al modelo que ese
  despliegue espere; si Jev pide autenticación, se define `SYSTEMONE_API_KEY`. Este repositorio
  no fija la URL ni el modelo de Jev porque dependen de su despliegue.

La herramienta es la misma en ambos casos: por eso el cambio de backend no obliga a tocar
el prompt ni las llamadas del agente.

## Prueba de humo

Requiere un servicio de decisión **ya arrancado** (este plugin no lo arranca ni lo detiene):

```bash
cd systemone-plugin
node test/smoke.mjs
```

Comprueba que la ruta sea una de las cuatro válidas, que `confidence` sea un número en `[0, 1]`
y que `probabilities` tenga las cuatro claves y sume 1 (±0.02). Imprime la decisión normalizada
y `SMOKE OK`; si algo falla, imprime `SMOKE FAILED: ...` y sale con código 1.

## Notas

- No se ejecuta `npm install`: `index.js` importa `@deepseek-ai/*` como peers y solo resuelven
  dentro del runtime de DSH. `client.js` y la prueba de humo usan únicamente Node estándar.
- `index.js` no se puede importar con `node` a secas (falla al resolver los peers); eso es
  esperado y se verifica dentro de DSH.
