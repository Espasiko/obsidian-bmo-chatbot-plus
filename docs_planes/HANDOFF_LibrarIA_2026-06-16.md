---
title: HANDOFF LibrarIA — estado del trabajo
fecha: 2026-06-16
autor: Cascade (traspaso para continuar en otro chat/IA)
estado: Fase A COMPLETA · Fase d (autocompletado @/) CÓDIGO HECHO + BUILD OK, FALTA DEPLOY
---

# HANDOFF — LibrarIA (vault de escritura con 12 agentes)

> **Para quien continúe:** lee primero el "Resumen ejecutivo" y "Próximo paso inmediato".
> El trabajo se quedó **justo después de compilar la feature de autocompletado** (`npm run build` → exit 0).
> Lo único que falta para cerrar esa feature es **desplegar y probar en Obsidian**.

---

## 1. Resumen ejecutivo (dónde estamos)

- **LibrarIA** = un vault de Obsidian para escribir una novela, con **12 agentes** (perfiles de BMO) que se reparten el trabajo (orquestador, mundo, personajes, trama, prosa, continuidad, etc.).
- Se apoya en infraestructura YA existente del usuario: el **proxy `AgenteEscritor.exe`** (FastAPI compilado, puerto **9000**) y el **plugin BMO "Chandra Edition"** (fork en este repo).
- **Fase A (montar el vault): COMPLETA.** El usuario ya lo probó: MaestrIA y Mistral funcionan.
- **Fase d (autocompletado `@agentes` y `/comandos`): código escrito y compila.** FALTA: desplegar `main.js`+`styles.css` a los vaults, recargar el plugin en Obsidian y probar.
- **Pendientes mayores:** (1) bug de "borrar conversación" que deja restos en el lateral, (2) Gemini daba 503 temporal, (3) **Fase B** = grafo de conocimiento (LadybugDB) en el backend del proxy.

---

## 2. Contexto y rutas clave

| Qué | Ruta |
|---|---|
| **Vault LibrarIA** (lo construido) | `/mnt/d/LibrarIA/` (Windows: `D:\LibrarIA`) |
| **Repo del plugin BMO** (donde se programa) | `/home/spas/obsidian-bmo-chatbot-plus/` |
| **Vault de Miguel** (plantilla que clonamos) | `/mnt/d/AgenteEscritor_Miguel_Angel/` |
| **Backend del proxy** (Fase B, compila a .exe) | repo FastAPI "AgenteEscritor/OpositAIA" — ver skill `rebuild-exe` |
| Este handoff | `/home/spas/obsidian-bmo-chatbot-plus/docs_planes/HANDOFF_LibrarIA_2026-06-16.md` |

**Datos de cableado importantes:**
- El proxy escucha en `http://localhost:9000/v1`. El `.env` **NO** tiene `VAULT_PATH`: el `.exe` usa **su propia carpeta** como vault (por eso el `.exe` vive en la raíz de `D:\LibrarIA`).
- `OBSIDIAN_REST_API_KEY` (en `.env`) debe coincidir con la del plugin Local REST API: `d4bae2eda0b859372b99dcebbafb0c728fd647bbea13839609746c5fe472676e`.
- Keys gratis disponibles en `.env`: **Mistral, Groq, Gemini** (+ DeepSeek/OpenRouter/OpenAI presentes). Anthropic/Moonshot vacías.

---

## 3. FASE A — COMPLETA (vault montado)

### 3.1. Estructura creada en `/mnt/d/LibrarIA/`
```
00_Biblia/        → premisa.md, reglas_del_mundo.md, glosario.md, estilo_y_voz.md
01_Personajes/    (+ _plantilla.md)
02_Mundo/  03_Trama/  04_Linea_Tiempo/  05_Mapas/  06_Escenas/
07_Wiki/  08_Continuidad/  09_Marketing/  10_Export/  11_Investigacion_externa/
_Agentes/  _Descartes/
BMO/  → Profiles/ (12 agentes), Prompts/, History/, Chats/
LÉEME_PRIMERO.md, proyecto_resumen.md
+ andamiaje: .obsidian/ (9 plugins), AgenteEscritor.exe, 1_arrancar.bat, 2_parar.bat,
  3_verificar.bat, mingit/, logs/, .env, .gitignore
```

