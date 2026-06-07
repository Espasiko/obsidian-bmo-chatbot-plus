# PLAN CEREBRITO + DURGA — 05/06/2026
> Plan estratégico y técnico. Fuente de verdad: este archivo.
> Previo: PRD Cerebrito (`prd_cerebrito.md`), decisiones firmes vigentes.

---

## ⚡ DECISIONES + EJECUCIÓN (sesión 05/06, deadline beta Miguel = mañana)

### Decidido con Spas
- **Grafo Miguel:** Obsidian primero (los `[[enlaces]]`) + semántica; Kuzu en fase 2 (con MERGE emulado en Python — no es bloqueante).
- **Embeddings:** `mistral-embed` por defecto (sin instalar nada). nomic-embed (274 MB) como opción offline; **mistral-local 4.1 GB = prescindible**. Jina v3 aparcado para Cerebrito/Durga.
- **Mini-wiki modelos:** hecha y actualizada a jun-2026 → `01-Wiki/Backend/Modelos_y_Endpoints_2026.md` (solo dev, no usuarios).
- **Orden de ejecución:** 1) keys+contexto → 2) OCR batch + grafo Miguel.

### HECHO esta sesión
- ✅ **Nina .env:** añadidas `GROQ_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `LLM_PROVIDER`; corregido `OPEN_ROUTER_API_KEY`→`OPENROUTER_API_KEY`.
- ✅ **Proxy — tool `ocr_carpeta`:** batch OCR con reanudar (`.ocr_progreso.json`), pausa 2s, espera 90s+aviso si satura, índice con `[[enlaces]]`.
- ✅ **Proxy — guard de contexto:** "texto demasiado largo" sale como mensaje claro, no Error 502.
- ✅ **Proxy — modelos al día:** Gemini `2.0-flash`(MUERTO 1-jun)→`3.5-flash`; Groq default `llama-4-scout`(escupía raw)→`openai/gpt-oss-120b`.
- ✅ Mini-wiki de modelos jun-2026.

### PENDIENTE inmediato
- [ ] Rebuild .exe (en curso) + deploy a Miguel (test OCR) → luego Nina + Yayo.
- [ ] **Spas:** regenerar key Gemini en aistudio.google.com (la actual `AQ.Ab...` tiene formato inválido; las buenas son `AIzaSy...`).
- [ ] Tras OCR de Miguel: workflow "crear fichas de wiki + extraer entidades" (semilla del grafo).
- [ ] Vault Miguel: carpetas expandidas + templates nuevos.
- [ ] `vault_map()` + watcher auto-index (mejora 4).

---

## 0. Estado real hoy (no aspiracional)

### Lo que funciona
- AgenteEscritor.exe 23 tools → 3 vaults (Yayo, Nina, Miguel)
- BMO Chandra Edition multi-chat, perfiles, selector modelos
- Proxy multi-modelo: Mistral, DeepSeek, Groq, Kimi, Gemini, OpenRouter, Ollama
- ocr_image (Mistral OCR), create_summary, generate_esquema, generate_quiz
- Vault YAYO_HELPER completo (wiki 36 notas, Ainoa)

### Bugs abiertos prioritarios
| Bug | Impacto | Workaround |
|-----|---------|-----------|
| **BMO textarea sin foco** (nueva conv sin historial) | ALTO — no se puede vender así | Minimizar/maximizar ventana |
| **Groq no lee .env** en Nina/Miguel/Yayo | MEDIO — Groq no funciona fuera de OPOS | Sin workaround |
| **Mistral no respeta prompt** tras primer mensaje | ALTO — alucina en Miguel/Nina | Usar DeepSeek o Kimi |noooo, NO ESL ASOLUCION!!! NO, DEBEMOS OBLIGARLA ADEMAS TIENE POCO CONTEXTO DE TOKENS , ME PARECE LE DICESQUE LEA 3-4 CAPITULOS Y DICE FALLO INESPERA!!!
| Puerto 9000 en conflicto (CLAUDE.md dice 27182) | BAJO — solo se nota en algunos Windows | .env PROXY_PORT |

### Lo que FALTA para Miguel Angel específicamente
1. Batch OCR de 1000+ páginas manuscritas DE INVESTIGACION!!!
2. Embeddings buenos para términos hititas  Y HISTIA ANTIGUA, PUEBLOS CULTURAS HALLAZGOS ES UNA INVESTIGACION CASI CIENTIFICA HISTORICO-ARQUEOLOGICA , NO SOLO NOVELA LLEVA 3 AÑOS DOCUMENTANDOSE TODAVIA Y TIENE 20 PAG. ESCRITAS!! (nomic, NO bge-micro)
3. Ollama NO instalado en máquina de Miguel (solo en máquina de Spas) DEBE SER "PORTATIL QUE LOS BAT LO INSTALEN!"
4. Carpetas vault insuficientes (le faltan: mapas, bibliografía, arqueología, imágenes, MAPAS, DATOS CRUZADOS, COMPARACIONES , CITAS ETC.)
5. Base de datos de grafos para relaciones complejas entre personajes/lugares/épocas/HALLAZGOS/MAPAS/EVENTOS/REINOS/CULTURAS/PUEBLOS/MAPAS Y TODO LO DEMAS QUE PUEDE SERVIR Y SER UTIL!

---

## 1. Decisiones técnicas: BD de grafos

### Kuzu vs FalkorDB vs Neo4j

| BD | Veredicto | Razón |
|----|-----------|-------|
| **Kuzu** | ✅ ELEGIDA para Cerebrito Core | Embebida (como SQLite), 0 config, Python nativo, rápida, ya en PRD |
| FalkorDB local | ❌ Descartada | Redis + DLL compilada C++ = pesadilla en Windows. Sin soporte oficial Windows nativo | PDRO KUZU NO TIENE MERGE, Y ALTERNATIVAS? NEO4J Y DOKER O QUE HACEMOS!!!?
| FalkorDB Cloud | ❌ Descartada | Sin TLS en tier gratis, borra datos a 7 días inactividad |
| Neo4j | ✅ Solo para OPOS | Decisión firme del PRD. Demasiado pesado para usuarios no-técnicos | SI NO SE PUEDE AUTOMATIZAR TODO, NO VALE! EL USUARIO SOLO DEBE DECIR SÍ, ENTER , SÍ ENTER ETC.

**Kuzu** ya estaba en el PRD. Gemini propuso FalkorDB porque no conocía el proyecto. Kuzu es la respuesta correcta: embebido, sin servidor, sin Docker, sin ports, ~10 MB, API Cypher. PERO SIN MERGE...RSUELVEMELO!

**Kuzu en Miguel Angel:** Sí tiene sentido para almacenar la "biblia" de la novela:
- Personajes con relaciones ([:ES_PADRE_DE], [:COMBATIÓ_EN], [:GOBERNÓ]) Y MUCHO MAS!!!
- Lugares, PEBLOS CULTURAS, HALLAZGOS, MAPAS, NOTAS, y épocas ETC.
- Artefactos arqueológicos
- Eventos cronológicos,MUY COMPLEJOS ENTRE 1000+ PAGINAS Y LIBRO APARTE!! 

### Ubuntu/WSL para aliviar problemas Windows

**Situación:** Los problemas de Windows (puertos ocupados, encoding, DLLs, Unix sockets) son reales pero manejables con la arquitectura actual. AVER SI ES VERDAD!!!

**Recomendación:**
- Para Spas (developer): WSL2 ya funciona. Seguir así. 
- Para usuarios finales (Nina, Miguel, Ainoa): NO instalar Ubuntu. El .exe portable es la única solución viable para no-técnicos.
- Para Kuzu: funciona en Windows puro sin WSL. ✅
- Para Ollama: funciona en Windows nativo. ✅
- Para FalkorDB local: NO funciona en Windows sin Redis. ❌ (por eso lo descartamos) y CON RDIS? FUNCIONARIA? 

---

## 2. Solución nomic para Miguel (sin Ollama instalado)

### Opción A — Usar Smart Connections con modelo remoto
Smart Connections soporta embeddings via API remota (no solo Ollama local). Configurar:
- Platform: `OpenAI Compatible`
- URL: `https://api.mistral.ai/v1/embeddings`
- Model: `mistral-embed` O NOMIC EMBED O BUSCA OTRO PARECIDO Y BUENO!!!
- API Key: la de Miguel (y la de Spas mientras testea)

