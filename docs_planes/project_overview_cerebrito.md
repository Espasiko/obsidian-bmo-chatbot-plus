# Project Overview — Cerebrito (BMO Chatbot Plus)

**Generado:** 25/05/2026
**Actualizado:** 26/05/2026 a v1.1
**Workflow:** BMAD document-project v1.2.0
**Estado:** Brownfield — fork de obsidian-bmo-chatbot v2.3.3 + backend proxy existente
**Estado decisiones:** FIRMES tras iteracion 26/05/2026

---

## 1. Estado actual del proyecto

### 1.1 Que existe y funciona HOY

| Componente | Estado | Ubicacion |
|---|---|---|
| **BMO Chatbot Plus** (plugin Obsidian) | Fork funcional con multi-chat, sidebar, header editable | `/home/spas/obsidian-bmo-chatbot-plus/` |
| **Backend Chandra** (agente oposiciones) | 7 tools, Mistral medium, Neo4j 108 leyes, Tier 1-3 verification | `/home/spas/OPOS_GEMINI_1/backend/routers/opos_chat.py` |
| **Backend Escritor** (agente literario) | 4 tools, Mistral medium, compilable a exe | `/home/spas/OPOS_GEMINI_1/backend/proxy_agente_escritor.py` |
| **AgenteEscritor.exe** | Exe Windows compilado con PyInstaller (18MB) | `/home/spas/build_agente/PAQUETE_FINAL/` |
| **Vault Nina** (escritora, bulgaro) | Vault preconfigurado con perfiles y prompts | `D:\AgenteEscritor_Para_Nina\` |
| **BOVEDA_OPOS** (oposiciones SS) | Vault de estudio con Chandra conectado, 32 plugins conviven OK | `D:\BOVEDA_OPOS\BOVEDA_OPOS\` |
| **OPOS_PROJECT** (wiki) | 25 paginas wiki + Graphify (164 comunidades, 2010 nodos, 2938 edges) | `D:\OPOS_PROJECT\` |
| **Neo4j** | 108 leyes, 6683 preceptos, 379 EXCEPCION_A, 517 comunidades Louvain, hybrid HNSW + RRF | Docker `opositaia-neo4j` puerto 7687 |
| **Mistral OCR** | Script productivo + 3 API keys, validado en 2025 con academias | `/home/spas/OPOS_GEMINI_1/academias/extract_pdfs_ocr_mistral.py` |
| **EasyOCR modelos** | Pre-descargados (craft_mlt_25k.pth + latin_g2.pth), modulo Python NO instalado en venv | `~/.EasyOCR/model/` |
| **confidence_scorer / reasoning_tracer** | Existen, ESPECIFICOS de SS (citan LGSS, opciones A/B/C/D) — NO universales | `/home/spas/OPOS_GEMINI_1/backend/agents/` |
| **Token GitHub revocado** | ✅ Verificado 26/05: 0 tokens `ghp_*` en repos Espasiko | OK |

### 1.2 Que falta (gap analysis actualizado 26/05/2026)

| Feature | Estado actual | Estado deseado | Fase |
|---|---|---|:--:|
| Repo cerebrito-backend | No existe | Repo nuevo separado de OPOS_GEMINI_1 | Fase 0 |
| Repo shared-tools (submodulo) | No existe | Submodulo git con tools comunes | Fase 0 |
| Tag git v1.0-pre-cerebrito | No existe | Snapshot OPOS pre-refactor | Fase 0 |
| Tools universales (PDF, DOCX, delete, move, list) | Solo en Chandra parcialmente | shared-tools/tools/ comun | Fase 1 |
| Cascada extract_pdf | Solo pypdf | pypdf → Mistral OCR cloud → EasyOCR local | Fase 1 |
| Cambio modelo LLM | Hardcodeado por agente | Capability framework + adapters por LLM | Fase 2 |
| Kuzu grafo embebido | No existe | Aprendizaje continuo, entidades conversaciones | Fase 4 |
| UI: sidebar CSS | Roto en ventanas estrechas | Overlay correcto, responsive | Fase 0 |
| UI: selector modelos | Mezclados | Filtrado por proveedor activo | Fase 3 |
| UI: indicador conexion | No existe | Punto verde/rojo en header | Fase 3 |
| UI: prefijos @ / # * | No existe | Autocompletado en input | Fase 3 |
| UI: feedback tools | No existe | Linea con iconos tools usadas | Fase 3 |
| Anti-alucinacion universal | Solo Chandra (specific SS) | Flag verification_level por vertiente | Fase 1 |
| Telemetria local Niveles 1+2 | No existe | ~/.cerebrito/telemetry.jsonl + comando /telemetria | Fase 1 |
| Vault plantilla generica | Solo Nina | Cerebrito_Vault universal + Vault Miguel Angel | Fase 4.1 |
| Empaquetado 4 SKUs | Solo AgenteEscritor.exe | Core Lite, Core Privacy, OPOS Pack, OPOS Server | Fase 7 |
| Privacidad y avisos | No existe | Aviso LLM externo + modo Privacy con EasyOCR | Fase 1 |
| Smart Connections como tool | No integrado | Reusar via mcp-tools (NO reimplementar) | Fase 1 |

---

## 2. Arquitectura tecnica

### 2.1 Stack

| Capa | Tecnologia | Version |
|---|---|---|
| **Plugin Obsidian** | TypeScript, esbuild | BMO 2.3.3 fork |
| **Backend** | Python 3.12, FastAPI, uvicorn | En `.venv` |
| **LLM** | Mistral SDK, litellm (futuro) | mistralai 1.10.0 |
| **Grafo embebido** | Kuzu (futuro) | ~0.4.x |
| **Grafo servidor** | Neo4j 5 Community | Docker |
| **PDF** | pypdf (futuro) | >= 4.0 |
| **DOCX** | python-docx (futuro) | >= 1.0 |
| **Busqueda web** | Tavily API + DuckDuckGo scrape | Tavily gratis tier |
| **Empaquetado** | PyInstaller (Windows exe) | 6.x |

### 2.2 Estructura del codigo fuente — Plugin BMO

```
obsidian-bmo-chatbot-plus/
├── src/
│   ├── main.ts                          ← Entry point, plugin lifecycle (1287 lineas)
│   ├── view.ts                          ← Vista principal, routing de modelos (734 lineas)
│   ├── settings.ts                      ← Definicion de settings (150 lineas)
│   ├── components/
│   │   ├── FetchModelResponse.ts        ← Llamadas a LLMs (2337 lineas) ← ARCHIVO CRITICO
│   │   ├── FetchModelList.ts            ← GET /models de cada proveedor (166 lineas)
│   │   ├── FetchModelEditor.ts          ← Editor inline
│   │   ├── chat/
│   │   │   ├── BotMessage.ts            ← Render mensaje bot
│   │   │   ├── UserMessage.ts           ← Render mensaje usuario
│   │   │   ├── Message.ts              ← Logica de mensajes
│   │   │   ├── Buttons.ts              ← Botones (copiar, editar, regenerar)
│   │   │   ├── Commands.ts             ← Comandos del chat (55K!) ← MUY GRANDE
│   │   │   ├── ConversationHeader.ts   ← Header editable (Chandra edition)
│   │   │   ├── Conversations.ts        ← Persistencia de conversaciones
│   │   │   ├── Sidebar.ts             ← Panel lateral de conversaciones
│   │   │   └── Prompt.ts             ← Gestion de prompts
│   │   ├── settings/
│   │   │   ├── GeneralSettings.ts      ← Config general (modelo, system role, temp)
│   │   │   ├── AppearanceSettings.ts   ← Colores, fuentes (26K)
│   │   │   ├── ProfileSettings.ts      ← Perfiles
│   │   │   ├── PromptSettings.ts       ← Prompts
│   │   │   ├── RESTAPIURLSettings.ts   ← Config REST API (URL, key, modelos)
│   │   │   ├── OllamaSettings.ts       ← Config Ollama (24K)
│   │   │   ├── ChatHistorySettings.ts  ← Config historial
│   │   │   ├── EditorSettings.ts       ← Config editor
│   │   │   ├── ConnectionSettings.ts   ← Config conexiones
│   │   │   └── APIConnections/         ← Settings por proveedor (Anthropic, Gemini, etc)
│   │   └── editor/
│   │       ├── BMOCodeBlockProcessor.ts ← Procesador bloques codigo
│   │       ├── EditorCommands.ts        ← Comandos del editor
│   │       ├── FetchRenameNoteTitle.ts  ← Renombrar notas auto
│   │       └── ReferenceCurrentNote.ts  ← Referencia nota actual
│   └── utils/                           ← Utilidades
├── styles.css                           ← Estilos (841 lineas, incluye sidebar Chandra)
├── main.js                              ← Build compilado (475KB)
├── manifest.json                        ← Metadata plugin
├── package.json                         ← Deps npm
├── esbuild.config.mjs                   ← Config build
├── docs_planes/                         ← PRD, brief, overview (NUEVO)
└── LICENSE                              ← MIT
```

### 2.3 Flujo de datos — como BMO enruta al backend

```typescript
// view.ts:527 — Routing por modelo seleccionado
if (RESTAPIURLModels.includes(model)) {
    // → fetchRESTAPIURLResponse() → POST URL/chat/completions
    // Esto es lo que conecta con Chandra (8080) o Escritor (8000)
}
else if (ANTHROPIC_MODELS.includes(model)) { ... }
else if (mistralModels.includes(model)) { ... }
else if (geminiModels.includes(model)) { ... }
// etc.
```

**Problema**: el modelo seleccionado determina el proveedor. Si eliges "agente-escritor" → va al REST API. Si eliges "mistral-large-latest" → va a la API de Mistral directamente. **NO hay forma de decir "usa REST API pero con Groq como LLM".**

**Solucion**: El backend parsea `@groq` del mensaje y cambia el LLM. BMO sigue enviando al REST API siempre.

### 2.4 Estructura del backend — proxy agente

```python
# proxy_agente_escritor.py — estructura actual
app = FastAPI()