- **`00_Biblia/estilo_y_voz.md`** (estado `canon`) se sembró con la MUESTRA REAL del usuario (CF místico-filosófica: ELLO/Tao/Shiva, "¿Y si?", agua EZ/cuarta fase, frecuencia de Planck, 64/13 tetraedros, ruinas CDMX 2078; personajes Amaia Zero y Kael el Tejedor). **ProsaIA/EstilIA la leen para imitar la voz.**

### 3.2. Los 12 agentes (`BMO/Profiles/*.md`)
`MaestrIA` (orquestador, activo por defecto), `MundalIA` (mundo), `PersonalIA` (personajes), `TramIA` (trama), `CronistIA` (timeline/causalidad), `CartografIA` (mapas), `ProsaIA` (escribe escenas), `ContinuIA` (auditor de coherencia), `MusaIA` (lluvia de ideas), `BibliotecarIA` (consultas al vault), `EstilIA` (pulido de estilo), `GardIA` (guardián de canon).

- Cada perfil tiene frontmatter BMO (model, temperature, max_tokens, system_role…) + cuerpo con rúbrica de 9 bloques y **guardrails HITL** (proponen, no deciden).
- **Tools REALES del proxy** usadas en los prompts: `find_similar_notes`, `read_obsidian_note`, `create_obsidian_note`, `update_obsidian_note`/`overwrite_obsidian_note`, `search_internet`, `fetch_url`, `git_save`.
- ⚠️ Las tools del plan original (`graph.cypher`, `rag.query`, `mindmap.render`, `git.diff`, `export.epub`) **NO existen**. Los agentes de coherencia (GardIA/CronistIA/ContinuIA/BibliotecarIA) **aproximan** con `find_similar_notes` + `[[enlaces]]` + frontmatter `deriva_de` hasta que llegue la Fase B. Mapas mentales = bloques **mermaid**.

### 3.3. Modelos por defecto (GRATIS, para pruebas)
| Modelo | Agentes |
|---|---|
| `gemini:gemini-flash-latest` | MaestrIA, TramIA, CronistIA, MusaIA, BibliotecarIA, ContinuIA, GardIA |
| `gemini:gemini-3-flash-preview` | MundalIA |
| `mistral:mistral-large-latest` | PersonalIA, ProsaIA, EstilIA |
| `mistral:mistral-small-latest` | CartografIA |

> ContinuIA usa familia DISTINTA a ProsaIA (gemini vs mistral) a propósito, para que el auditor no se "auto-apruebe". La columna premium ("objetivo": Claude Opus, DeepSeek V4…) se enchufa al final para medir coste/calidad de un libro entero.

### 3.4. Cableado (`.obsidian` + `data.json`)
- Se **clonó** el `.obsidian/` del vault de Miguel (9 plugins: bmo-chatbot, smart-connections, obsidian-git, templater, mermaid-tools, obsidian-local-rest-api, dataview, smart-lookup, mcp-tools) y el bundle del proxy. Se **limpiaron** los datos privados de Miguel (su `data.json`, `workspace.json`, historiales de chat).
- **`/mnt/d/LibrarIA/.obsidian/plugins/bmo-chatbot/data.json`** (JSON válido) reescrito para LibrarIA:
  - `profiles.profile = "MaestrIA.md"`, `profileFolderPath = "BMO/Profiles"`
  - `RESTAPIURLConnection.RESTAPIURL = "http://localhost:9000/v1"`, `APIKey` = la REST key de arriba
  - lista de modelos **gratis-primero**, carpetas `BMO/Prompts|History|Chats`
  - `appearance`: userName `Spas`, chatbotName `MaestrIA`
  - `general.system_role` = versión CORTA de MaestrIA (el prompt completo se carga al hacer `/profile MaestrIA` o elegirlo en el desplegable).
- **`.gitignore`** protege: `.env`, `AgenteEscritor.exe`, `*.bat`, `mingit/`, `logs/`, `.smart-env/`, `workspace.json`, `data/`.