**Ventaja:** Sin instalar Ollama. **Desventaja:** $0.0001/1K tokens, requiere internet. pero tonto mistral y las demas llm-s tambien requeren internet, idiota!!!

### Opción B — Instalar Ollama en máquina de Miguel
Ollama installer Windows: 1 clic, ~500 MB, arranca automáticamente. y se puede instalar automaticamente? junto con el vault?
```
winget install Ollama.Ollama
ollama pull nomic-embed-text  # 274 MB
```
Cambiar Smart Connections: Platform=Ollama, Model=nomic-embed-text, URL=http://localhost:11434

**Ventaja:** 100% offline, gratuito, mejor calidad. **Desventaja:** Miguel tiene que instalar. o nosotros y elsolo dice si si si etc.

### Opción C (RECOMENDADA ahora) — Usar plugin Smart Lookup
Miguel ya tiene Smart Lookup instalado. Funciona con embeddings vía proxy (ya apunta al agente).
No necesita Ollama para buscar semánticamente. El proxy puede hacer embeddings con Mistral, falta solapamiento!!!!.

**Decisión:** Opción C ahora, Opción B cuando Miguel quiera calidad máxima.

---

## 3. Plugin Bases de Obsidian — ¿sirve?

**Bases** es un plugin de Obsidian para crear vistas de tablas/bases de datos tipo Notion sobre notas .md con frontmatter YAML.