# Tools definidas inline (funciones Python)
def read_obsidian_note(filename) → str
def create_obsidian_note(filename, content) → str
def update_obsidian_note(filename, content) → str
def search_internet(query) → str

# Schema OpenAI function calling
tools = [{ "type": "function", "function": { "name": "read_obsidian_note", ... } }, ...]

# Mapeo nombre → funcion
names_to_functions = { "read_obsidian_note": read_obsidian_note, ... }

# Endpoints OpenAI-compatible
GET  /v1/models          → lista de modelos
GET  /health             → estado del proxy
POST /v1/chat/completions → chat con tools (bucle max 6 iteraciones)
```

### 2.5 Arquitectura final — 4 repos + shared-tools submodulo (decision firme 26/05/2026)

**Decision confirmada con usuario**: 4 repos en GitHub Espasiko. Tools comunes en almacen central `shared-tools` compartido via submodulo git. SKUs via build flags (NO via branches separadas).

#### Estructura de cada repo

```
Repo 1: Espasiko/obsidian-bmo-chatbot-plus  (TIENDA BMO)
├── src/                                 ← TypeScript plugin
├── styles.css
├── manifest.json
└── branches:
    ├── main                             ← solo README hoy
    ├── feature/multi-chat               ← actual dev (multi-chat, sidebar)
    └── feature/cerebrito-v1.1           ← NUEVO: Capability framework + refactor
