# Eco-Asistente (Offline WebLLM)

Aplicación React (Vite) que recomienda misiones de sostenibilidad usando una base de conocimientos local y un LLM ligero ejecutado 100% en el navegador (WebGPU).

## Requisitos para modo offline

- Navegador con WebGPU (Chrome/Edge actualizados en Windows). En `chrome://flags`, habilita “WebGPU Developer Features” si fuese necesario.
- GPU compatible con WebGPU y drivers al día.

## Modelo local

- Modelo por defecto: `Llama-3.2-1B-Instruct-q4f16_1-MLC`.
- Para 100% offline, coloca los archivos del modelo en:
  `public/models/Llama-3.2-1B-Instruct-q4f16_1-MLC/`

La app intentará cargar primero desde esa carpeta. Si no existe, WebLLM puede usar fuentes remotas (internet) a menos que lo bloquees.

## Desarrollo

1. Instalar dependencias (npm install)
2. Ejecutar entorno local (npm run dev)

## Build

Genera producción en `dist/` (npm run build).

---

Estructura relevante:

- `src/App.jsx`: integra `@mlc-ai/web-llm`, RAG y streaming.
- `src/knowledgeBase.json`: base de conocimiento local.