**Para Miguel:**
- ✅ Útil para índices: lista de personajes con nombre/época/rol, bibliografía ordenada
- ✅ Indexar PDFs ingesta por tags (fuente, año, relevancia)
- ✅ Vista de fichas arqueológicas filtradas por período
- ❌ NO hace embeddings ni búsqueda semántica — eso es Smart Connections
- ❌ NO reemplaza Kuzu para relaciones complejas

**Veredicto:** Complemento visual útil, no sustituto de nada.

---

## 4. Vault expandido para Miguel (investigador-arqueólogo)

### Estructura actual (insuficiente)
```
00_LIBRO/, 01_CRUDO/, 02_WIKI/, 03_NOTAS/, 99_TEMPLATES/
```

### Estructura propuesta
```
00_LIBRO/          → capítulos, borradores
01_CRUDO/
  apuntes_mano/    → fotos JPG/PNG de notas manuscritas
  pdfs/            → libros, artículos PDF
  mapas/           → mapas históricos escaneados
  bibliografia/    → referencias importadas
02_WIKI/
  personajes/      → fichas personajes (Kuzu)
  lugares/         → ciudades, regiones, yacimientos
  epocas/          → bloques cronológicos
  artefactos/      → objetos arqueológicos
  documentos/      → textos históricos (tratados, inscripciones)
  arqueologia/     → metodología, yacimientos
  bibliografía/    → fuentes académicas
03_NOTAS/          → notas libres de sesión
04_INVESTIGACION/  → Google Scholar, PubMed, artículos procesados
05_MAPAS/          → mapas mentales, cronologías visuales
06_KUZU_CACHE/     → base de datos de grafos (Kuzu, no tocar)
99_TEMPLATES/      → plantillas Templater

Y MAS COSAS , SI MIG ANGEL LOS NECESITA, DEBE PODER AÑADIRLOS Y QUE LA IA LOS CONOZCA, CO´MO LO HACEMOS?? 
```

---

## 5. Batch OCR para 1000 páginas (PLAN INMEDIATO)

### Tool ocr_batch_folder (a implementar en proxy)

```python
def ocr_batch_folder(folder: str, extension: str = "jpg,jpeg,png,webp,bmp",
                     output_folder: str = "", resume: bool = True) -> str:
    """Procesa TODAS las imágenes de una carpeta con OCR Mistral.
    - Pausa automática si se acerca al límite de rate (1 req/seg)
    - Resume desde donde quedó si se interrumpe (archivo .ocr_progress.json)
    - Avisa si se agota la quota y espera
    - Guarda cada imagen como .md gemelo en output_folder U GRO NOMBRE MAS CLRITO!"""
```