└── tag: v1.0-multi-chat                 ← snapshot estado actual

Repo 2: Espasiko/OPOS_GEMINI_1            (TIENDA OPOS)
├── backend/
│   ├── routers/opos_chat.py             ← FastAPI puerto 8080
│   ├── agents/chandra_tools.py          ← 7 tools especificas
│   ├── agents/confidence_scorer.py      ← Tier 1-3 verification (NO universal)
│   ├── agents/reasoning_tracer.py       ← Especifico SS
│   └── calculators/calculos_ss_extended.py  ← NO TOCAR (verificado BOE)
├── neo4j/                               ← Schema 108 leyes
├── shared-tools/  (submodule)           ← Almacen comun
└── branches:
    ├── main                             ← estable, NO TOCAR
    └── refactor/clean-codebase          ← NUEVO: limpieza no-destructiva
└── tag: v1.0-pre-cerebrito              ← snapshot

Repo 3: Espasiko/cerebrito-backend  (TIENDA CEREBRITO) — A CREAR
├── pyproject.toml                       ← Build flags para 4 SKUs
├── packaging/
│   ├── lite.spec                        ← PyInstaller SKU Lite
│   ├── privacy.spec                     ← PyInstaller SKU Privacy
│   ├── opos.spec                        ← PyInstaller SKU OPOS Pack
│   └── opos-server.spec                 ← PyInstaller SKU OPOS Server
├── cerebrito/
│   ├── main.py                          ← FastAPI puerto 27182
│   ├── llm_router.py                    ← parsea @prefijo
│   ├── llm_adapters/
│   │   ├── mistral_adapter.py
│   │   ├── claude_adapter.py
│   │   ├── ollama_adapter.py
│   │   ├── groq_adapter.py
│   │   └── bmad_adapter.py              ← Solo SKU Devs, oculto
│   ├── agents/
│   │   ├── escritor_agent.py
│   │   ├── estudiante_agent.py
│   │   ├── abogado_agent.py             ← verification_level=strict
│   │   └── cerebrito_agent.py
│   └── kuzu/                            ← Grafo embebido
├── shared-tools/  (submodule)           ← Almacen comun
├── tests/
└── branches:
    └── main                             ← unica branch
