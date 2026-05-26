# Fase 0 — Plan de Estabilización (Cerebrito)

**Fecha:** 26/05/2026
**Estado:** PLAN — NO EJECUTAR todavía
**Aprobación:** Pendiente revisión por Spas
**Duración estimada:** 1-2 días de trabajo distribuidos

---

## Resumen ejecutivo

Crear arquitectura definitiva **4 repos GitHub** + submódulo común antes de empezar implementación. Garantizar que **nada se rompe** durante la transición (Chandra OPOS sigue funcionando, BMO multi-chat sigue funcionando, Nina AgenteEscritor.exe sigue funcionando).

```
┌────────────────────────────────────────────────────────────┐
│  PLAN FASE 0 — 7 PASOS                                     │
│  ────────────────────────────────────────────────────────  │
│  Paso 1: Snapshots de seguridad (tags git)                 │
│  Paso 2: Crear Repo 4 (shared-tools) en GitHub             │
│  Paso 3: Crear Repo 3 (cerebrito-backend) en GitHub        │
│  Paso 4: Clonar local + estructura inicial                 │
│  Paso 5: Branches nuevas en repos existentes               │
│  Paso 6: Migrar tools comunes a shared-tools               │
│  Paso 7: Verificación final (tests OK, todo funciona)      │
└────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Antes de empezar — Pre-checks

Verificar 3 cosas críticas:

```bash
# 1. Token GitHub configurado (sin exponer)
gh auth status

# 2. Workspaces OPOS_GEMINI_1 y BMO Pro están limpios o tienen cambios committeados
git -C /home/spas/OPOS_GEMINI_1 status
git -C /home/spas/obsidian-bmo-chatbot-plus status

# 3. Chandra funciona AHORA (test base)
curl http://127.0.0.1:8080/health  # debe devolver 200
```

**Si algún check falla → ARREGLAR antes de continuar.**

---

## Paso 1 — Snapshots de seguridad (tags git)

**Objetivo:** punto de retorno garantizado. Si algo sale mal en Fase 0 → `git checkout v1.0-pre-cerebrito` y todo vuelve atrás.

```bash
# OPOS_GEMINI_1 — tag en main
cd /home/spas/OPOS_GEMINI_1
git checkout main
git pull origin main  # asegurar último estado
git tag -a v1.0-pre-cerebrito -m "Snapshot pre-Cerebrito 26/05/2026

Estado: Chandra Edition con 7 tools, Neo4j 108 leyes,
hybrid HNSW+RRF, 517 comunidades Louvain. Backend FastAPI 8080.
Funcional y verificado con BOE.

Este tag es punto de retorno antes de:
- refactor/clean-codebase branch
- shared-tools submodule integration"
git push origin v1.0-pre-cerebrito

# BMO Pro — tag en feature/multi-chat
cd /home/spas/obsidian-bmo-chatbot-plus
git checkout feature/multi-chat
git pull origin feature/multi-chat
git tag -a v1.0-multi-chat -m "Snapshot multi-chat 26/05/2026

Estado: Plugin BMO Chatbot Plus fork con multi-chat,
sidebar plegable, búsqueda, header editable. Configurado
para Chandra Edition (8080) y AgenteEscritor (8000).

Este tag es punto de retorno antes de:
- feature/cerebrito-v1.1 branch
- Capability framework refactor"
git push origin v1.0-multi-chat
```

**Verificación Paso 1:**
```bash
git -C /home/spas/OPOS_GEMINI_1 tag -l "v1.0-pre-cerebrito"        # debe existir
git -C /home/spas/obsidian-bmo-chatbot-plus tag -l "v1.0-multi-chat"  # debe existir
```

✅ Si ambos tags existen → seguir al Paso 2.

---

## Paso 2 — Crear Repo `shared-tools` en GitHub

Usar `gh` CLI (recomendado) o vía web (github.com/new).

```bash
# Opción A: gh CLI
gh repo create Espasiko/shared-tools \
  --public \
  --description "Almacén común de tools Python para Cerebrito y OPOS Chandra. Capability framework, vault tools, PDF cascade OCR, telemetría local." \
  --gitignore Python \
  --license MIT \
  --confirm