**Parámetros importantes:**
- `resume=True` → lee `.ocr_progress.json` y salta imágenes ya procesadas
- Rate limiting: 1 imagen/segundo, INCLUSO MAS ESPARA.!!! NO TAN JUSTO NO HAY PRISA! (Mistral free tier: 60 req/min)
- Si quota agotada (429): espera 60s O MASq!! y reintenta automáticamente SI NO VA, AVISA AL USUARIO!
- Output: una .md por imagen en `output_folder` (por defecto junto a la imagen)

**Coste estimado:** 1000 páginas × $0.001 = **$1 total** con key de Mistral (ESGRASTIS AHORA INCLUSO, PERO NO ES PROBLEMA EL PRECIO!, ES RIDICULO)

### Pipeline completo para Miguel
```
1. Miguel pone fotos en 01_CRUDO/apuntes_mano/
2. BMO: "procesa todas mis notas manuscritas"
2.a - crea wiki entradas se te lvida la wiki, coño!!!!!
3. Yayo/Edi: ocr_batch_folder(folder="01_CRUDO/apuntes_mano") → 1000 .md
4. ingest_file × 1000 → indexación Smart Connections
5. BMO: "¿qué sé sobre el rey Suppiluliuma?" → find_similar_notes → respuesta esto debe mejorar y drasticamente, com 1000 paginas se saltaria mas de la mitad de relackiones, coño!!!!
```

---

## 6. Mini-wiki de modelos y endpoints (solución al "buscar modelos cada vez")

Crear una nota en cada vault NOOOO ES PARA OPOS_PROJECT, NO PARA LOS USUARIOS FINALES!!!! : `00_SISTEMA/modelos_disponibles.md`

```markdown
---
tipo: referencia-sistema
actualizado: 2026-06-05
---
# Modelos disponibles por proveedor

## GRATIS (sin tarjeta) Y NO ES CORRECTO INVESTIGA LOS MODELOS DE GEOQ PROPIOS , LA GAT GPT 270 B ETC, MIERDA, ACTUALOZATE AL MAYO JUNIO 2026!!! PARA ESTO QUEIRO LA MINI WIKI! LO ESTOY BUSCANDO YA 20 VECES!! 
| Modelo BMO | Proveedor | TPM | RPM | Tools | Notas |
|-----------|-----------|-----|-----|-------|-------|
| groq:meta-llama/llama-4-scout-17b-16e-instruct | Groq | 30K | 30 | ✅ | Mejor opción gratis |
| groq:qwen/qwen3-32b | Groq | 6K | 60 | ✅ | Falla con prompts >5K tokens |
| groq:openai/gpt-oss-120b | Groq | 8K | 30 | ✅ | |
| openrouter:google/gemma-4-31b-it:free | OpenRouter | - | 20 | ✅ | Requiere $10 compra única |

## BARATOS (<$0.50/1M tokens)
| Modelo BMO | Coste input | Coste output | Tools | Notas |
|-----------|------------|-------------|-------|-------|
| mistral:mistral-small-latest | $0.10 | $0.30 | ✅ | Recomendado diario |
| deepseek:deepseek-chat | $0.14 | $0.28 | ✅ | Muy bueno calidad/precio |
| kimi:kimi-k2-0905-preview | $0.15 | $2.50 | ✅ | Contexto 128K |
| gemini:gemini-2.0-flash - ESTE TAMPOCO VA , NI CON 2 KEYS NUEVOS Y NECESITO PODER CAMBIAR API KEYS, ESTARIAN HARDCODEADOS POR ALGUN LADO???? | $0.10 | $0.40 | ✅ | Cuando tenga quota |

## POTENTES (pago) VERIFIAC ACTUALIZA INFO ESTOY HARTO YA!!!!
| Modelo BMO | Coste input | Tools | Notas |
|-----------|------------|-------|-------|
| mistral:mistral-large-latest | $2.00 | ✅ | Default Yayo |
| claude:claude-sonnet-4-6 | $3.00 | ✅ | El mejor para redacción |
| openai:gpt-4o | $2.50 | ✅ | |

## LOCAL (Ollama — solo máquina Spas)
| Modelo BMO | Tamaño | Tools | Notas |
|-----------|--------|-------|-------|
| ollama:mistral-local:latest | 4.1 GB | ✅ | |
| ollama:salamandra-r1:q5km | 5.2 GB | ❌ | Solo preguntas COSMIC |

## OCR (solo ocr_image)
| Servicio | Coste/página | Calidad manuscrito |
|----------|-------------|-------------------|
| mistral-ocr-latest | $0.001 | ★★★★½ |
```

