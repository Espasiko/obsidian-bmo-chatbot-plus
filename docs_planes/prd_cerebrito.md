# Product Requirements Document — Cerebrito (BMO Chatbot Plus)

**Autor:** Spas
**Fecha:** 26/05/2026
**Version:** 1.1
**Estado:** DECISIONES FIRMES (post-iteracion 26/05/2026)
**Repo plugin:** `Espasiko/obsidian-bmo-chatbot-plus`
**Repo backend:** `Espasiko/cerebrito-backend` (a crear)
**Tools comunes:** `Espasiko/shared-tools` (submodulo git)

---

## 1. Vision del producto

**Cerebrito** es un asistente "segundo cerebro" que vive dentro de Obsidian. El usuario final abre Obsidian, escribe en el chat, y Cerebrito le ayuda con su trabajo — ya sea estudiar oposiciones, escribir libros, gestionar un negocio, o aprender cualquier materia.

**Lo que hace especial a Cerebrito:**
- Aprende de las interacciones y del contenido del vault (notas, PDFs, documentos) — wiki + Kuzu cache reduce **~68% de tokens** (validado en pruebas 26/05/2026)
- Tiene herramientas reales: lee, crea y organiza notas, busca en internet, consulta bases de datos de conocimiento
- Funciona con CUALQUIER modelo de IA (Mistral, Groq, Gemini, DeepSeek, Claude, HF models, OpenRouter, OpenAI, Ollama local)
- El usuario elige modelo, perfil y herramientas sin salir del chat
- Se adapta al dominio: opositores, escritores, estudiantes, abogados, autonomos, PYMEs
- **Anti-alucinacion configurable por vertiente** (estricto opos/abogados, soft escritores)

**Frase clave:** "Obsidian + IA que trabaja para ti, no al reves."

### Estructura de productos (decision firme 26/05/2026)

| Producto | Para quien | BD | Empaquetado | Tamano |
|----------|------------|-----|-------------|--------:|
| **Cerebrito Core Lite** | Escritores, estudiantes, autonomos, generico | Kuzu embebido | exe + bat + vault | ~50 MB |
| **Cerebrito Core Privacy** | Abogados, casos confidenciales | Kuzu + EasyOCR local | exe + bat + vault | ~180 MB |
| **Cerebrito OPOS Pack** | Opositores SS (Chandra) | Neo4j Desktop | instalador + datos pre-cargados | ~700 MB |
| **Cerebrito OPOS Server** | Power users opositores | Neo4j en Docker | docker-compose | ~3 GB |

**Regla firme**: Neo4j SOLO para OPOS (108 leyes, hybrid search HNSW indispensable). Todos los demas con Kuzu embebido (zero Docker, zero config).

---

## 2. Problema que resuelve

| Dolor del usuario | Solucion Cerebrito |
|---|---|
| Los chatbots no conocen mis notas ni mi contexto | Cerebrito LEE tu vault, busca semanticamente, y crea notas, indexa y crea wiki para consultas diarias y se enriquece cada vez que se ingrese mas informacion, guarda conversciones, resumenes en la wiki y wn la bd sincronizados! |
| Tengo PDFs y docs que la IA no puede leer | Cerebrito extrae texto de PDF, DOCX, y lo integra |
| Cada vez que cambio de modelo pierdo las herramientas | El modelo cambia, las herramientas se mantienen y la memoria de las conversaciones, conocimiento y contexto tambien|
| Configurar IAs es dificil para un no-techie | Un bat/exe arranca todo, Obsidian ya viene configurado o se puede elegir facilmente |
| Los chatbots no recuerdan entre sesiones | Kuzu (grafo embebido) almacena conocimiento que crece con el uso |
| Necesito buscar en internet desde el chat | Tavily (gratis tier) + DuckDuckGo fallback integrados |
|en futuro - integrar con ggldrive notebook u otros herramientas externos. Y mantener privacidad y seguridad total (cuando se use ollama) o avisos de no exponer datos privados en el chat con los llm-s externas y no inflingir derechos de autor.

---

## 3. Usuarios objetivo (vertientes)

### 3.1 Vertiente actual — ya funciona

| Vertiente | Agente backend | BD | Descripcion |
|---|---|---|---|
| **Opositores SS** | Chandra (puerto 8080, WSL+Docker) | Neo4j (108 leyes, 6683 preceptos, 379 EXCEPCION_A, 517 comunidades Louvain) | 7 herramientas: BOE, hybrid search, calculadoras SS verificadas Python, vault, escribir_vault |
| **Escritores Nina** | AgenteEscritor.exe (puerto 8000, Windows nativo, deprecated) | Sin BD | 4 herramientas: leer/crear/editar notas, buscar internet. Bulgaro |
| **Escritores Miguel Angel** | A entregar (clon Nina + perfil hitita) | Sin BD inicialmente | Mismas tools + perfil novela historica Oriente Proximo (Imperio Hitita 1650-1178 a.C.). Migrable a Cerebrito Core (Kuzu) en Fase 4.2 |

### 3.2 Vertientes futuras

| Vertiente | Para quien | Herramientas especificas |
|---|---|---|
| **Estudiantes** | Universidad, bachillerato, idiomas | Flashcards auto, Spaced Repetition, resumenes, quiz |
| **Abogados** | Bufetes, consultores juridicos | BOE en tiempo real, jurisprudencia, buscador CENDOJ |
| **Autonomos/PYMEs** | Gestores, empresarios | Calculadora IRPF, cotizaciones RETA, modelos fiscales | facturas, mini CRM, prediccion y analisis del negocio
| **Investigadores** | Academicos, doctorandos | Semantic search, citation manager, literature review |

Cada vertiente = un **perfil** + un **set de herramientas** + opcionalmente una **base de conocimiento Kuzu/Neo4j**.

---

## 4. Arquitectura — como funciona todo

### 4.1 La cadena completa (simple)

```
USUARIO (Obsidian)
    |
    v
BMO Chatbot Plugin (chat UI en Obsidian)
    |
    | POST /v1/chat/completions (OpenAI-compatible)
    v
BACKEND (FastAPI en Python)
    |
    |-- Elige modelo LLM (Mistral, Groq, Gemini, DeepSeek...)
    |-- Ejecuta herramientas (leer PDF, buscar, calcular, neo4j...)
    |-- Consulta Kuzu (grafo de conocimiento embebido)
    |-- Lee/escribe vault via Obsidian REST API
    |
    v
RESPUESTA al usuario (texto + acciones realizadas)
```

### 4.2 Componentes clave

