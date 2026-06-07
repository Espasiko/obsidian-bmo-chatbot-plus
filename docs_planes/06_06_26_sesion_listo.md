# Sesión 05-06 / 06-06 2026 — "Listo para beta" (Miguel, Nina, Yayo)

> Registro de TODO lo hecho. Fuente de verdad del proxy: `/home/spas/build_agente/proxy_agente_escritor.py`
> (backup en `OPOS_GEMINI_1/backend/`). Exe desplegado a los 3 vaults.

---

## 0. Resumen en una línea
OCR por lotes para los apuntes de Miguel + arreglo total de modelos/keys (Gemini, Groq, Mistral)
+ limpieza del menú de modelos + plan Cerebrito/Durga. Los 3 vaults quedan funcionales.

---

## 1. Tool nuevo: `ocr_carpeta` (lotes grandes de OCR)

**Para:** transcribir cientos/miles de fotos de apuntes manuscritos (Miguel: 1000+ páginas).
**Archivo:** `proxy_agente_escritor.py` (funciones `ocr_carpeta`, `_ocr_one`, `_guardar_json`).

- Recorre una carpeta del vault, OCR (Mistral) de cada imagen → una nota `.md`.
- **Reanuda solo**: `.ocr_progreso.json` guarda lo hecho; si se corta, repetir y salta lo ya transcrito.
- **Ritmo tranquilo**: pausa configurable (2s por defecto).
- **Si la API se satura (429)**: espera 90s, reintenta; si sigue, PARA y avisa para reanudar luego.
- Crea **índice** `_INDICE_TRANSCRIPCIONES.md` con enlaces `[[...]]` (semilla del grafo).
- Cada `.md` lleva frontmatter `origen`, `tipo: transcripcion-ocr`, `revisado: false`.

**PROBADO de verdad** con las 6 fotos reales de Miguel (`01_CRUDO/apuntes_mano/`):
6/6 transcritas, índice creado, reanudar verificado (2ª pasada saltó las 6).
Calidad sobre su letra difícil: capta Göbekli Tepe, Pueblos del Mar, Kadesh, Gilgamesh… (con erratas menores, revisable).

---

## 2. Guard de contexto (adiós "Error 502")
En `proxy_chat`: si el texto excede el contexto del modelo, en vez de error 502 devuelve un
mensaje claro en el chat ("texto demasiado largo, pídemelo por partes o usa modelo de contexto grande").

## 2b. Reenvío de `max_tokens` (arregla OpenRouter 402)
El proxy NO reenviaba `max_tokens` → OpenRouter reservaba el máximo del modelo (16384) y daba
**402 "requires more credits"** con keys de poco saldo. Ahora `_chat_completion` reenvía
`max_tokens` (el del cliente/perfil, ~4096 por defecto) en las 2 llamadas del bucle de agente.

### Keys de pago SIN saldo (probadas 06/06)
- ❌ OpenAI `sk-proj-...` → **429 quota exceeded** (no hay tier gratis real; necesita facturación).
- ❌ OpenRouter → **402** (key sin créditos; necesita los $10 de depósito único).
- ✅ **Para Miguel, usar lo que funciona gratis/barato:** `gemini:gemini-flash-latest`, `groq:openai/gpt-oss-120b`, `mistral:mistral-large-latest` (key nueva), `deepseek:deepseek-chat`.

---

## 3. Modelos y keys — lo gordo de hoy

### Hallazgos verificados (06/06/2026, probados por API)
- ❌ `gemini-2.0-flash` **apagado el 1 jun 2026** → era la causa de los fallos de Gemini.
- ❌ `gemini-3.5-flash` **NO existe** (lo inventó una búsqueda web).
- ✅ **`gemini-flash-latest`** (alias que nunca muere), `gemini-2.5-flash`, `gemini-3-flash-preview` → funcionan.
- ✅ Key Gemini válida = `AIzaSy...`. Las `AQ.Ab...` NO son keys de Gemini (basura).
- ✅ Groq: `openai/gpt-oss-120b`, `gpt-oss-20b`, `llama-3.3-70b-versatile` funcionan.
- ❌ `llama-4-scout` escupía tokens raw `<function=...` → fuera del menú.
- ✅ OpenRouter free: `google/gemma-4-31b-it:free`, `openai/gpt-oss-120b:free` válidos.
- ❌ OpenRouter `nvidia/nemotron-3-super-120b:free` y `qwen/qwen3-coder-480b:free` **NO existen** (inventados por búsqueda web).