Esta nota la puede leer el agente cuando el usuario pregunte "¿qué modelo uso para X?". PERO TAMPOCO ES IMPRESCNDIBEL ES PARA TI Y PARA MI CREANDO CODIGO Y APP Y ESTANDO OBSOLETOS, CREAMOS MIERDA CON MODELOSMIERDA ANTIGUAS!!! 

---

## 7. PLAN CEREBRITO DURGA — Arquitectura completa

### Qué es Durga
**Durga** = capa de orquestación multi-agente sobre Cerebrito Core.
Mientras Cerebrito Core es 1 agente con tools, Durga coordina N sub-agentes especializados.

Inspiración: Karpathy (LLM como compilador, no buscador) + OpenMind Nate (workflows con memoria persistente).

### Principios de diseño
1. **Prompt-first:** cambiar de vertiente = cambiar el perfil .md, sin recompilar
2. **Tool-first:** el agente nunca inventa datos — siempre usa tools
3. **Local-first:** máximo 8-10 GB disco, sin Docker para usuario final
4. **Privacy-configurable:** modo local (Ollama) o modo API con aviso
5. **Portable:** .exe + .bat + vault = copiar carpeta = funciona
6. **Modelo-agnóstico:** cualquier modelo en BMO → proxy enruta
CUANDO VOY A TENER ALGO ASI DE POTENTE POR FIN!!!? DESPUES DE NMIG ANJEL Y YAYAO? PERO VAMOS , DEBEMOS HACERLO ROBUSTO!!! QUE NO ALUCINE QUE NO FALLLE  QUE SEA INDESTRUCTIBLE Y FACIL! Y SOBRE TDO - UTIL!
### Capas de Durga

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA 0: INTERFAZ                      │
│  Obsidian + BMO Plugin (chat, perfiles, selector modelo) O INCLUSO IU PROPIA!!!!  │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                 CAPA 1: ORQUESTADOR                       │
│  Durga (FastAPI 27182) — recibe mensaje, decide workflow  │
│  - Analiza intención: ¿es OCR? ¿búsqueda? ¿redacción?   │
│  - Enruta a sub-agente o responde directamente           │
│  - Gestiona memoria Kuzu + conversación                  │
└─────┬──────────┬──────────┬──────────┬──────────┬───────┘
      │          │          │          │          │
   NANO-1     NANO-2     NANO-3     NANO-4     NANO-5
  Buscador  Escritor   Lector    Extractor   Indexador
 (internet) (notas)   (PDF/OCR) (entidades) (Kuzu/wiki)