| Componente | Que es | Donde vive |
|---|---|---|
| **BMO Chatbot Plus** | Plugin Obsidian (TypeScript). Chat UI, selector modelo, prefijos `@/#/*` | `obsidian-bmo-chatbot-plus/` |
| **Backend proxy** | FastAPI Python. Recibe mensajes, llama LLM con tools, devuelve respuesta | `backend/proxy_agente_escritor.py` (escritor) o `backend/routers/opos_chat.py` (Chandra) |
| **Kuzu** | Base de datos grafo embebida (como SQLite para grafos). 0 config, ~10MB | Carpeta local junto al backend |
| **Neo4j** | Base de datos grafo servidor. Para datos grandes (108 leyes, 6683 preceptos) | Docker container (solo para opos) |
| **Obsidian Local REST API** | Plugin que expone el vault por HTTP (puerto 27123) | Plugin Obsidian |
| **Tavily** | API de busqueda web (gratis tier: 1000 queries/mes) | Llamada desde backend |

### 4.3 Puertos y conexiones (decision firme 26/05/2026)

```
Windows/Mac:
  Puerto 27123 — Obsidian Local REST API (siempre)
  Puerto 27182 — Cerebrito Core (numero Euler e×10000, sin conflictos)
                 [escritores, estudiantes, abogados, autonomos, generico]
  Puerto 8080  — Backend OPOS Chandra (WSL+Docker) [opositores SS]
  Puerto 8000  — DEPRECATED (AgenteEscritor.exe v1 de Nina, mantener hasta migracion)

El usuario final solo ve Obsidian. No sabe que hay puertos.
```

**Por que NO puerto 9000 (descartado tras analisis):** Conflicto alto en Windows con PHP-FPM (XAMPP/WAMP/Laragon), Docker Registry, SonarQube, Adobe ColdFusion, Portainer. Todos por defecto en 9000.

**Por que 27182:**
- Memorable (numero de Euler e × 10000, "e elevado al pi grande")
- IANA registered sin asignacion oficial
- 0 apps populares lo usan
- > 1024 (no requiere admin en Windows)
- Configurable via `.env` si por casualidad colisiona

### 4.4 Arquitectura de repos (decision firme 26/05/2026 — confirmada con usuario)

**4 repos GitHub** con responsabilidades claras + 1 almacen comun via submodulo:

```
┌─────────────────────────────────────────────────────────┐
│  Espasiko/obsidian-bmo-chatbot-plus  (TIENDA BMO)       │
│  TypeScript - plugin Obsidian - YA EXISTE               │
│  branches: main, feature/multi-chat, feature/cerebrito  │
└─────────────────────────────────────────────────────────┘
              │                                  │
              ▼ habla con                        ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│  Espasiko/OPOS_GEMINI_1 │         │  Espasiko/cerebrito-    │
│  (TIENDA OPOS)          │         │  backend (TIENDA        │
│  Python FastAPI 8080    │         │  CEREBRITO) NUEVO       │
│  Chandra 7 tools        │         │  Python FastAPI 27182   │
│  YA EXISTE              │         │  Kuzu embebido          │
│  branches: main,        │         │  Build flags para 4     │
│  refactor/clean         │         │  SKUs (no branches)     │
└─────────────────────────┘         └─────────────────────────┘
              │                                  │
              └────────────────┬─────────────────┘
                               ▼ usa via submodule git
              ┌─────────────────────────────────────┐
              │  Espasiko/shared-tools (ALMACEN)    │
              │  Python - tools comunes - NUEVO     │
              │  ├── tools/vault_tools.py           │
              │  ├── tools/pdf_tools.py (cascada)   │
              │  ├── tools/search_tools.py          │
              │  ├── tools/capability.py            │
              │  └── tools/telemetry.py             │
              └─────────────────────────────────────┘
```

#### SKUs via build flags (Opcion B — confirmada 26/05/2026)

**NO usar branches separadas por SKU.** Una sola codebase en `main` de `cerebrito-backend` con build flags en `pyproject.toml`:

```toml
# cerebrito-backend/pyproject.toml
[project]
name = "cerebrito"
version = "1.0.0"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.32",
    "kuzu>=0.4",
    "pypdf>=4.0",
    "mistralai>=1.10",
    # ... base dependencies (Lite SKU)
]

[project.optional-dependencies]
privacy = ["easyocr>=1.7"]            # SKU Privacy: + OCR local
opos = ["neo4j>=5.0"]                  # SKU OPOS Pack: + neo4j driver
opos-server = ["neo4j>=5.0", "docker>=6.0"]  # SKU OPOS Server: + Docker

# Instalacion:
#   pip install cerebrito              ← Cerebrito Core Lite
#   pip install cerebrito[privacy]     ← Cerebrito Core Privacy
#   pip install cerebrito[opos]        ← Cerebrito OPOS Pack
#   pip install cerebrito[opos-server] ← Cerebrito OPOS Server
```

**Releases por tag git** (no por branch):
- `v1.0-lite`, `v1.0-privacy`, `v1.0-opos`, `v1.0-opos-server`

**Spec PyInstaller distinto por SKU** en `cerebrito-backend/packaging/`:
- `lite.spec`, `privacy.spec`, `opos.spec`, `opos-server.spec`

**Ventaja**: bug fix en `main` se aplica a todos los SKUs automaticamente. **Una sola codebase.** Estandar industria (Django, FastAPI, Flask usan `[extras]`).

#### Snapshots antes de empezar

- `git tag v1.0-multi-chat` en `obsidian-bmo-chatbot-plus/feature/multi-chat` → punto retorno
- `git tag v1.0-pre-cerebrito` en `OPOS_GEMINI_1/main` → punto retorno

Permite volver a estado actual con `git checkout v1.0-pre-cerebrito` sin necesidad de rama paralela.

### 4.5 Flujo de datos BMO → Backend

El plugin BMO envia un POST asi:
```json
{
  "model": "agente-escritor",
  "messages": [
    {"role": "system", "content": "System prompt + perfil + prompt task"},
    {"role": "user", "content": "Lo que escribio el usuario"}
  ],
  "max_tokens": 4096,
  "temperature": 0.3
}
```

El backend:
1. Parsea mensajes
2. Detecta prefijos (`@groq`, `#leer-pdf`, `/perfil-nina`)
3. Inyecta system prompt con fecha actual + herramientas disponibles
4. Llama al LLM elegido con function calling
5. Ejecuta tools si el LLM las invoca (bucle max 6 iteraciones)
6. Devuelve respuesta en formato OpenAI