# Clonar local
cd /home/spas/
git clone https://github.com/Espasiko/shared-tools.git
cd shared-tools

# Estructura inicial
mkdir -p tools tests
touch tools/__init__.py
touch tools/capability.py
touch tools/vault_tools.py
touch tools/pdf_tools.py
touch tools/search_tools.py
touch tools/telemetry.py
touch tools/verification.py

# README inicial
cat > README.md <<'EOF'
# shared-tools

Almacén común de tools Python para los backends Cerebrito y OPOS Chandra.

## Módulos

- `capability.py` — Clase abstracta `Capability` (agnóstica al LLM)
- `vault_tools.py` — Operaciones sobre vault Obsidian via REST API
- `pdf_tools.py` — Extracción texto cascada: pypdf → Mistral OCR cloud → EasyOCR local
- `search_tools.py` — Búsqueda internet: Tavily + DuckDuckGo fallback
- `telemetry.py` — Logs locales Niveles 1+2 (RGPD-friendly)
- `verification.py` — Anti-alucinación configurable por vertiente

## Uso como submódulo git

En el repo padre:

```bash
git submodule add https://github.com/Espasiko/shared-tools.git shared-tools
git submodule init
git submodule update
```

Para actualizar a la última versión:

```bash
git submodule update --remote shared-tools
git add shared-tools
git commit -m "chore: bump shared-tools to latest"
```

## Importar en código Python

```python
from shared_tools.tools.capability import Capability
from shared_tools.tools.vault_tools import read_note, create_note
from shared_tools.tools.pdf_tools import extract_pdf
```

## Licencia

MIT — ver LICENSE
EOF

# pyproject.toml mínimo
cat > pyproject.toml <<'EOF'
[project]
name = "shared-tools"
version = "0.1.0"
description = "Almacén común de tools Python para Cerebrito y OPOS Chandra"
requires-python = ">=3.10"
dependencies = [
    "pypdf>=4.0",
    "python-docx>=1.0",
    "requests>=2.32",
    "mistralai>=1.10",
    "beautifulsoup4>=4.12",
]

[project.optional-dependencies]
ocr-local = ["easyocr>=1.7"]
dev = ["pytest>=8.0", "ruff>=0.6"]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"
EOF

# Primer commit
git add .
git commit -m "feat: estructura inicial shared-tools

- Módulos vacíos: capability, vault_tools, pdf_tools, search_tools, telemetry, verification
- pyproject.toml con base + extras ocr-local + dev
- README con instrucciones de uso como submódulo"
git push origin main
```

**Verificación Paso 2:**
```bash
gh repo view Espasiko/shared-tools  # debe mostrar el repo creado
ls /home/spas/shared-tools/tools/   # debe listar los 7 archivos
```

---

## Paso 3 — Crear Repo `cerebrito-backend` en GitHub

```bash
gh repo create Espasiko/cerebrito-backend \
  --private \
  --description "Backend Cerebrito (Python FastAPI). SKUs Lite/Privacy/OPOS Pack/OPOS Server via build flags. Puerto 27182." \
  --gitignore Python \
  --confirm

# Nota: --private porque es código propietario (PRD §3 dual licensing)

cd /home/spas/
git clone https://github.com/Espasiko/cerebrito-backend.git
cd cerebrito-backend

# Estructura inicial
mkdir -p cerebrito/{llm_adapters,agents,kuzu}
mkdir -p packaging tests docs

# Añadir shared-tools como submódulo
git submodule add https://github.com/Espasiko/shared-tools.git shared-tools