### Cambios en el proxy (`PROVIDERS` + `/v1/models`)
- `gemini` default: `gemini-2.0-flash` → **`gemini-flash-latest`**.
- `groq` default: `llama-4-scout` → **`openai/gpt-oss-120b`**.
- `/v1/models`: **NO anuncia los locales** (ollama/llamacpp) — siguen en `PROVIDERS` y funcionan si se escriben, pero no aparecen en el menú. Quitados los IDs inválidos. Dedup. 28 modelos limpios.

### Mini-wiki de modelos (para dev, NO usuarios)
`OPOS_PROJECT/01-Wiki/Backend/Modelos_y_Endpoints_2026.md` — tabla gratis/baratos/potentes/locales,
**nombre EXACTO de cada key en .env**, endpoints, y gotchas. Corregida con lo verificado hoy.

---

## 4. Keys (.env) — arreglos

| Vault | Qué se arregló |
|-------|----------------|
| **Nina** | Faltaban `GROQ_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `LLM_PROVIDER`. Y tenía `OPEN_ROUTER_API_KEY` (mal) → corregido a `OPENROUTER_API_KEY`. |
| **Los 3** | Key Gemini válida `AIzaSy...` puesta. |
| **Los 3** | **Mistral key nueva** `uE8SK9Hy1qh1I7wWKOvRd77gnxdPFGsE` (probada ✅). Anterior: `FpxxgzuLHRIWlPL6PMUOkzdPblGNBuHF` (por si hay que revertir). |

⚠️ El `.env` se lee **solo al arrancar** el .exe → tras cambiar keys, reiniciar el `.bat`.

---

## 5. Perfiles BMO

- **Miguel** (`Miguel_Angel_Editor.md`): `model:` estaba en `yayo` (raro) → **`mistral:mistral-large-latest`**. +tool `ocr_carpeta` documentado. +carpeta `01_CRUDO/apuntes_mano/`.
- **Nina** (`Nina_Editor.md`): `model: agente-escritor` → **`mistral:mistral-large-latest`** (explícito, bueno para búlgaro). +`ocr_carpeta` (búlgaro). 19 tools.
- **Yayo** (`Yayo_Tutor.md`): ya en `mistral:mistral-large-latest`. +`ocr_carpeta`.

---

## 6. Menú de modelos (desplegable BMO) — cómo funciona

- El menú se llena desde el **`/v1/models` del proxy**, pero BMO lo **cachea** en `data.json`.
- Solo se **refresca** cuando cambias la URL del REST API en ajustes BMO (o desde la UI manualmente).
- Recargar Obsidian NO lo refresca. **Spas lo actualiza manualmente desde la UI de BMO.**

---

## 7. Build/Deploy
- 5 rebuilds Docker PyInstaller del proxy (~23.46 MB) → desplegado a los 3 vaults (último incluye `max_tokens` + `/v1/models` limpio + gemini-flash-latest + groq gpt-oss-120b).
- 1 build del plugin BMO (`npm run build`) con el fix del textarea → `main.js` a los 3 vaults.
- Backup del exe previo: `build_agente/AgenteEscritor_BACKUP_pre05jun.exe`.

---

## 8. Plan estratégico
`docs_planes/PLAN_CEREBRITO_DURGA_05_06_26.md` — arquitectura Durga (orquestador + nanos),
Kuzu (fase 2), grafo de entidades para Miguel, decisiones (Obsidian-grafo primero, embeddings mistral-embed).

---

## 9. PENDIENTE
- [ ] **Spas:** en cada vault, arrancar el `.bat` nuevo + refrescar el menú por la UI de BMO.
- [x] **OpenRouter en Miguel "no va"** — DIAGNOSTICADO: 402 sin créditos. Arreglado parcialmente con reenvío de `max_tokens`; para uso real necesita los $10 de OpenRouter. Mejor usar Gemini/Groq.
- [ ] OpenAI key del .env de Miguel está sin cuota (429) — quitarla o dejar billing.
- [~] Bug textarea BMO — **INTENTADO** (ver sección 11). Desplegado, pendiente que Spas confirme si va.
- [ ] Carpetas/templates expandidos de Miguel (mapas, bibliografía, citas).
- [ ] Workflow "OCR → fichas wiki → grafo de entidades".
- [ ] Kuzu (fase 2), `vault_map()` + watcher auto-índice.

---

## 10. Comandos útiles
```bash
# Rebuild + deploy proxy
docker run --rm -v /home/spas/build_agente:/src batonogov/pyinstaller-windows:latest \
  "rm -rf build dist && pyinstaller AgenteEscritor.spec --clean --noconfirm"