BMO renderiza la respuesta como markdown en el chat.

---

## 5. Funcionalidades — que puede hacer Cerebrito

### 5.1 Herramientas universales (todos los agentes)

| Tool | Descripcion | API que usa | Confirmacion? |
|---|---|---|---|
| `read_note` | Lee una nota del vault | Obsidian REST GET /vault/{path} | NO |
| `create_note` | Crea una nota nueva | Obsidian REST PUT /vault/{path} | NO |
| `update_note` | Anade texto al final de una nota | Obsidian REST POST /vault/{path} | NO |
| `overwrite_note` | Reescribe una nota completa | Obsidian REST PUT /vault/{path} | **SI** |
| `delete_note` | Borra una nota | Obsidian REST DELETE /vault/{path} | **SI** |
| `move_note` | Mueve/renombra una nota | Obsidian REST PATCH /vault/{path} | **SI** |
| `list_vault` | Lista archivos del vault | Obsidian REST GET /vault/ | NO |
| `extract_pdf` | Extrae texto de un PDF (cascada inteligente) | pypdf → Mistral OCR cloud → EasyOCR local | NO |
| `extract_docx` | Extrae texto de un DOCX | python-docx (local) | NO |
| `search_internet` | Busca en internet | Tavily API + DuckDuckGo fallback | NO |
| `search_vault_semantic` | Busqueda semantica en notas | Smart Connections via mcp-tools (NO reimplementar) | NO |
| `consultar_kuzu` | Query grafo conocimiento embebido | Kuzu Cypher | NO |
| `aprender_kuzu` | Anade entidades/relaciones desde conversacion | Kuzu Cypher | NO |

### 5.1.1 Cascada de extraccion PDF (decision firme 26/05/2026)

```python
def extract_pdf(path, mode="auto"):
    if mode == "auto":
        texto = pypdf.extract(path)             # 1. Rapido para PDFs texto
        if len(texto.strip()) < 100:            # 2. Si esta vacio (escaneado)
            if MISTRAL_OCR_KEY and not user_prefers_local:
                texto = mistral_ocr(path)       # 3. Cloud (precision 99%)
            else:
                texto = easyocr_extract(path)   # 4. Local (privacy mode)
    elif mode == "private":
        texto = easyocr_extract(path)            # Forzar local siempre
    return texto
```

**Mistral OCR**: validado y operativo. Script productivo en `OPOS_GEMINI_1/academias/extract_pdfs_ocr_mistral.py`. Modelo `mistral-ocr-latest`. 3 API keys configuradas. Tier gratuito hasta 1000 paginas/mes. Precision 99% con tablas/columnas.

**EasyOCR**: solo en SKU "Cerebrito Core Privacy" (~130 MB extra). Modelos ya descargados en `~/.EasyOCR/model/` (craft_mlt_25k.pth + latin_g2.pth).

**Smart Connections**: NO reimplementar busqueda semantica. Reusar plugin existente via `mcp-tools` (ambos ya instalados en BOVEDA_OPOS, conviven correctamente).

### 5.2 Herramientas especializadas por vertiente

| Vertiente | Tools adicionales |
|---|---|
| **Opos SS (Chandra)** | `search_boe`, `get_law_text_block`, `consultar_neo4j`, `calcular_ss` |
| **Escritor** | `consultar_kuzu` (personajes, relaciones, cronologia) |
| **Estudiantes** (futuro) | `crear_flashcard`, `quiz_mode`, `spaced_repetition_update` |
| **Abogados** (futuro) | `search_cendoj`, `search_boe`, `consultar_neo4j` |
| **Autonomos** (futuro) | `calcular_irpf`, `calcular_reta`, `modelo_303` |

### 5.2.1 Anti-alucinacion por vertiente (decision firme 26/05/2026)

Flag `verification_level` configurable por perfil. NO universal — Chandra (opos) y abogados son los unicos casos juridicamente sensibles.

| Vertiente | verification_level | Tools de verificacion | Cita obligatoria |
|-----------|--------------------:|----------------------|:----------------|
| **Opositor SS** | `strict` | confidence_scorer + reasoning_tracer + Tier 1-3 (Chandra) | Si (Art + URL BOE) |
| **Abogado** | `strict` | confidence_scorer adaptado + cita CENDOJ + disclaimer legal | Si (jurisprudencia + BOE) |
| **Investigador** | `medium` | citation_manager (futuro) | Si (academica) |
| **Autonomo/PYME** | `medium` | verificar normativa AEAT cuando aplica | Si (normativa fiscal) |
| **Estudiante** | `soft` | citar fuente cuando es factual, libre cuando es opinion | Opcional |
| **Escritor** | `soft` | detectar anacronismos pero no bloquear creatividad | No |

**Implementacion**: `confidence_scorer.py` y `reasoning_tracer.py` (existen en `OPOS_GEMINI_1/backend/agents/`) son **especificos de SS** (citan LGSS, opciones A/B/C/D, calculos jubilacion). Para abogados: portar la idea pero adaptada a CENDOJ + disclaimer legal. Para escritores/estudiantes: NO usar (sobre-engineering).

### 5.2.2 Skills/Workflows/Tools — abstraccion universal "Capability"

Cada framework usa jerga distinta (OpenAI=tools, Anthropic=skills, MCP=tools, BMAD=agents, LangChain=chains). Cerebrito unifica con clase `Capability`:

```python
# shared-tools/tools/capability.py
class Capability:
    """Una habilidad invocable, agnostica al modelo LLM."""
    name: str               # "leer_pdf"
    description: str
    inputs: dict            # JSON schema
    handler: callable       # funcion Python que ejecuta
    triggers: list          # ["#leer-pdf", "/pdf", "*pdf"]  multiples prefijos
    verification: str       # "strict" | "medium" | "soft" | "off"
    requires_confirm: bool  # si es destructiva
    vertiente: list         # ["opos", "escritor", "*"]  donde aplica
```

**Adapters por LLM** (en `cerebrito-backend/llm_adapters/`):
- `mistral_adapter.py` → traduce Capability a OpenAI function calling
- `claude_adapter.py` → traduce a Anthropic skills (XML)
- `ollama_adapter.py` → traduce a prompt engineering (function calling soft)
- `groq_adapter.py` → OpenAI function calling
- `bmad_adapter.py` → solo SKU Desarrolladores (oculto a no-coders)

El usuario solo ve prefijos (`@modelo`, `/perfil`, `#tool`, `*workflow`). El backend abstrae todo.

### 5.3 UI del plugin BMO — mejoras planificadas