```

### Sub-agentes (nanos) — todos son prompts + tools, NO código nuevo

| Nano | Función | Tools que usa | Modelo recomendado |
|------|---------|---------------|-------------------|
| **Buscador** | Web search, Scholar, PubMed | search_internet, fetch_url | mistral-small (barato) |
| **Escritor** | Crear/editar notas, redactar | create_obsidian_note, update_obsidian_note, run_template | mistral-large o claude |
| **Lector** | OCR, PDF, DOCX, imágenes | read_pdf, ocr_image, read_docx, ocr_batch_folder | mistral-small |
| **Extractor** | Entidades, relaciones → Kuzu | find_similar_notes + LLM extraction | deepseek (barato) |
| **Indexador** | Mantener wiki, fichas, Kuzu | ingest_file, create_summary, generate_esquema | mistral-small |
| **Quiz/Estudio** | Flashcards, test, repaso | generate_quiz, create_summary | groq (gratis) |

**CLAVE:** Los nanos son prompts del sistema + tools. El cambio de vertiente es solo el prompt del Orquestador + los prompts de cada nano. El código no cambia.

### Vertientes como configuración

```yaml
# vertiente_investigador.yaml
nombre: Investigador Hitita
orquestador: Eres un asistente de investigación histórica especializado en...
nano_escritor: Usa terminología académica, cita fuentes, formato APA...
nano_buscador: Prioriza Google Scholar, JSTOR, academia.edu...
kuzu_schema: personajes, lugares, artefactos, fuentes, relaciones_cronologicas
carpetas_vault: [00_LIBRO, 01_CRUDO/apuntes_mano, 02_WIKI/arqueologia, 04_INVESTIGACION]
modelos_recomendados:
  default: mistral:mistral-large-latest
  batch: deepseek:deepseek-chat
  ocr: mistral-ocr-latest
  local: ollama:mistral-local:latest