### 3.5. Prueba de humo (A5) — lo que reportó el usuario
- ✅ MaestrIA funciona. ✅ Mistral funciona. ✅ Cambio de perfil a mano (config de BMO) funciona y adopta el rol. ✅ Le gusta la estructura.
- ❌ **Gemini → HTTP 503 "high demand"** = caída/throttling temporal de Google (no es bug nuestro). Si persiste, cambiar los defaults de los 7 agentes Gemini a Mistral.
- ❌ **`@` y `/` no tenían desplegable** → era la feature pendiente (Fase d), ya programada (ver abajo).
- ⚠️ **"Borrar conversación borra, pero en el lateral siguen las conversaciones"** → sospecha de dos mecanismos de historial conviviendo. PENDIENTE de investigar.

---

## 4. FASE d — Autocompletado `@agentes` / `/comandos` (CÓDIGO HECHO, BUILD OK, FALTA DEPLOY)

**Objetivo:** al teclear `@` en el chat sale un desplegable con los 12 agentes (al elegir uno **cambia de perfil**); al teclear `/` sale un desplegable de comandos (rellena el comando).

### 4.1. Archivos tocados (en `/home/spas/obsidian-bmo-chatbot-plus/`)
1. **NUEVO** `src/components/chat/Autocomplete.ts` — clase `ChatAutocomplete`:
   - `onInput()` detecta el token bajo el cursor: `/...` al **inicio** → modo comando; `@...` al inicio o tras espacio → modo agente.
   - Lista de agentes = ficheros `.md` de `settings.profiles.profileFolderPath` (excluye los que empiezan por `_`).
   - Lista de comandos = constante `COMMANDS` (con descripciones en español).
   - Navegación: `ArrowUp/Down` mueve, `Enter`/`Tab` selecciona, `Escape` cierra. Click vía `mousedown` (no `click`) para no perder el foco.
   - Al seleccionar: **comando** → rellena el texto del comando (no ejecuta, deja añadir args + Enter). **agente** → `executeCommand('/profile <Nombre>', plugin.settings, plugin)` (reusa la lógica nativa de cambio de perfil).
2. **`src/view.ts`** — 7 ediciones quirúrgicas:
   - import de `ChatAutocomplete`; miembro `private autocomplete`.
   - instancia tras `this.addEventListeners();` (anclada al `chatbox`).
   - `handleKeydown`: si `autocomplete.onKeyDown(event)` consume la tecla → `return`.
   - `handleKeyup`: al principio, si `autocomplete.handleKeyupGuard(event)` → `preventDefault` + `return` (clave: el **envío ocurre en keyup Enter**, hay que tragárselo tras seleccionar).
   - `handleInput`: llama a `autocomplete.onInput()`.
   - `onClose`: `autocomplete.destroy()`.
3. **`styles.css`** — bloque `.bmo-autocomplete` + `.bmo-ac-item`/`is-active`/etc., y `.chatbox { position: relative; }` (para anclar el popup encima del textarea).

### 4.2. Estado del build
- `npm run build` (= `tsc -noEmit -skipLibCheck && esbuild production`) → **exit code 0**. Compila sin errores de tipos.

### 4.3. Riesgos/notas para verificar al probar
- Al elegir un `@agente`, `executeCommand('/profile …')` llama a `plugin.activateView()` que **re-renderiza la vista** (el textarea se reinicia). Es el mismo comportamiento que `/profile` a mano; aceptable, pero confirmar que no molesta.
- Confirmar que el popup aparece ENCIMA del textarea y por encima de los mensajes (z-index 1000).
- Confirmar que con el popup CERRADO el chat funciona igual (Enter envía, Shift+Enter salto de línea).

---

## 5. PRÓXIMO PASO INMEDIATO (lo primero que debe hacer quien siga)

> El código está compilado pero **NO desplegado**. Hay que copiar `main.js` y `styles.css` a los vaults y recargar.

**Opción A — usar la automatización del usuario (preferida):**
- Workflow `/deploy-bmo-plugin` o skill **`deploy-bmo`** ("Build y deploy del plugin BMO a todos los vaults"). Hace build + copia + backup. **Verificar que incluye el vault nuevo `D:\LibrarIA`**; si no, añadirlo.