#### Estado actual del chat
- Barra de texto para escribir mensajes
- Desplegable de modelos en el header
- Sidebar con conversaciones guardadas
- Boton de enviar

#### Mejoras planificadas

**Sistema de prefijos en el input del chat:**

| Prefijo | Accion | Ejemplo |
|---|---|---|
| `@modelo` | Cambiar LLM para esta sesion | `@groq resume este PDF` |
| `/perfil` | Cargar un perfil de la carpeta de perfiles | `/nina-editor` |
| `#herramienta` | Forzar uso de una herramienta | `#leer-pdf Capitulo3.pdf` |
| `*workflow` | Activar flujo predefinido | `*modo-examen` |

**Boton "+" en la barra de chat:**
Un boton junto al input que abre un menu con:
- Modelos disponibles (con indicador de cual esta activo)
- Perfiles cargables
- Herramientas invocables directamente
- Workflows predefinidos

**Indicador de estado del backend:**
- Icono verde/rojo en el header del chat
- Tooltip: "Conectado a Chandra (Mistral medium)" o "Backend no disponible"

**Selector de modelo LLM independiente del agente:**
- El usuario puede cambiar entre Mistral, Groq, Gemini, DeepSeek sin cambiar de agente
- Las herramientas se mantienen, solo cambia el cerebro
- Header muestra: `[Chandra] via Groq llama-4-scout`

---

## 6. Kuzu — el grafo de conocimiento personal

### Que es Kuzu
Base de datos de grafos embebida. Como SQLite pero para relaciones. Sin servidor, sin Docker, sin config. Un archivo en disco.

### Para que sirve en Cerebrito
- **Escritores:** Almacena personajes, relaciones entre ellos, cronologia, temas, arcos narrativos
- **Estudiantes:** Conceptos, dependencias entre temas, progreso de estudio
- **General:** Entidades mencionadas en conversaciones, conexiones descubiertas, aprendizaje incremental

### Como funciona
```
Usuario: "El Duque Juan es el padre de la Princesa Elena y vive en el Castillo Norte"
    |
    v
Backend extrae entidades:
    Duque Juan (Personaje) --[padre_de]--> Princesa Elena (Personaje)
    Duque Juan (Personaje) --[vive_en]--> Castillo Norte (Lugar)
    |
    v
Kuzu almacena (persistente, local, 0 tokens)
    |
    v
Proxima conversacion: "Quien vive en el Castillo Norte?"
    → Kuzu responde sin llamar al LLM: "Duque Juan"
```

### Kuzu vs Neo4j (decision firme 26/05/2026)

| | Kuzu | Neo4j |
|---|---|---|
| **Tamano** | ~10MB, embebido | ~500MB, servidor Docker |
| **Config** | 0 (un import) | Docker + user/pass + bolt port |
| **Para quien** | TODOS excepto opositores SS | SOLO opositores SS (Chandra) |
| **Cypher** | Si, compatible | Si, nativo |
| **Ideal para** | Paquete distribuible (exe/bat sin Docker) | Datos masivos pre-cargados (108 leyes, hybrid HNSW) |
| **SKU** | Cerebrito Core Lite + Privacy | Cerebrito OPOS Pack + OPOS Server |

**Regla firme**: NO migrar opositores a Kuzu. Neo4j ya tiene embeddings 1024d, hybrid search HNSW, RRF, comunidades Louvain. **Productos separados, sin migracion forzosa.**

### 6.1 Wiki cache + Kuzu = ahorro de tokens (validado 26/05/2026)

**Validacion empirica con D:\OPOS_PROJECT** (consulta dificil sobre Chandra):

| Modo | Tokens IN | Tokens OUT | Total | Ahorro |
|------|-----------|-----------|-------|-------:|
| Sin wiki (lee codigo) | 7800 | 600 | 8400 | baseline |
| Con wiki Cerebrito | 2100 | 600 | 2700 | **68%** |

**Capa 1**: Kuzu/Wiki devuelve respuesta cacheada → 0 tokens al LLM
**Capa 2**: Smart Connections devuelve top-5 chunks → solo lo relevante al LLM
**Capa 3**: LLM responde con contexto minimo
**Capa 4**: Aprendizaje — la respuesta se guarda en wiki/Kuzu para proxima vez

### 6.2 Templater + flashcards pre-generadas

Plugin `templater-obsidian` ya instalado en BOVEDA_OPOS. Permite generar plantillas:
- Cerebrito genera flashcard 1 vez con LLM (cuesta tokens)
- Templater la guarda como nota Markdown estructurada
- Plugin `obsidian-spaced-repetition` (ya instalado) la programa
- Proxima vez = 0 tokens (la flashcard ya existe)

---

## 7. Empaquetado y distribucion

### 7.1 Para desarrollo (Spas)
```
WSL Linux:
  - Backend Python (uvicorn) en puerto 8080 (Chandra) o 8000 (escritor)
  - Neo4j en Docker (7687)
  - Todo configurable via .env.backend

Windows:
  - Obsidian con plugin BMO Chatbot Plus
  - Plugin Local REST API (27123)
```

### 7.2 Para usuario final (Nina, Miguel Angel, futuros usuarios)
```
Carpeta en disco (USB, descarga):
  AgenteEscritor.exe     ← Backend compilado con PyInstaller (18MB)
  .env                   ← API keys (Mistral, Tavily)
  1_arrancar.bat          ← Doble clic para encender
  2_parar.bat             ← Doble clic para apagar
  3_verificar.bat         ← Diagnostico
  VAULT_USUARIO/          ← Boveda Obsidian preconfigurada
    .obsidian/plugins/    ← BMO + Local REST API + plugins utiles
    BMO/Profiles/         ← Perfiles del usuario
    BMO/Prompts/          ← Prompts predefinidos
    BMO/History/          ← Historial de chats (auto)
```

**El usuario solo hace:**
1. Instalar Obsidian (gratis, una vez)
2. Abrir la boveda VAULT_USUARIO
3. Doble clic en `1_arrancar.bat`
4. Escribir en el chat de BMO

No necesita saber que es un puerto, un LLM, un API key, ni Python.

### 7.3 Futuro: Tauri (opcional)
Si queremos una app nativa (sin bats, sin ventana negra):
- Tauri (Rust + HTML) empaqueta el frontend + backend
- Sidecar: el exe Python corre como proceso hijo
- Icono en bandeja del sistema: verde = activo, rojo = parado
- **No es prioritario ahora** — el sistema bat+exe ya funciona

---