# Archivos base vacíos
touch cerebrito/__init__.py
touch cerebrito/main.py
touch cerebrito/llm_router.py
touch cerebrito/llm_adapters/{__init__.py,mistral_adapter.py,claude_adapter.py,ollama_adapter.py,groq_adapter.py}
touch cerebrito/agents/{__init__.py,escritor_agent.py,estudiante_agent.py,abogado_agent.py,cerebrito_agent.py}

# pyproject.toml con build flags para 4 SKUs
cat > pyproject.toml <<'EOF'
[project]
name = "cerebrito"
version = "1.0.0"
description = "Cerebrito - Asistente IA para Obsidian"
requires-python = ">=3.10"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.32",
    "kuzu>=0.4",
    "pypdf>=4.0",
    "python-docx>=1.0",
    "mistralai>=1.10",
    "requests>=2.32",
    "python-dotenv>=1.2",
    "pydantic>=2.12",
    "beautifulsoup4>=4.12",
]

[project.optional-dependencies]
privacy = ["easyocr>=1.7"]                    # SKU Privacy: + OCR local
opos = ["neo4j>=5.0"]                         # SKU OPOS Pack: + neo4j driver
opos-server = ["neo4j>=5.0", "docker>=6.0"]   # SKU OPOS Server: + Docker
dev = ["pytest>=8.0", "ruff>=0.6", "pyinstaller>=6.0"]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"
EOF

# README inicial
cat > README.md <<'EOF'
# cerebrito-backend

Backend Python para Cerebrito — el cerebro IA detrás del plugin Obsidian BMO Chatbot Plus.

## SKUs (Stock Keeping Units)

Una sola codebase, 4 productos comerciales via build flags:

| SKU | Comando | Tamaño | Para quien |
|-----|---------|-------:|-----------|
| Cerebrito Core Lite | `pip install cerebrito` | ~50 MB | Escritores, estudiantes, autónomos |
| Cerebrito Core Privacy | `pip install cerebrito[privacy]` | ~180 MB | Abogados (EasyOCR local) |
| Cerebrito OPOS Pack | `pip install cerebrito[opos]` | ~700 MB | Opositores SS (Neo4j Desktop) |
| Cerebrito OPOS Server | `pip install cerebrito[opos-server]` | ~3 GB | Power users (Docker) |

## Arquitectura

- **Puerto:** 27182 (Euler × 10000)
- **Framework:** FastAPI
- **DB:** Kuzu embebido (Core) o Neo4j (OPOS)
- **Tools comunes:** vía submódulo `shared-tools/`

## Setup desarrollo

```bash
git clone --recurse-submodules https://github.com/Espasiko/cerebrito-backend.git
cd cerebrito-backend
python -m venv venv && source venv/bin/activate
pip install -e ".[dev,privacy]"  # ejemplo: SKU Privacy + dev tools
uvicorn cerebrito.main:app --port 27182 --reload
```

## Build releases

PyInstaller con spec distinto por SKU:

```bash
pyinstaller packaging/lite.spec
pyinstaller packaging/privacy.spec
pyinstaller packaging/opos.spec
pyinstaller packaging/opos-server.spec
```

## Licencia

Propietario / Commercial — ver LICENSE (NO MIT)
EOF

# Primer commit
git add .
git commit -m "feat: estructura inicial cerebrito-backend

- Backend FastAPI puerto 27182
- pyproject.toml con SKUs via build flags (Lite, Privacy, OPOS Pack, OPOS Server)
- Submódulo shared-tools/ integrado
- Estructura agents/ + llm_adapters/ + packaging/
- README con instrucciones SKU y setup dev"
git push origin main
```

**Verificación Paso 3:**
```bash
gh repo view Espasiko/cerebrito-backend           # debe existir
cat /home/spas/cerebrito-backend/.gitmodules      # debe referenciar shared-tools
ls /home/spas/cerebrito-backend/shared-tools/     # debe mostrar contenido del submódulo
```

---

## Paso 4 — Branches nuevas en repos existentes

### 4.1 BMO Pro — branch `feature/cerebrito-v1.1`

```bash
cd /home/spas/obsidian-bmo-chatbot-plus