└── tags: v1.0-lite, v1.0-privacy, v1.0-opos, v1.0-opos-server  ← releases

Repo 4: Espasiko/shared-tools  (ALMACEN) — A CREAR
├── tools/
│   ├── __init__.py
│   ├── capability.py                    ← Clase abstracta universal
│   ├── vault_tools.py                   ← Obsidian REST API operations
│   ├── pdf_tools.py                     ← Cascada pypdf → Mistral OCR → EasyOCR
│   ├── search_tools.py                  ← Tavily + DDG fallback
│   ├── telemetry.py                     ← Niveles 1+2 local-first
│   └── verification.py                  ← Anti-alucinacion configurable
├── tests/
├── README.md
└── branches:
    └── main                             ← unica branch
```

#### SKUs via build flags (NO branches por SKU — confirmado 26/05/2026)

Una sola codebase en `cerebrito-backend/main`. Build flags via `pyproject.toml`:

```bash
pip install cerebrito              # Cerebrito Core Lite (~50 MB)
pip install cerebrito[privacy]     # Cerebrito Core Privacy (~180 MB, +EasyOCR)
pip install cerebrito[opos]        # Cerebrito OPOS Pack (~700 MB, +neo4j-driver)
pip install cerebrito[opos-server] # Cerebrito OPOS Server (~3 GB, +Docker)
```

PyInstaller con spec distinto por SKU. Tags git para releases (`v1.0-lite`, etc.).

#### Ventajas de esta arquitectura

- ✅ **OPOS sigue funcionando** — main intocable mientras Cerebrito se desarrolla
- ✅ **Cerebrito empieza limpio** — buenas practicas desde dia 1
- ✅ **0 duplicacion** — tools comunes en shared-tools, una sola fuente de verdad
- ✅ **1 codebase Cerebrito** — bug fix se aplica a 4 SKUs automaticamente
- ✅ **Empaquetable independiente** — vendes SKU Lite sin OPOS dentro
- ✅ **Si Cerebrito quiebra, OPOS sigue** — repos separados
- ✅ **Nina mantiene su .exe v1** hasta que decida migrar

#### Coste a aceptar (honestidad)

- Workflow con submodulos: cuando edites algo en `shared-tools`, debes hacer `git submodule update` y commit en cada repo padre que lo use. Es 1 comando extra, no es ciencia espacial pero hay que recordarlo.

---

## 3. Puertos y conexiones

### 3.1 Entorno desarrollo (Spas — WSL + Windows)

| Puerto | Servicio | Host | Para que |
|---|---|---|---|
| 8080 | Backend Chandra (opos) | WSL+Docker | Vault BOVEDA_OPOS, OPOS_PROJECT |
| **27182** | **Backend Cerebrito (nuevo)** | Windows nativo | Vaults Core: Miguel Angel, futuros |
| 8000 | Proxy escritor (DEPRECATED) | WSL/Windows | Vault Nina (mantener mientras no migre) |
| 27123 | Obsidian Local REST API | Windows | Tools de vault (leer/crear notas) |
| 7687 | Neo4j (bolt) | Docker en WSL | Grafo legal 108 leyes |
| 6333 | Qdrant | Docker en WSL | Embeddings legacy (DESCARTADO) |
| 5432 | PostgreSQL | Docker en WSL | Datos usuarios |
| 11434 | Ollama | WSL | Modelos locales |

**Por que NO puerto 9000:** Conflicto con PHP-FPM (XAMPP/WAMP/Laragon), Docker Registry, SonarQube. Demasiado popular en Windows dev. **27182** elegido por:
- Memorable (numero Euler e × 10000)
- IANA registered sin asignacion oficial
- 0 apps populares lo usan

### 3.2 Entorno usuario final

**Nina (escritora bulgara, Windows nativo, AgenteEscritor v1):**

| Puerto | Servicio | Host | Para que |
|---|---|---|---|
| 8000 | AgenteEscritor.exe v1 | Windows | Backend compilado actual |
| 27123 | Obsidian Local REST API | Windows | Tools de vault |

**Miguel Angel + futuros (Cerebrito Core):**

| Puerto | Servicio | Host | Para que |
|---|---|---|---|
| 27182 | Cerebrito Core .exe | Windows | Backend Cerebrito |
| 27123 | Obsidian Local REST API | Windows | Tools de vault |

**Regla**: el usuario final solo necesita 2 puertos. Todo lo demas es transparente.

---

## 4. Configuracion de vaults existentes

| Vault | Ruta | BMO URL | Modelo | Estado | Uso |
|---|---|---|---|---|---|
| AgenteEscritor_Para_Nina | D:\AgenteEscritor_Para_Nina | localhost:8000/v1 | agente-escritor | Operativo (Nina) | Escritora bulgara |
| BOOK_VAULT_TEST | D:\BOOK_VAULT_TEST | 127.0.0.1:8000/v1 | agente-escritor | Operativo | Pruebas escritor |
| BOVEDA_OPOS\BOVEDA_OPOS | D:\BOVEDA_OPOS\BOVEDA_OPOS | 127.0.0.1:8080/opos/v1 | chandra | Operativo | Estudio opos SS |
| OPOS_PROJECT | D:\OPOS_PROJECT | 127.0.0.1:8080/opos/v1 | chandra | Operativo | Wiki proyecto + Graphify |
| **Vault_MiguelAngel_Hititas** (NUEVO) | TBD | localhost:27182/v1 | cerebrito-core | A entregar Fase 4.1 | Escritor novela historica hitita |
| BOVEDA_OPOS raiz | D:\BOVEDA_OPOS | — | — | No usar (config erronea) | Solo subdir BOVEDA_OPOS\BOVEDA_OPOS |

### 4.0 Plugins instalados en BOVEDA_OPOS (32 plugins, validado 26/05/2026)

```
✅ bmo-chatbot                    Chat IA principal
✅ obsidian-local-rest-api        Tools de vault (puerto 27123)
✅ smart-connections              Busqueda semantica → reusar via mcp-tools
✅ mcp-tools                      Bridge MCP a plugins externos
✅ obsidian-git                   Backup automatico (CRITICO para escritores)
✅ templater-obsidian             Plantillas (flashcards pre-generadas)
✅ obsidian-spaced-repetition     Spaced Repetition (vertiente Estudiantes)
✅ obsidian-to-anki-plugin        Export Anki
✅ omnisearch                     Busqueda full-text
✅ dataview                       Queries sobre frontmatter
✅ obsidian-excalidraw-plugin     Mapas mentales, arboles genealogicos
✅ obsidian-mind-map              Mind maps
✅ advanced-canvas                Canvas avanzado
✅ obsidian-charts                Graficos
✅ obsidian-linter                Lint markdown
✅ find-unlinked-files            Detectar notas huerfanas
✅ remotely-save                  Sincronizacion remota
✅ syncthing-integration          Sync local entre dispositivos
✅ obsidian42-brat                Beta plugins
✅ execute-code                   Ejecutar codigo en notas
✅ smart-context, smart-lookup    Smart family
✅ smart-chatgpt                  ChatGPT integrado (DESCARTADO en favor de BMO)
✅ copilot                        DESCARTADO (licencia problematica)
✅ ai-bot, ai-templater           Otros plugins IA (no usados)
✅ open-vscode, vscode-editor     VSCode bridge
✅ obsidian-user-plugins, decks   Otros
✅ mehrmaid, mermaid-tools        Mermaid diagrams
```

**Conclusion**: 32 plugins conviven sin conflictos memoria. Validado.

### 4.1 Vault plantilla futuro: Cerebrito_Vault

```
Cerebrito_Vault/
├── .obsidian/
│   └── plugins/
│       ├── bmo-chatbot/          ← BMO Chatbot Plus preconfigurado
│       └── obsidian-local-rest-api/  ← REST API para tools
│
├── 00_Inbox/                     ← Notas rapidas, imports
├── 01_Proyectos/                 ← Carpetas por proyecto
├── 02_Conocimiento/              ← Wiki personal (lo que Cerebrito aprende)
├── 03_Diario/                    ← Notas diarias
├── 04_Recursos/                  ← PDFs, DOCX, imagenes
│
├── Cerebrito/
│   ├── Profiles/                 ← Perfiles de asistente (.md)
│   │   └── Default.md            ← Perfil generico
│   ├── Prompts/                  ← Tareas predefinidas (.md)
│   │   ├── resumir.md
│   │   ├── revisar.md
│   │   └── investigar.md
│   └── History/                  ← Historial chats (auto)
│
└── index.md                      ← Bienvenida
```

---

## 5. Perfiles y prompts — como funciona en BMO

### 5.1 Orden de procesamiento (lo que recibe el LLM)

```
System message = system_role + perfil_seleccionado + referencia_nota_actual
User message   = prompt_seleccionado + texto_del_usuario
```

### 5.2 Archivos que NO se pierden al reinstalar BMO

| Que | Donde | Se pierde? |
|---|---|---|
| Perfiles | `Cerebrito/Profiles/*.md` (vault) | NO |
| Prompts | `Cerebrito/Prompts/*.md` (vault) | NO |
| Historial chats | `Cerebrito/History/*.md` (vault) | NO |
| Notas del usuario | `01_Proyectos/`, `02_Conocimiento/`, etc. | NO |
| Config BMO (URL, modelo, colores) | `.obsidian/plugins/bmo-chatbot/data.json` | SI — hacer backup |

---

## 6. Dependencias del proyecto

### 6.1 Plugin (npm)

```json
{
  "obsidian": "latest",
  "@codemirror/view": "^6.0.0",
  "@codemirror/state": "^6.0.0"
}
```

Build: `esbuild` → genera `main.js` (475KB).

### 6.2 Backend Python (pip)

```
# === EXISTENTES ===
fastapi==0.115.0
uvicorn[standard]==0.32.0
requests==2.32.5
beautifulsoup4==4.12.0
python-dotenv==1.2.1
mistralai==1.10.0       # Incluye Mistral OCR API
pydantic==2.12.5

# === A AÑADIR Fase 1 (Cerebrito Core Lite) ===
pypdf>=4.0              # Extract texto de PDFs
python-docx>=1.0        # Extract texto de DOCX

# === A AÑADIR Fase 1 (Cerebrito Core Privacy SKU) ===
easyocr>=1.7            # Fallback OCR local (~80MB + modelos)
                        # Modelos pre-descargados en ~/.EasyOCR/

# === A AÑADIR Fase 4 (Kuzu) ===
kuzu>=0.4.0             # Grafo embebido (SOLO Cerebrito Core)

# === A AÑADIR opos pack ===
neo4j-driver>=5.x       # Solo SKU OPOS Pack/Server

# === A AÑADIR Fase 0 (Capability + Telemetria) ===
# (sin deps externas — codigo propio en shared-tools/)
```

---

## 7. Bugs conocidos y deuda tecnica (actualizado 26/05/2026)

| Bug/Deuda | Severidad | Donde | Fase a fix |
|---|---|---|:--:|
| **CSS sidebar se descuadra** en ventanas < 700px | ALTA | `styles.css:648-658` | Fase 0 |
| **Desplegable modelos** muestra todos mezclados | MEDIA | `FetchModelList.ts`, `view.ts` | Fase 3 |
| **proxy_agente_escritor.py** duplica codigo con `chandra_tools.py` | MEDIA | Backend | Fase 0 (extraer a shared-tools) |
| **PROXY_PORT** conflicto (.env dice 8000, Chandra usa 8080) | MEDIA | `proxy_agente_escritor.py:36` | Fase 0 |
| **No hay feedback** de tools usadas en respuesta | BAJA | `FetchModelResponse.ts` | Fase 3 |
| **FetchModelResponse.ts** 2337 lineas, monolitico | MEDIA | Refactor a `providers/{*}.ts` | Fase 0 |
| **Commands.ts** tiene 55K lineas | BAJA | `src/components/chat/Commands.ts` | Fase 0 |
| **main.ts** 1287 lineas, ProfileManager + PluginLifecycle mezclados | MEDIA | Extraer modulos | Fase 0 |
| **BOVEDA_OPOS raiz** config erronea | BAJA | Solo subdir BOVEDA_OPOS\BOVEDA_OPOS valido | N/A |
| **AgenteEscritor.exe v1** sin tools PDF nuevas | MEDIA | Recompilar para Cerebrito Core (Fase 7) | Fase 7 |
| **OPOS_GEMINI_1** refactor pendiente | ALTA | calculos_ss_extended.py 2457 lineas (NO TOCAR — verificado BOE) | Post-MVP |
| **Token GitHub expuesto** | RESUELTO ✅ | Verificado 26/05 | OK |

---

## 8. Referencias

| Documento | Ubicacion |
|---|---|
| **PRD Cerebrito v1.1** | `docs_planes/prd_cerebrito.md` |
| **Product Brief v1.1** | `docs_planes/product_brief_cerebrito.md` |
| **Project Overview v1.1** (este) | `docs_planes/project_overview_cerebrito.md` |
| PRD OpositAIA (Chandra) | `/home/spas/OPOS_GEMINI_1/docs/prd.md` |
| Memoria sesion 23/05 | `/home/spas/OPOS_GEMINI_1/23_05_2026_MEMORIA_SESION.md` |
| Wiki proyecto OPOS | `D:\OPOS_PROJECT\` |
| Graphify del proyecto | `D:\OPOS_PROJECT\01-Wiki\Graphify\` (164 comunidades) |
| **Mistral OCR script productivo** | `/home/spas/OPOS_GEMINI_1/academias/extract_pdfs_ocr_mistral.py` |
| **Mistral OCR test** | `/home/spas/OPOS_GEMINI_1/academias/test_mistral_ocr.py` |
| **EasyOCR modelos pre-descargados** | `~/.EasyOCR/model/` |
| **confidence_scorer.py** | `/home/spas/OPOS_GEMINI_1/backend/agents/confidence_scorer.py` |
| **reasoning_tracer.py** | `/home/spas/OPOS_GEMINI_1/backend/agents/reasoning_tracer.py` |
| Fork BMO repo (plugin) | `Espasiko/obsidian-bmo-chatbot-plus` |
| Cerebrito backend repo | `Espasiko/cerebrito-backend` (a crear Fase 0) |
| Shared tools submodulo | `Espasiko/shared-tools` (a crear Fase 0) |
| BMO original | `longy2k/obsidian-bmo-chatbot` (MIT) |
| MCP entity decisiones | `Decisiones_Cerebrito_26_05_2026` (memory MCP) |

---

*Documento generado el 25/05/2026, actualizado a v1.1 el 26/05/2026 por Spas + Cascade.*