```

Cambiar de "escritor novela" a "arqueólogo" = cambiar el YAML + perfil BMO. ESTO ME GUSTA, Y DE LOS AGENTES TAMBIEN!

### Workflows predefinidos

| Workflow | Trigger | Pasos |
|---------|---------|-------|
| **Ingesta manuscritos** | "procesa mis notas" | ocr_batch → ingest_file × N → extract_entities → update_kuzu |
| **Investigación** | "busca artículos sobre X" | search_scholar → fetch_url × 3 → create_summary → create_obsidian_note |
| **Escritura asistida** | "escribe capítulo sobre X" | find_similar_notes → kuzu_query → write_chapter → save_note |
| **Revisión** | "revisa coherencia de X" | read_note → kuzu_query → LLM_review → update_note |
| **Mapa mental** | "crea mapa de X" | find_similar_notes → LLM_mindmap → create_obsidian_note (formato Markdown) | O DEXCAIDRAW!

---

## 8. Templates que faltan (para Miguel y Durga)

### Actuales en Miguel (17): ficha_personaje, ficha_lugar, etc.
### A añadir:

| Template | Para qué |
|----------|----------|
| `ficha_fuente.md` | Referencia bibliográfica (autor, año, ISBN, notas) |
| `ficha_artefacto.md` | Objeto arqueológico (nombre, período, yacimiento, descripción) |
| `ficha_evento.md` | Evento histórico (fecha, lugar, actores, consecuencias) |
| `mapa_mental.md` | Mapa mental en Markdown (niveles indentados, sin Mermaid) |
| `nota_campo.md` | Nota de sesión de investigación (fecha, fuentes consultadas, hallazgos) |
| `cronologia_tema.md` | Timeline de un tema específico |
| `resumen_articulo.md` | Resumen académico (abstract, tesis, metodología, conclusiones, CITAS) |

---

## 9. Bug textarea BMO — hipótesis pendientes

Los 6 intentos fallidos están documentados en `03_06_2026_MEMORIA_SESION.md`.

### Hipótesis 1 (PROBAR): workspace.setActiveLeaf
```typescript
// En onOpen() al final, forzar activación del leaf a nivel workspace
const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_CHATBOT)[0];
if (leaf) {
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
}
```

### Hipótesis 2 (PROBAR): dispatchEvent resize
```typescript
// Simular el minimize/maximize que sí funciona
setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
}, 200);
```

### Hipótesis 3: ¿Es solo el sidebar derecho?
Si el problema es específico del right sidebar de Obsidian (no del left), es un bug conocido de Obsidian con los `ItemView` en el right sidebar que no reciben foco correctamente hasta que se redimensiona la ventana.
Fix alternativo: mover BMO al left sidebar o al main panel (tab). vaya, puto obsidian, es malo de cojones , a ver lo que hacemos...

**Para quien pruebe esto:** No toques view.ts más de lo necesario. El problema está en la interacción Obsidian workspace ↔ leaf ↔ DOM input.

---

## 10. Plan de implementación por fases

### Fase INMEDIATA (esta semana)

| Tarea | Prioridad | Tiempo est. |
|-------|-----------|------------|
| Fix bug Groq .env (investigar por qué no lee variables) | CRÍTICO | 2h |
| Fix bug Mistral alucina tras primer o segundo mensaje y poco context widow | CRÍTICO | 2h |
| ocr_batch_folder tool en proxy | ALTA | 3h |
| Carpetas vault expandido Miguel | MEDIA | 1h |
| Templates faltantes Miguel (7) | MEDIA | 1h |
| mini-wiki modelos en vault OPOS_PROJECT SOLO!! | BAJA | 30min |

### Fase KUZU (1-2 semanas)

| Tarea | Prioridad | Tiempo est. |
|-------|-----------|------------|
| Integrar Kuzu en cerebrito-backend (nuevo repo) | ALTA | 1 día |
| Tool kuzu_query en proxy IUSO CYPHER ETC. | ALTA | 4h |
| Tool extract_entities (→ Kuzu) | MEDIA | 4h |
| Migrar Miguel Angel a cerebrito-backend | MEDIA | 4h |

### Fase DURGA (1 mes)

| Tarea | Prioridad | Tiempo est. |
|-------|-----------|------------|
| Orquestador Durga (FastAPI 27182) | ALTA | 3 días |
| 4 nanos básicos (, ORQUESTADOR(INTENCION DEL PROMPT), Buscador, Escritor, Lector) | ALTA | 2 días |
| Sistema de workflows | MEDIA | 2 días |
| Configuración vertientes YAML | MEDIA | 1 día |
| Integración Scholar/PubMed search | MEDIA | 1 día |

---

## 11. Tamaño en disco (objetivo ≤10 GB)

| Componente | Tamaño |
|-----------|--------|
| AgenteEscritor.exe | 23 MB |
| Obsidian | 300 MB |
| Obsidian vault (notas + plugins) | ~50-200 MB |
| Kuzu BD (grafo novel completa) | ~50 MB |
| Ollama (si se instala) | nomic-embed-text: 274 MB, mistral-local: 4.1 GB - ES PRESCINDIBLE, TAMPOCO ES BUENO Y ES LENTO CON CPU SOLO|
| **Total sin Ollama** | **~600 MB** ✅ |
| **Total con Ollama básico** | **~1.2 GB** ✅ |
| **Total con Ollama + mistral-local** | **~5.3 GB** ✅ |

**Todos dentro del objetivo de 8-10 GB.** ✅ 
TEN EN CUENTA QUE ES PARA UN PORTATILDECENTE NO HAY PROBLEMA HAY PROGRAMAS MUUUCHO MAS GRANDES! RDITORES DE VIDEO IMAGENES ETC. 

---

## 12. Próximas acciones concretas

```
[ ] Investigar bug Groq .env no leído (comparar env loading entre vaults)
[ ] Investigar Mistral alucina tras primer mensaje (¿_sanitize_messages roto?)
[ ] Implementar ocr_batch_folder con resume + rate limiting
[ ] Rebuild exe y deploy a 3 vaults
[ ] Actualizar vault Miguel: carpetas nuevas + templates faltantes
[ ] Crear 00_SISTEMA/modelos_disponibles.md en 3 vaults
[ ] Probar hipótesis BMO textarea: workspace.setActiveLeaf + resize event
[ ] Crear repo cerebrito-backend con Kuzu básico
```

---

## Referencias

- PRD Cerebrito: `docs_planes/prd_cerebrito.md`
- Decisiones descartadas: `OPOS_PROJECT/02-Decisions/`
- Memoria sesión 03/06: `docs_planes/03_06_2026_MEMORIA_SESION.md`
- Bug BMO textarea (6 fixes fallidos): `docs_planes/03_06_2026_MEMORIA_SESION.md#3`
- Conversación Gemini FalkorDB: `docs_planes/GEM_CONVERS_FALCONBD.md`
- VAMOS A MEJORASR ESTE PLAN HASTA QUE SEA PERFECTO!!!