# Asegurar que estamos en feature/multi-chat con todo committeado
git checkout feature/multi-chat
git status  # debe estar limpio o committear los cambios pendientes

# Crear nueva branch desde feature/multi-chat
git checkout -b feature/cerebrito-v1.1

# Push inicial (vacía, será donde se haga el refactor)
git push -u origin feature/cerebrito-v1.1
```

### 4.2 OPOS_GEMINI_1 — branch `refactor/clean-codebase`

```bash
cd /home/spas/OPOS_GEMINI_1
git checkout main
git status  # advertencia: hay muchos archivos sin trackear

# Antes de hacer la branch, decidir qué hacer con los untracked
# Recomendación: stash o commit los relevantes en main primero
# (esto requiere análisis aparte, NO automatizar)

git checkout -b refactor/clean-codebase

# Añadir shared-tools como submódulo
git submodule add https://github.com/Espasiko/shared-tools.git shared-tools
git commit -m "chore: añadir shared-tools como submódulo

Permite usar capability/vault_tools/pdf_tools/etc desde shared-tools
sin duplicación con cerebrito-backend."

git push -u origin refactor/clean-codebase
```

**Verificación Paso 4:**
```bash
git -C /home/spas/obsidian-bmo-chatbot-plus branch
# debe listar: feature/cerebrito-v1.1 (asterisco)

git -C /home/spas/OPOS_GEMINI_1 branch
# debe listar: refactor/clean-codebase (asterisco)
```

---

## Paso 5 — Migración inicial de tools comunes a `shared-tools`

**Objetivo:** mover (no copiar) vault_tools y pdf_tools desde OPOS a shared-tools, validando que OPOS sigue funcionando.

⚠️ **Importante:** este paso requiere análisis manual archivo por archivo. **NO automatizar.** Lo dejamos para que Spas decida cada archivo en sesión separada.

Plan general:

```
1. Identificar funciones reutilizables en OPOS_GEMINI_1/backend/agents/chandra_tools.py
   → read_obsidian_note, create_obsidian_note, etc.

2. Crear versión "genérica" en shared-tools/tools/vault_tools.py
   → Sin lógica específica de Chandra, solo HTTP REST API

3. En OPOS_GEMINI_1/backend/agents/chandra_tools.py:
   → import desde shared_tools.tools.vault_tools
   → mantener wrappers específicos de Chandra si los hay

4. Test: curl http://127.0.0.1:8080/health → 200
5. Test: enviar mensaje desde BMO Plus → respuesta llega con tool calls OK

6. Commit + push en ambos repos (shared-tools y OPOS_GEMINI_1)
```

**Funciones candidatas a migrar primero:**
- `read_obsidian_note(path)` — GET /vault/{path}
- `create_obsidian_note(path, content)` — PUT /vault/{path}
- `extract_pdf(path, mode)` — cascada pypdf+OCR

**NO migrar todavía:**
- `confidence_scorer.py` y `reasoning_tracer.py` (específicos SS, no son tools comunes)
- `calculos_ss_extended.py` (verificado BOE, NO TOCAR)
- `consultar_neo4j.py` (específico OPOS Neo4j, no va a Cerebrito Core)

---

## Paso 6 — Refactor BMO frontend (en branch `feature/cerebrito-v1.1`)

⚠️ **Trabajo grande.** Se desglosa en sub-pasos individuales:

```
6.1 Dividir src/api/FetchModelResponse.ts (2337 líneas)
    → src/api/providers/{mistral,groq,gemini,ollama,openai,anthropic,deepseek,openrouter,hf}.ts
    
6.2 Extraer src/profile/ProfileManager.ts y src/lifecycle/PluginLifecycle.ts desde main.ts (1287 líneas)