## 8. Sistema de perfiles y prompts en BMO

### Como funciona hoy (orden de ejecucion)

```
1. System role (Settings → General → System prompt)
   → Base siempre activa, define el idioma y personalidad general

2. Perfil (.md en BMO/Profiles/)
   → Se carga al seleccionarlo. Define ROL del asistente.
   → Ejemplo: "Eres un editor literario senior experto en narrativa epica"

3. Prompt (.md en BMO/Prompts/)
   → Se PREPONE al mensaje del usuario. Define TAREA.
   → Ejemplo: "Analiza el capitulo siguiente buscando inconsistencias..."

4. Mensaje del usuario
   → Lo que escribe en el chat
```

### Perfiles = quien es Cerebrito en esta sesion

| Perfil | Vertiente | Idioma | Contenido |
|---|---|---|---|
| `Nina_Editor.md` | Escritor | Bulgaro | Editor literario senior, ficcion epica |
| `MiguelAngel_Escritor.md` | Escritor | Espanol | Escritor narrativa historica |
| `Opositor_SS.md` | Opos | Espanol | Chandra, agente juridico SS 2026 |
| `Estudiante_General.md` | Estudiantes | Espanol | Tutor adaptativo, spaced repetition |

### Prompts = que tarea hacer ahora

| Prompt | Que hace |
|---|---|
| `#revisar-capitulo` | Revisar coherencia, estilo, errores en el capitulo actual |
| `#ficha-personaje` | Crear ficha completa de personaje (datos, relaciones, arco) |
| `#modo-examen` | Generar caso practico tipo examen con 4 opciones |
| `#resumir-pdf` | Extraer y resumir un PDF adjunto o referenciado |

---

## 9. Cambio de modelo LLM — independiente del agente

### El problema
Hoy: si seleccionas "agente-escritor", siempre usa Mistral medium. No puedes cambiar.

### La solucion
El backend acepta un parametro `llm_override` o un prefijo `@modelo` en el mensaje:

```
Usuario escribe: @groq Resumeme el capitulo 3
                  ^^^^
                  prefijo detectado por el backend

Backend:
  1. Extrae "@groq" del mensaje
  2. Usa Groq llama-4-scout como LLM
  3. Mantiene TODAS las herramientas del agente escritor
  4. Responde como siempre
```

**Modelos soportados:**

| Prefijo | Modelo | Coste | Ideal para |
|---|---|---|---|
| `@mistral` | mistral-medium-latest | API key | Function calling, precision (default) |
| `@groq` | llama-4-scout-17b | Gratis (500K/dia) | Rapido, consultas simples |
| `@gemini` | gemini-2.5-flash | Gratis (tier basico) | Largo contexto, resumenes |
| `@deepseek` | deepseek-chat | Barato | Razonamiento profundo |
| `@ollama` | local (salamandra, mistral) | Gratis, local | Sin internet, privacidad total |

Las herramientas NO cambian. El agente sigue siendo el mismo. Solo cambia el "cerebro".

---

## 10. MCP (Model Context Protocol) — acceso a plugins

### Que es MCP
Protocolo estandar para que las IAs accedan a herramientas externas. Como USB pero para IAs.

### Como lo usamos
El plugin `mcp-tools` ya esta instalado en los vaults. Permite exponer funciones de otros plugins como herramientas MCP que el backend puede llamar.

**Ejemplo futuro:**
```
BMO tiene plugin Smart Connections (busqueda semantica)
  → mcp-tools expone: search_smart_connections(query)
  → Backend llama: mcp://obsidian/search_smart_connections("personajes capitulo 3")
  → Resultado: las 5 notas mas relevantes
```

**MCPs que ya tenemos configurados (en el entorno de desarrollo):**
- `memory` — grafo de conocimiento persistente
- `boe` — busqueda BOE en tiempo real
- `fetch` — descargar URLs
- `github` — operaciones GitHub

---

## 11. Seguridad y proteccion del usuario

### 11.1 Confirmacion de acciones destructivas

El LLM tiene herramientas que pueden destruir trabajo del usuario (borrar un capitulo, sobrescribir una nota). **Regla: toda accion destructiva requiere confirmacion.**

| Tool | Tipo | Confirmacion? |
|---|---|---|
| `read_note` | Lectura | NO — ejecutar siempre |
| `search_internet` | Lectura | NO |
| `list_vault` | Lectura | NO |
| `extract_pdf` | Lectura | NO |
| `create_note` | Creacion | NO — no destruye nada existente |
| `update_note` (append) | Modificacion leve | NO — solo anade al final |
| `overwrite_note` | **Destructiva** | **SI** — popup: "Cerebrito quiere reescribir [nota]. Permitir?" |
| `delete_note` | **Destructiva** | **SI** — popup: "Cerebrito quiere borrar [nota]. Permitir?" |
| `move_note` | **Destructiva** | **SI** — popup: "Cerebrito quiere mover [nota] a [destino]. Permitir?" |

**Implementacion:**
- Backend devuelve un mensaje especial tipo `{"confirmation_required": true, "action": "delete", "target": "Capitulo3.md"}`
- BMO muestra popup con botones [Permitir] [Cancelar]
- Si el usuario permite, BMO reenvia con flag `{"confirmed": true}`
- Si cancela, BMO responde al LLM "El usuario ha cancelado la accion"

### 11.2 Privacidad de datos

| Modo | Que pasa con los datos | Aviso al usuario |
|---|---|---|
| **Cloud** (Mistral, Groq, Gemini, etc.) | El texto se envia al servidor del proveedor LLM | Banner: "Tus datos se envian a [proveedor]. No compartas datos personales sensibles." |
| **Local** (Ollama) | NADA sale del ordenador | Banner: "Modo privado. Tus datos no salen de tu ordenador." |
| **Hibrido** (futuro) | Tools locales, LLM en cloud | Banner especifico |

**Reglas:**
- El aviso se muestra UNA vez al iniciar sesion (no en cada mensaje)
- En el footer del chat: icono candado verde (local) o nube naranja (cloud)
- Notas en carpeta `04_Recursos/privado/` NUNCA se envian al LLM (futuro: regex configurable)
- No enviar contenido completo de PDFs al LLM — solo resumen/extracto

### 11.3 Auto-reparacion de configuracion

**Problema:** Si el usuario reinstala BMO, el `data.json` se resetea y el chat deja de funcionar. El usuario no sabe re-configurar URLs ni modelos.

**Solucion:** El backend genera y repara la config automaticamente.