cmd.exe /c "taskkill /F /IM AgenteEscritor.exe"
cp /home/spas/build_agente/dist/AgenteEscritor.exe /mnt/d/<VAULT>/

# Verificar modelos reales de una key Gemini
curl "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSy..."

# Build + deploy plugin BMO
cd /home/spas/obsidian-bmo-chatbot-plus && npm run build
cp main.js /mnt/d/<VAULT>/.obsidian/plugins/bmo-chatbot/main.js
```

---

## 11. Cambios finales (06-07/06) — añadidos

### 11a. Fix del bug del textarea de BMO (INTENTADO, desplegado)
- **Causa real:** Obsidian/Electron no enruta el teclado al textarea de la barra lateral hasta
  un `resize` (por eso minimizar/maximizar lo arreglaba). Los 6 intentos previos solo hacían
  `focus()` (no re-enrutaba).
- **Fix:** en `src/view.ts` `onOpen()`, tras el foco se **dispara `window.dispatchEvent(new Event('resize'))`**
  + reflow, dentro de `workspace.onLayoutReady` + `requestAnimationFrame`, con un `ResizeObserver`
  de respaldo que se desconecta tras la 1ª vez (sin bucles).
- **Build + deploy:** `npm run build` → `main.js` a los 3 vaults.
- **Backups para revertir:** `src/view.ts.BAK_pre_textareafix_06jun` (código original) y
  `main.js.BAK_deployed_OLD_pre_textareafix` (binario viejo). Memoria: `project_bmo_textarea_fix.md`.
- **Estado:** desplegado, **pendiente que Spas confirme** si ya no hace falta minimizar.

### 11b. Archivos de instrucciones para Miguel (raíz del vault)
`LEEME_Miguel_Instrucciones` en **.txt, .docx y .pdf** (mismo contenido, para no-técnico):
instalar Obsidian, arrancar el `.bat`, truco minimizar si no escribe, refrescar modelos en BMO,
**sacarse sus propias API keys** (tabla con enlaces y gratis/de-pago: Mistral/Gemini/Groq/Tavily
gratis; DeepSeek/OpenAI/Claude de pago), y cómo transcribir apuntes a mano con `ocr_carpeta`.

### 11c. Estado final de los perfiles
- El `model:` de los perfiles acabó como **`agente-escritor`** (BMO/linter lo reescribe), que en
  el runtime de cada vault **enruta a `mistral` + `mistral-large-latest`** (porque su `.env` tiene
  `MISTRAL_AGENT_MODEL=mistral-large-latest`). Verificado: funciona = mistral-large.
- El **menú** de modelos lo refresca Spas a mano desde la UI de BMO (no se toca a mano el `data.json`,
  porque BMO lo sobreescribe en caliente).

### 11d. Aviso de entrega
- El `.env` entregado a Miguel lleva **las API keys personales de Spas** (consumo de su cuenta).
  Pendiente: que Miguel saque las suyas con la guía LEEME (Mistral/Gemini/Groq gratis).