6.3 Dividir src/components/chat/Commands.ts (~55K líneas) por categoría

6.4 Test esbuild: npm run build → 0 errores

6.5 Cargar plugin en BOVEDA_OPOS de Obsidian → chat funciona con Chandra
```

**Estimación:** 4-8 horas según resistencia del código actual.

---

## Paso 7 — Verificación final

Tests E2E que deben pasar antes de cerrar Fase 0:

```bash
# Test 1: Chandra OPOS responde
curl -X POST http://127.0.0.1:8080/opos/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"chandra","messages":[{"role":"user","content":"Hola Chandra"}]}'
# Esperado: 200 con respuesta JSON OpenAI-compatible

# Test 2: AgenteEscritor (Nina) responde en Windows
# (test manual desde Windows)

# Test 3: BMO Plus cargado en BOVEDA_OPOS sin errores
# Obsidian Settings → BMO Chatbot Plus → ver consola → 0 errores

# Test 4: Submódulo shared-tools funcional
cd /home/spas/cerebrito-backend
python -c "from shared_tools.tools.capability import Capability; print('OK')"
# Esperado: 'OK' (cuando capability.py tenga clase)

# Test 5: Tags y branches en lugar correcto
git -C /home/spas/OPOS_GEMINI_1 tag -l
# Esperado: v1.0-pre-cerebrito

git -C /home/spas/obsidian-bmo-chatbot-plus tag -l
# Esperado: v1.0-multi-chat
```

**Si los 5 tests pasan → Fase 0 COMPLETADA.** Listos para Fase 1.

---

## Rollback (si algo sale mal)

```bash
# Volver al estado pre-Fase 0
cd /home/spas/OPOS_GEMINI_1
git checkout v1.0-pre-cerebrito

cd /home/spas/obsidian-bmo-chatbot-plus
git checkout v1.0-multi-chat

# Los repos shared-tools y cerebrito-backend pueden seguir existiendo
# (vacíos no molestan). Si quieres borrarlos:
gh repo delete Espasiko/shared-tools --yes
gh repo delete Espasiko/cerebrito-backend --yes
```

---

## Checklist completa

- [ ] **Paso 0**: Pre-checks (gh auth, git status, Chandra responde 200)
- [ ] **Paso 1.1**: Tag `v1.0-pre-cerebrito` en OPOS_GEMINI_1
- [ ] **Paso 1.2**: Tag `v1.0-multi-chat` en BMO Pro
- [ ] **Paso 2**: Repo `Espasiko/shared-tools` creado + estructura inicial + primer commit
- [ ] **Paso 3**: Repo `Espasiko/cerebrito-backend` creado + submódulo + primer commit
- [ ] **Paso 4.1**: Branch `feature/cerebrito-v1.1` en BMO Pro
- [ ] **Paso 4.2**: Branch `refactor/clean-codebase` en OPOS_GEMINI_1 + submódulo shared-tools
- [ ] **Paso 5**: Migración inicial vault_tools/pdf_tools (sesión aparte)
- [ ] **Paso 6**: Refactor BMO frontend (sesión aparte, 4-8h)
- [ ] **Paso 7**: Tests E2E (5/5 pasando)

---

## Próximos pasos tras Fase 0

Una vez completada Fase 0, arrancar **Fase 1 — Tools universales** del PRD §13:

- Implementar `extract_pdf` cascada en `shared-tools/tools/pdf_tools.py`
- Implementar `vault_tools.py` completo con tests
- Implementar `Capability` framework en `shared-tools/tools/capability.py`
- Implementar `telemetry.py` Niveles 1+2

---

*Plan generado el 26/05/2026 por Spas + Cascade.*
*Referencias: PRD §4.4 y §13, Project Overview §2.5.*
*Entidad MCP: `Decisiones_Cerebrito_26_05_2026`.*