```
1_arrancar.bat arranca el exe/backend
  → Backend comprueba si existe data.json en el vault
  → Si NO existe o esta corrupto:
      → Genera data.json correcto (URL, modelo, colores, perfiles)
      → Log: "Config BMO generada automaticamente"
  → Si existe pero tiene URL incorrecta:
      → Corrige solo la URL, respeta el resto de la config del usuario
  → Obsidian carga el data.json ya correcto
```

El usuario NUNCA necesita tocar configuracion. Si algo se rompe, reiniciar el bat lo arregla.

### 11.4 Telemetria local opt-in (decision firme 26/05/2026)

Sistema de logs **100% local** para detectar bugs y mejorar producto sin enviar datos al exterior.

**Marco legal**: RGPD + LOPDGDD espanola. Empezamos con Niveles 1+2 (sin papeleo legal). Nivel 3 solo si llegamos a 50+ usuarios con asesoria.

| Nivel | Que hace | Legal? | Implementar |
|-------|----------|--------|-------------|
| **1. Logs locales** | `~/.cerebrito/telemetry.jsonl` NUNCA sale del PC | ✅ 100% legal sin requisito | **SI desde Fase 1** |
| **2. Comando `/telemetria`** | Usuario ve sus propios datos | ✅ 100% legal (RGPD Art. 15) | **SI desde Fase 1** |
| **3. Envio anonimo agregado** | Manda conteos a servidor Spas | ⚠️ Legal con politica + opt-in | **NO inicialmente** |

```python
# shared-tools/tools/telemetry.py (Fase 0.5, ~50 lineas)
TELEMETRY_FILE = Path.home() / ".cerebrito" / "telemetry.jsonl"

def log_event(event: str, **kwargs):
    if not os.getenv("CEREBRITO_TELEMETRY_ENABLED", "1") == "1":
        return
    TELEMETRY_FILE.parent.mkdir(exist_ok=True)
    with open(TELEMETRY_FILE, "a") as f:
        f.write(json.dumps({
            "ts": datetime.now().isoformat(),
            "event": event,
            **kwargs
        }) + "\n")
```

**Eventos a logar**: `tool_called`, `model_used`, `error_occurred`, `session_duration`, `tokens_consumed`. NUNCA contenido de notas ni mensajes.

**Beneficios para Spas**:
- Detectar si Nina/Miguel abandonan despues de N dias sin pedirles reportes
- Saber que tools se usan vs se ignoran (priorizar Fase 2/3)
- Detectar errores recurrentes en `extract_pdf` que justifiquen activar EasyOCR fallback
- Datos para iteracion basada en uso real, no suposiciones

---

## 12. Requisitos No Funcionales

| Requisito | Valor |
|---|---|
| **Latencia respuesta** | < 10s consultas simples, < 30s con tools |
| **Ahorro tokens** | Objetivo > 60% gracias a wiki+Kuzu cache (validado 68% en pruebas) |
| **Offline** | Funciona con Ollama local (sin internet, sin API keys) |
| **Tamano Cerebrito Core Lite** | ~50 MB exe |
| **Tamano Cerebrito Core Privacy** | ~180 MB exe (incluye EasyOCR) |
| **Tamano Cerebrito OPOS Pack** | ~700 MB (Neo4j Desktop + datos) |
| **Tamano Cerebrito OPOS Server** | ~3 GB (Docker + Neo4j Community + datos) |
| **Privacidad** | Datos NUNCA salen del ordenador (excepto LLM cloud con aviso) |
| **Seguridad** | Acciones destructivas requieren confirmacion |
| **Auto-reparacion** | Backend regenera config si se rompe |
| **OS soportados** | Windows 10/11 (bat+exe). Mac/Linux (python directo) |
| **Obsidian version** | >= 1.0.0 |
| **Modelos minimos** | Al menos 1 cloud (Mistral) O 1 local (Ollama) |
| **Hardware Ollama** | RAM 8 GB + GPU 6 GB VRAM recomendados (no obligatorio) |
| **Tavily API** | Tier gratuito 1000 queries/mes; fallback DDG scrape |
| **Mistral OCR** | Tier gratuito 1000 paginas/mes; fallback EasyOCR local |

---

## 13. Fases de implementacion (reordenadas con dependencias 26/05/2026)

### Dependencias entre fases

```
Fase 0 (estabilizacion) → bloquea TODO lo demas
Fase 1 (tools) ⇄ Fase 2 (multi-modelo) — independientes, paralelizables
Fase 3 (UI) → depende de Fase 1 + 2
Fase 4 (Kuzu) — independiente, puede empezar en paralelo con Fase 1
Fase 5 (segundo cerebro) — requiere Fase 4 estable
Fase 6 (vertientes) — solo despues de validar 1 vertiente con usuarios reales
Fase 7 (empaquetado) — al final con todo listo
```

### Fase 0 — Estabilizacion (PROXIMA, prerequisito de todo)

**Objetivo**: base solida antes de añadir features nuevas.

- [ ] **Crear repos**: `cerebrito-backend` (nuevo) + `shared-tools` (submodulo)
- [ ] **Tag git** `v1.0-pre-cerebrito` en OPOS_GEMINI_1 (snapshot pre-refactor)
- [ ] **Migrar tools comunes** a `shared-tools/tools/`:
  - `vault_tools.py` (read/create/update/delete/move/list/overwrite)
  - `pdf_tools.py` (cascada pypdf → Mistral OCR → EasyOCR)
  - `search_tools.py` (Tavily + DDG)
  - `capability.py` (clase abstracta)
  - `telemetry.py` (Niveles 1+2 local-first)
- [ ] **Refactor BMO frontend** (sin romper Chandra Edition):
  - Dividir `FetchModelResponse.ts` (2337 lineas) en `providers/{mistral,groq,gemini,ollama,openai,anthropic,deepseek,openrouter,hf}.ts`
  - Extraer `ProfileManager.ts` y `PluginLifecycle.ts` de `main.ts`
  - Dividir `Commands.ts` (~55K) por categoria
- [ ] **Test suite minima**: pytest backend + esbuild plugin sin errores
- [ ] **Verificar token GitHub** ya revocado (confirmado 26/05: ✅ ningun ghp_ en repos)

**NO refactorizar OPOS_GEMINI_1 ahora.** Dejar para post-MVP (su codigo esta verificado, alto riesgo si se rompe).

### Fase 1 — Tools universales