**Opción B — manual:**
```bash
# (ya está compilado; si no:  cd /home/spas/obsidian-bmo-chatbot-plus && npm run build)
cp /home/spas/obsidian-bmo-chatbot-plus/main.js \
   /home/spas/obsidian-bmo-chatbot-plus/styles.css \
   /mnt/d/LibrarIA/.obsidian/plugins/bmo-chatbot/
# repetir para los otros vaults (Miguel, Nina, Yayo) si se quiere la feature allí
```

**Luego, en Obsidian (Windows):**
1. Arrancar el proxy: doble clic en `D:\LibrarIA\1_arrancar.bat` (esperar `Application startup complete`).
2. Abrir `D:\LibrarIA` como vault.
3. **Settings → Community plugins → desactivar y reactivar "BMO"** (para que cargue el nuevo `main.js`).
4. Probar en el chat: teclear `@` (debe salir lista de agentes; elegir uno cambia de perfil) y `/` (lista de comandos).

---

## 6. PENDIENTES (después del deploy de Fase d)

1. **Bug "borrar conversación" deja restos en el lateral.** Investigar la convivencia de:
   - `chatHistory` / `messageHistory` (`/clear` = `removeMessageThread`, ficheros `data/messageHistory_*.json`), y
   - el nuevo sistema `conversations` (barra lateral, `src/components/chat/Sidebar.ts`, `Conversations.ts`, `ConversationHeader.ts`).
   Probable causa: `/clear` limpia el hilo pero no borra la conversación del lateral, o se guardan en dos sitios. Revisar `Sidebar.ts` (`refreshSidebar`, `deleteConversation`) y `Commands.ts` (`/clear`, `/save`, `/load`).
2. **Gemini 503.** Si sigue cayéndose, cambiar `model:` en los 7 perfiles Gemini de `BMO/Profiles/*.md` a `mistral:mistral-large-latest` (y ajustar `data.json` si MaestrIA sigue activo). Reversible cuando Google se estabilice.
3. **FASE B — Grafo de conocimiento (en el BACKEND del proxy, NO en este repo del plugin):**
   - `graph_store.py` + tool `graph_cypher` (consultas al grafo).
   - Indexador vault → grafo (personajes, lugares, eventos, relaciones, `deriva_de`).
   - **Usar LadybugDB** (sucesor mantenido de Kuzu; Kuzu quedó legacy en jun-2026). Actualizar `pyproject` (`kuzu>=0.4` → `ladybug`).
   - **Recompilar el `.exe`** con la skill **`rebuild-exe`** (Docker cross-compilation) y redistribuir a los vaults.
   - Con el grafo, reactivar en los prompts de GardIA/CronistIA/ContinuIA/BibliotecarIA las consultas exactas (sustituyendo la aproximación con `find_similar_notes`).

---

## 7. Comandos y skills útiles
- Compilar plugin: `npm run build` en `/home/spas/obsidian-bmo-chatbot-plus/`.
- Desplegar plugin: workflow `/deploy-bmo-plugin` o skill `deploy-bmo`.
- Recompilar proxy `.exe`: skill `rebuild-exe`.
- Arrancar backend: skills `arrancar-backend` / `arrancar-chandra`.
- Memoria del proyecto: skill `bmad-staff` (guardián del estado de OpositAIA).

---

## 8. Decisiones ya tomadas (NO re-litigar)
- 12 agentes en el MVP. **Diferidos** (fuera de alcance ahora): MaquetIA, MercadIA, BloguerIA, Autopiloto.
- Enfoque **prompt-first**: la Fase A NO tocó código del proxy ni del plugin; los agentes son solo perfiles `.md`.
- Defaults gratis (Gemini/Mistral) para pruebas; premium al final.
- Se clonó el andamiaje del vault de Miguel en lugar de configurar desde cero (más rápido y coherente con la REST key del `.env`).
- HITL estricto: los agentes proponen (estado `propuesta`/`canon`), el autor decide.

---

*Fin del handoff. Si continúas: despliega Fase d (sección 5), luego ataca los pendientes (sección 6) en ese orden.*
