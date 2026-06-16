---
tipo: memoria-sesion
fecha: 2026-06-15
periodo: 2026-06-11 → 2026-06-16
estado: completada
---

# Memoria 15/06/2026 — Cambios de los últimos 4-5 días + estado de Git

> Resumen de todo lo hecho del 11 al 16 de junio + verificación de qué está subido a GitHub y qué no.

---

## 1. Lista de cambios (últimos 4-5 días)

### Proxy AgenteEscritor (`build_agente/proxy_agente_escritor.py` → backup en `OPOS_GEMINI_1/backend/`)
- **`buscar_papers(query)`** → OpenAlex (gratis, sin key): bibliografía real con DOI. Anti-cita-inventada.
- **`buscar_datasets(query)`** → Zenodo (sin key, `sort=bestmatch`): datasets/3D/preprints OA.
- **`ocr_carpeta(folder)`** → OCR por lotes (Mistral) con reanudar, pausas y aviso si satura.
- **Auto-recarga del `.env`**: si falta una key, recarga en caliente y reintenta (arregla "Falta DEEPSEEK_API_KEY" sin reiniciar).
- **Reintento ante HTTP 429** (rate-limit) con backoff 3s/6s.
- **Guard inteligente** en `proxy_chat`: distingue rate-limit de Groq (8K TPM) de contexto largo real.
- **Reenvío de `max_tokens`** (evita 402 de OpenRouter por reserva máxima).
- **Reglas de uso de tools** en `build_critical_context` (no inventar errores 401, llamar a la tool, args obligatorios).
- **Defaults actualizados**: `gemini-flash-latest` (el 2.0/3.5 estaban muertos/inexistentes), `groq:openai/gpt-oss-120b` (el llama-4-scout escupía tokens raw).
- **Total: 26 tools** registradas.

### BMO plugin (`obsidian-bmo-chatbot-plus`)
- Intento de fix del textarea (resize dispatch) → **revertido**; se usa el fix de teclado committeado del 7/06.
- `main.js` reconstruido del fuente bueno (es build artifact, gitignored).
- Docs de sesión (06/06, 13/06, este).

### Vaults clientes (despliegue, no git)
- **.exe nuevo** desplegado a los 3 (Miguel, Nina, Yayo) con todos los arreglos.
- **Perfil `Investigador.md`** creado en Miguel (Dra. al-Rashid + tools + guardrails anti-alucinación).
- **Lista de modelos de Miguel** restaurada (estaba vacía) — curada, **sin `yayo`** (yayo solo Ainoa).
- Keys: **Mistral nueva** + **Gemini `AIzaSy`** válida en los 3 `.env`.
- `ocr_carpeta` **probado** con las 6 fotos reales de Miguel.

### Diagnósticos cerrados
- **Bug 401 REST API**: NO era la REST API → era **alucinación del modelo** (logs: 0 errores 401 desde el 02/06; 6 notas creadas OK).
- **Desplegable de modelos de Miguel vacío**: `RESTAPIURLModels` quedó `[]` al refrescar con el proxy caído → restaurado.

### Wiki OPOS_PROJECT
- `Modelos_y_Endpoints_2026.md` (mini-wiki de modelos/keys, verificada).
- `Sesion_13_06_2026_Investigador_Tools.md` (sesión).
- `AgenteEscritor_Proxy.md` actualizado a 26 tools.
- `LibrarIA_Adaptado_Stack_Real.md` (adaptación del plan de Claude/Cascade) **+ correcciones** (Kuzu ya elegido ≠ Neo4j; modelos del plan son reales, faltan keys).

### Grafo MCP (`/home/spas/memory.jsonl`)
- **Arreglada corrupción** en la línea 735 (dos JSON pegados) que bloqueaba todo el servidor.
- Entidades nuevas: "Plan Herramientas Investigador 13-06-2026", "Mercado IA investigacion academica jun2026".

### Graphify
- Regenerados los 3 repos + merge: **93.098 nodos / 163.503 aristas**. `buscar_papers`/`buscar_datasets` indexados.

### Investigación / planes
- Plan `13_06_..._mas_herramientas+investigacion.md` (OpenAlex/Zenodo/Pleiades/Semantic Scholar + Tavily + mercado).
- Revisión del plan LibrarIA del Cascade.

---

## 2. Verificación de Git — ¿está todo subido?

### ✅ obsidian-bmo-chatbot-plus (rama `feature/multi-chat`, remoto en GitHub)
- **Pusheado:** `6e97361` (tools investigador + Tavily), `c9f4ac0` (sesión 13/06). En sync con el remoto.
- **Pendiente:** `Plan_LibrarIA_v2 (1).md` (untracked) + esta memoria → se commitean y pushean en esta sesión.
- `main.js` es **gitignored** (build artifact, se regenera con `npm run build`). Correcto.

### ✅ OPOS_GEMINI_1 (rama `main`, remoto en GitHub)
- **Pusheado:** `9f1d61e` (proxy con todos los tools/arreglos). En sync con el remoto. **El trabajo de esta sesión está a salvo.**
- ⚠️ **Pendiente PRE-EXISTENTE (no de esta sesión):** reorganización BMAD sin commitear —
  **177 borrados** (skills `bmad-*`), + untracked `.claude/skills-backup-bmad-wds/`, `.claude/rules/`,
  `.claude/settings.json`, skills custom, y **artefactos de graphify** (`graphify-out/`, `.graphify_ast_*`).
  - **Decisión:** NO se commitea aquí — es un cleanup grande ajeno a esta sesión + incluye build artifacts
    que probablemente deberían ir a `.gitignore`. **Spas debe decidir** si commitear el cleanup BMAD y si
    `graphify-out/` debe gitignorarse.

### ⚠️ OPOS_PROJECT (repo git local, **SIN remoto**)
- Es la bóveda Obsidian; **no se puede pushear a GitHub** (no hay remoto configurado).
- Cambios sin commitear: `LibrarIA_Adaptado_Stack_Real.md`, `Sesion_13_06_..._Investigador_Tools.md`,
  `AgenteEscritor_Proxy.md` (M), `00-Meta/WIKI_INDEX.md` (M) → se commitean **localmente** en esta sesión.
- Para tener la wiki en GitHub habría que añadir un remoto (decisión de Spas).

### ⚠️ build_agente — **NO es repo git**
- El proxy fuente vive aquí pero no está versionado directamente. **Está respaldado y commiteado** en
  `OPOS_GEMINI_1/backend/proxy_agente_escritor.py` (commit `9f1d61e`). El código está a salvo.

---

## 3. Conclusión
- **Todo el trabajo de código de esta sesión está en GitHub** (proxy en OPOS `9f1d61e`, docs/tools en BMO `6e97361`).
- Quedan por subir solo: `Plan_LibrarIA_v2` + esta memoria (BMO) → se hace ahora.
- **Pendiente de decisión de Spas:** (a) commitear el cleanup BMAD de OPOS, (b) gitignorar `graphify-out/`,
  (c) añadir remoto a OPOS_PROJECT si se quiere la wiki en GitHub.