- [ ] `extract_pdf` (cascada pypdf → Mistral OCR → EasyOCR)
- [ ] `extract_docx` (python-docx)
- [ ] `list_vault` (con filtros extension/carpeta)
- [ ] `delete_note`, `overwrite_note`, `move_note` (con confirmacion)
- [ ] `search_vault_semantic` via Smart Connections + mcp-tools (NO reimplementar)
- [ ] Telemetria Nivel 1+2 activa
- [ ] **Dependencias**: `pypdf>=4.0`, `python-docx>=1.0`, `mistralai>=1.10`, `easyocr` (opcional)

### Fase 2 — Cambio de modelo LLM
- [ ] Backend: parsear prefijo `@modelo` del mensaje del usuario
- [ ] Backend: parametro `llm_override` en el endpoint `/v1/chat/completions`
- [ ] Configurar proveedores: Mistral, Groq, Gemini, DeepSeek, Ollama
- [ ] BMO plugin: mostrar modelo activo en header

#### Estado real (31/05/2026) — ya implementado en el proxy AgenteEscritor
- [x] Router multi-proveedor por REST OpenAI-compatible (`requests`), 11+ proveedores:
      mistral, groq, gemini, grok, openai, deepseek, openrouter, claude, kimi, minimax,
      ollama, llamacpp. Seleccion por campo `model` ("proveedor:modelo") o `LLM_PROVIDER` en .env.
- [x] `/v1/models` anuncia los modelos → aparecen en el selector nativo de BMO ("REST API Models").
- [x] Solo Mistral validado con tools; los demas se activan poniendo su key en .env.
- [x] **Modelos verificados en vivo 31/05/2026** — los IDs de OpenRouter cambian MUY rápido:
      - Claude 3.x ELIMINADO de OR → ahora `anthropic/claude-sonnet-4.6`, `claude-haiku-4.5`
      - Gemma 3 free ELIMINADO → ahora `google/gemma-4-31b-it:free`
      - Groq: solo `llama-3.3-70b-versatile` activo; llama3-70b, gemma2, mixtral dan 400
      - Modelos free OR activos: gemma-4-31b, llama-3.3-70b, deepseek-v4-flash, gpt-oss-120b
      - Ollama local (Spas): `mistral-local:latest`, `salamandra-r1:q5km`, `qwen2.5-coder:1.5b-base`
- [x] **Vault Miguel Ángel** entregado y operativo (novela histórica hitita):
      BMO perfil Edi, openrouter:claude-sonnet-4.6, 4 templates dual-syntax, obsidian-git configurado
- [x] Templates Templater con **sintaxis dual**: `tp.mcpTools ? ... : await tp.system.prompt()`
      para funcionar tanto desde proxy (REST) como desde UI de Obsidian (Ctrl+P)

#### PENDIENTE — Catálogo de modelos con precio + descripción (Cerebrito)
> Hoy el selector muestra una lista plana de "proveedor:modelo". Para producto hace falta un
> **catálogo curado y navegable**, porque groq/deepseek/openrouter tienen MUCHOS modelos.
- [ ] Definir un catálogo (JSON) `model_catalog.json`: por cada modelo → `{id, proveedor,
      nombre_amigable, precio_in/precio_out (€/1M tokens), velocidad, contexto, calidad,
      descripcion_corta (1 línea), tags: [barato|potente|rápido|local|gratis|tools]}`.
- [ ] Fuente de precios: tabla mantenida a mano + opción de refrescar desde OpenRouter
      (`GET /api/v1/models` ya trae pricing) para los que pasan por OpenRouter.
- [ ] UI BMO: selector agrupado por proveedor con **nombre amigable + precio + 1 línea**,
      y filtros (barato / potente / gratis / local / con-tools). No volcar el listado crudo.
- [ ] Marcar cuáles soportan tools (para no romper el agente al elegir uno que no las soporta).
- [ ] Modelos gratis a destacar: OpenRouter `*:free` (Gemma, Llama), Groq (tier gratis),
      Gemini Flash (free tier), Ollama/llama.cpp (local, gratis).
- [ ] Recomendados por defecto: Mistral Large (tools OK), DeepSeek (barato+bueno),
      Kimi K2 (barato+fuerte), Gemini Flash (rápido+gratis), Groq (rápido).

### Fase 3 — UI del plugin BMO
- [ ] Boton `+` en la barra de input con menu desplegable
- [ ] Prefijos `@ / # *` con autocompletado
- [ ] Indicador de estado del backend (verde/rojo)
- [ ] Selector visual de modelo LLM en el header

### Fase 4 — Kuzu grafo de conocimiento
- [ ] Instalar kuzu en el backend
- [ ] Tool `consultar_kuzu` — query Cypher al grafo embebido
- [ ] Tool `aprender_kuzu` — extraer entidades de conversacion y guardar
- [ ] Schema Kuzu por vertiente (escritor: Personaje, Lugar, Evento; estudiante: Concepto, Tema)
- [ ] Poblar grafo automaticamente desde interacciones

### Fase 4.1 — Pilot Miguel Angel (escritor novela hitita)

**Piloto antes de Fase 5**: usuario real no-tecnico.

- [ ] Clonar Vault Nina → `Vault_MiguelAngel_Hititas/`
- [ ] Crear perfil `MiguelAngel_Escritor_Hititas.md` (cronologia hitita 1650-1178 a.C., reyes, geografia, cultura)
- [ ] Prompts especificos: `revisar-capitulo`, `ficha-personaje`, `verificar-historico`, `mapa-conceptual`
- [ ] Plugins vault: bmo-chatbot, obsidian-local-rest-api, smart-connections, obsidian-spaced-repetition, obsidian-git, obsidian-excalidraw
- [ ] Entrega en USB o .zip con `LEEME_Miguel.txt` de 1 pagina
- [ ] Validar 2 semanas: ¿Miguel puede usar Cerebrito sin ayuda?

### Fase 4.2 — Migracion Nina opcional

- [ ] Si Miguel Angel feliz con Cerebrito Core → ofrecer a Nina upgrade desde AgenteEscritor.exe v1
- [ ] **Migracion OPCIONAL**, no forzosa. Nina decide
- [ ] AgenteEscritor.exe v1 sigue funcionando hasta que Nina migre

### Fase 5 — Cerebrito "segundo cerebro"
- [ ] Aprendizaje incremental: cada conversacion alimenta Kuzu
- [ ] Recall: antes de responder, Cerebrito busca en Kuzu si ya sabe la respuesta (objetivo > 60% ahorro tokens)
- [ ] Resumen de sesion automatico al cerrar chat
- [ ] Dashboard de conocimiento: "Cerebrito sabe X entidades, Y relaciones"
- [ ] Vault analytics: que notas se usan mas, que temas domina el usuario
- [ ] Demo killer: usar Graphify del proyecto OPOS (164 comunidades, 2010 nodos) como prueba viva

### Fase 6 — Nuevas vertientes (despues de validar piloto)
- [ ] Perfil + tools Estudiantes (con Spaced Repetition + Templater)
- [ ] Perfil + tools Abogados (verification_level=strict + cita CENDOJ)
- [ ] Perfil + tools Autonomos/PYMEs
- [ ] Perfil + tools Investigadores (citation manager)
- [ ] **SKU Desarrolladores** (futuro): expone BMAD agents oculto a no-coders
- [ ] Marketplace de perfiles/tools (futuro lejano)

### Fase 7 — Empaquetado final (4 SKUs)
- [ ] **Cerebrito Core Lite** (~50 MB): exe + bat + Cerebrito_Vault generico
- [ ] **Cerebrito Core Privacy** (~180 MB): + EasyOCR para abogados
- [ ] **Cerebrito OPOS Pack** (~700 MB): Neo4j Desktop + 108 leyes pre-cargadas
- [ ] **Cerebrito OPOS Server** (~3 GB): docker-compose para power users
- [ ] Documentacion por SKU (LEEME.txt diferente cada uno)
- [ ] Opcionalmente: Tauri app nativa (futuro lejano)

---

## 14. Riesgos y mitigaciones

| Riesgo | Severidad | Mitigacion |
|---|---|---|
| Obsidian cambia API de plugins | Media | BMO es fork nuestro, podemos adaptar |
| Tavily deja de ser gratis | Media | DuckDuckGo scraping como fallback (ya implementado) |
| Kuzu no soporta algo que necesitamos | Baja | Fallback a SQLite + JSON para grafos simples |
| Mistral OCR cambia tier gratuito | Media | EasyOCR local como fallback automatico |
| PyInstaller bloqueado por antivirus | Media | Firmar exe (futuro) o instrucciones de excepcion |
| Usuario no entiende prefijos | Baja | Boton `+` con menu visual como alternativa |
| API keys expuestas | Alta | .env NUNCA en git, .gitignore estricto, LEEME advierte |
| **Obsidian Sync** sincroniza `BMO/History/` con conflictos multi-device | Media | Documentar conflicto en LEEME + opcion `disable_sync_history` |
| **Hardware Ollama** insuficiente (< 6GB VRAM) | Alta | Fallback a cloud (Mistral) automatico + aviso al usuario |
| **Conflictos plugins** Obsidian (Smart Connections + BMO + REST API + mcp-tools) | Baja | Validado en BOVEDA_OPOS — 32 plugins conviven OK |
| **GDPR/RGPD** vertiente Abogados/Autonomos | Critico legal | Telemetria solo Niveles 1+2, modo privado con EasyOCR |
| **Token GitHub expuesto** (revocado 26/05) | Resuelto | ✅ Verificado: 0 tokens en repos |
| **Backend separados** = mas mantenimiento | Bajo (aceptado) | shared-tools como submodulo evita duplicacion |

---

## 15. Metricas de exito

| Metrica | Objetivo | Como medir |
|---|---|---|
| Nina chatea sin ayuda de Spas | 1 semana sin incidencias | Telemetria local + check semanal |
| Miguel Angel crea vault y usa | 2 semanas | Telemetria + entrevista |
| Tiempo respuesta chat | < 10s sin tools, < 30s con tools | Telemetria `session_duration` |
| PDFs extraidos correctamente | > 95% (cascada pypdf+Mistral OCR+EasyOCR) | Test con academias OPOS |
| Cambio modelo sin reiniciar | 100% modelos configurados | Test E2E |
| Kuzu retiene info entre sesiones | Test: preguntar algo dicho hace 3 dias | Manual |
| **Ahorro tokens via wiki/Kuzu** | > 60% en consultas medianas/dificiles | Telemetria `tokens_consumed` (validado 68% en pruebas) |
| **0 errores criticos** primera semana piloto | 0 crashes | Telemetria `error_occurred` |

---

## 16. Decisiones firmes (26/05/2026)

Resumen de decisiones tomadas en sesion de iteracion del PRD v1.0 → v1.1:

| # | Decision | Estado |
|---|----------|--------|
| 1 | **Kuzu vs Neo4j** → Productos separados (Core Kuzu / OPOS Neo4j) | ✅ FIRME |
| 2 | **Backend** → SEPARADOS (OPOS WSL+Docker, Cerebrito Windows nativo). Tools comunes en submodulo `shared-tools/` | ✅ FIRME |
| 3 | **Licencia** → Dual: plugin MIT + backend Commercial + vaults propietarios | ✅ FIRME |
| 4 | **Vault Miguel Angel** → Clonar Nina + perfil hitita, entregar en 1 tarde post-Fase 1 | ✅ FIRME |
| A | **Graphify** del proyecto OPOS como demo killer feature | ✅ APROBADO |
| B | **Anti-alucinacion** → flag `verification_level` por vertiente (no universal) | ✅ APROBADO |
| C | **BMAD** → solo SKU Desarrolladores, oculto a no-coders | ✅ APROBADO |
| D | **Modelo negocio** → TBD post-MVP, despues de estudiar competencia | ✅ APROBADO |
| E | **Skills universal** → abstraccion `Capability` + adapters por LLM | ✅ APROBADO |
| F | **Smart Connections** → reusar via mcp-tools, NO reimplementar | ✅ APROBADO |
| H | **Telemetria** → Niveles 1+2 (100% legal sin papeleo) | ✅ APROBADO |
| OCR | **Mistral OCR (default cloud) + EasyOCR (privacy mode)** | ✅ FIRME |
| Confidence/Reasoning | NO universal — solo opos+abogado | ✅ APROBADO |
| Puerto | **27182** (no 9000, conflictos PHP-FPM/Docker) | ✅ FIRME |
| Refactor OPOS | Pendiente post-MVP, snapshot con tag git | ✅ APROBADO |
| Nina Kuzu | NO migrar todavia. Migracion opcional fase 4.2 | ✅ APROBADO |
| Wiki ahorro tokens | Confirmado **68% real** en pruebas D:\OPOS_PROJECT | ✅ VALIDADO |

---

*Documento generado el 25/05/2026, actualizado a v1.1 el 26/05/2026 por Spas + Cascade.*
*Siguiente paso: Fase 0 — crear repos `cerebrito-backend` y `shared-tools`, snapshot tag git, refactor BMO frontend.*
