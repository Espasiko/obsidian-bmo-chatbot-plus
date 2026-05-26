# Product Brief — Cerebrito (BMO Chatbot Plus)

**Autor:** Spas
**Fecha:** 26/05/2026
**Version:** 1.1
**Estado:** DECISIONES FIRMES

---

## 1. El producto en una frase

**Cerebrito** convierte Obsidian en un segundo cerebro con IA: un asistente que lee tus notas, PDFs y documentos, aprende de cada conversacion, y se adapta a tu dominio — oposiciones, escritura, estudio, negocio.

---

## 2. El problema

Los asistentes IA actuales (ChatGPT, Claude, Gemini) son genéricos y sin memoria. No conocen tus notas. No recuerdan conversaciones pasadas. No pueden leer tus PDFs. No ejecutan herramientas reales. Y cada vez que cambias de modelo, pierdes todo el contexto.

Obsidian tiene plugins de IA (BMO, Copilot, Smart Connections), pero:
- Ninguno tiene herramientas reales (leer/crear/borrar notas, extraer PDFs)
- No aprenden entre sesiones
- Configurarlos es complicado para un usuario no técnico
- No hay forma de cambiar de modelo sin perder las herramientas

---

## 3. La solucion

Un fork del plugin BMO Chatbot (MIT) conectado a un backend Python que:

1. **Habla con cualquier LLM** (Mistral, Groq, Gemini, DeepSeek, Claude, HF, OpenRouter, OpenAI, Ollama local) gracias a la abstraccion **Capability** que traduce a tools/skills/agents segun cada framework
2. **Tiene herramientas reales** que el LLM usa automaticamente:
   - Leer, crear, editar, borrar, mover notas
   - Extraer texto de PDFs y DOCX (cascada: pypdf → Mistral OCR cloud → EasyOCR local)
   - Buscar en internet (Tavily gratis + DuckDuckGo fallback)
   - Consultar base de conocimiento (Kuzu embebido o Neo4j para opos)
   - Busqueda semantica via Smart Connections (no reimplementada)
3. **Aprende y recuerda** via grafo de conocimiento (Kuzu) + wiki cache que reduce **~68% de tokens** (validado empiricamente)
4. **Se adapta** al dominio via perfiles + `verification_level` por vertiente (estricto opos/abogados, soft escritores)
5. **Es facil de usar** — un exe + un bat + un vault preconfigurado. Zero config.

### Estructura de productos (decision firme 26/05/2026)

| SKU | Para quien | Tamano | Sin Docker |
|-----|------------|-------:|:---------:|
| **Cerebrito Core Lite** | Escritores, estudiantes, autonomos, generico | ~50 MB | ✅ |
| **Cerebrito Core Privacy** | Abogados, casos confidenciales (EasyOCR local) | ~180 MB | ✅ |
| **Cerebrito OPOS Pack** | Opositores SS (Neo4j Desktop) | ~700 MB | ✅ |
| **Cerebrito OPOS Server** | Power users opos (Docker) | ~3 GB | ❌ |

---

## 4. Usuarios objetivo

| Quien | Que necesita | Tamano mercado |
|---|---|---|
| **Opositores** (SS, AGE, justicia, policia) | Estudiar leyes, hacer examenes, verificar articulos | ~200.000 opositores/ano en Espana |
| **Escritores** (ficcion, no-ficcion, guionistas) | Organizar personajes, tramas, investigar, revisar capitulos | Millones globalmente |
| **Estudiantes** (universidad, bachillerato, idiomas) | Resumenes, flashcards, quizzes, spaced repetition | Mercado masivo |
| **Abogados y juridicos** | BOE tiempo real, jurisprudencia, consultas legales | ~150.000 abogados en Espana |
| **Autonomos y PYMEs** | IRPF, RETA, facturas, mini CRM, analisis negocio, predicciones | ~3.4M autonomos en Espana |
| **Investigadores** | Literature review, citation management, analisis semantico | Nicho alto valor |

**Modelo de negocio (TBD post-MVP, decision 26/05/2026):**

Pricing definitivo se estudiara tras MVP + analisis de competencia. Estructura provisional basada en `Modelo_Negocio_3_SKUs_28_04_2026`:

- **Gratis**: uso local con Ollama (sin API keys, sin coste)
- **Freemium BYOK**: el usuario trae su propia key de Mistral/Groq/etc.
- **Premium**: key incluida, soporte, perfiles especializados (~9-19 EUR/mes provisional)
- **Vault Premium .zip+.exe**: producto fisico digital con vault pre-cargado (precio one-time)
- **API B2B**: para academias y bufetes (futuro)

### Licencia (decision firme 26/05/2026)

**Dual licensing:**
- **Plugin BMO Chatbot Plus (TypeScript)** → MIT (atribucion a longy2k original)
- **Backend Cerebrito (Python)** → Commercial / propietario
- **Vaults pre-cargados** (BOVEDA_OPOS, Cerebrito_Vault) → Propietario

Razon: el valor no esta en el chat (eso lo copia cualquiera), sino en **vault + tools + Kuzu + datos pre-cargados**.

---

## 5. Componentes del sistema

```
┌─────────────────────────────────────────────────┐
│                  OBSIDIAN                        │
│  ┌───────────────────────────────────────────┐  │
│  │         BMO Chatbot Plus (plugin)         │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────┐  │  │
│  │  │ Chat UI │  │ Sidebar  │  │ Selector│  │  │
│  │  │ + input │  │ convs.   │  │ modelo  │  │  │
│  │  │ + @ / # │  │ + buscar │  │ + estado│  │  │
│  │  └────┬────┘  └──────────┘  └─────────┘  │  │
│  └───────┼───────────────────────────────────┘  │
│          │ POST /v1/chat/completions             │
│  ┌───────▼───────────────────────────────────┐  │
│  │     Local REST API plugin (27123)          │  │
│  └───────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────┘
                       │
         ┌─────────────▼─────────────────┐
         │    BACKEND Python (FastAPI)    │
         │                               │
         │  ┌─────────────────────────┐  │
         │  │ Router LLM multi-modelo │  │
         │  │ @mistral @groq @gemini  │  │
         │  │ @deepseek @ollama       │  │
         │  └───────────┬─────────────┘  │
         │              │                │
         │  ┌───────────▼─────────────┐  │
         │  │    Tools compartidos    │  │
         │  │ vault_tools (CRUD)      │  │
         │  │ pdf_tools (extract)     │  │
         │  │ search_tools (web)      │  │
         │  │ graph_tools (kuzu/neo4j)│  │
         │  │ legal_tools (boe/calc)  │  │
         │  └─────────────────────────┘  │
         │              │                │
         │  ┌───────────▼─────────────┐  │
         │  │   Kuzu (grafo embebido) │  │
         │  │   Aprendizaje continuo  │  │
         │  └─────────────────────────┘  │
         └───────────────────────────────┘
```

---

## 6. Exigencias de mejora UI (plugin BMO)

### 6.1 Problemas actuales del plugin BMO

| Problema | Impacto |
|---|---|
| Sidebar de conversaciones se descuadra en ventanas estrechas | UX rota, texto cortado, layout superpuesto |
| Desplegable de modelos muestra TODOS los modelos de TODOS los proveedores mezclados | Confuso, el usuario ve 30+ modelos cuando solo necesita 2-3 |
| No hay forma de cambiar perfil/agente desde el chat | Hay que ir a Settings cada vez |
| No hay indicador de si el backend esta conectado | El usuario no sabe si funciona hasta que escribe |
| No hay feedback visual de que herramientas se usaron | El usuario no sabe si se leyo un PDF o se busco en internet |
| El input de texto es basico | No hay autocompletado de prefijos, no hay boton de opciones |

### 6.2 Mejoras exigidas

**CRITICAS (Fase 1):**
- [ ] Fix CSS sidebar: overlay correcto en ventanas estrechas, no empujar contenido fuera de pantalla
- [ ] Filtrar modelos: solo mostrar los modelos del proveedor activo (REST API, Ollama, o el que tenga key)
- [ ] Indicador de conexion: punto verde/rojo en el header

**IMPORTANTES (Fase 2):**
- [ ] Prefijos `@modelo` en el input con autocompletado
- [ ] Boton `+` en la barra de input: menu con modelos, perfiles, herramientas
- [ ] Feedback de tools: icono o linea tipo "[leer PDF...] [buscar internet...]" antes de la respuesta
- [ ] Selector visual de modelo LLM independiente del agente (header o menu)

**DESEABLES (Fase 3):**
- [ ] Cambio de perfil desde el chat (`/perfil-nombre`)
- [ ] Invocacion directa de herramientas (`#leer-pdf archivo.pdf`)
- [ ] Workflows predefinidos (`*modo-examen`, `*revisar-capitulo`)
- [ ] Dashboard de conocimiento Kuzu: cuantas entidades, relaciones, temas
- [ ] Tema visual por perfil (colores, icono del asistente)

### 6.3 Principio de diseno

**El usuario final (Nina, Miguel Angel, un opositor, un estudiante) NO es tecnico.**
- Cero terminologia tecnica en la UI
- Cero configuracion obligatoria (todo viene preconfigurado)
- Si algo falla, mensaje claro en espanol (no "ERR_CONNECTION_RESET")
- Los modelos se presentan por nombre amigable ("Rapido", "Preciso", "Local/Privado"), no por ID tecnico

---

## 7. Diferenciadores vs competencia

| Competidor | Limitacion | Cerebrito |
|---|---|---|
| ChatGPT / Claude web | No conoce tus notas, no tiene memoria persistente | Lee tu vault, aprende con Kuzu, **68% menos tokens** |
| Obsidian Copilot | Licencia problematica, sin tools reales | Fork MIT, tools vault + PDF (cascada OCR) + web |
| BMO original | Solo chat basico, sin herramientas | Fork con tools, multi-chat, perfiles, anti-alucinacion |
| Notion AI | Cerrado, sin control de datos | 100% local, tus datos en tu disco, modo Privacy con EasyOCR |
| Smart Connections | Solo busqueda semantica, no chat con tools | Chat + tools + busqueda + grafo + Smart Connections integrado |
| LangChain / Crew AI | Para devs, no para usuarios finales | Capability framework abstrae tools/skills/agents al usuario |
| Soluciones legales SaaS | Sin verificacion BOE en tiempo real | Chandra + Tier 1-3 verification + cita BOE obligatoria |

### Demo killer feature

Cerebrito puede mapear **cualquier codebase**, no solo notas. Demo: usar el grafo Graphify del proyecto OPOS (164 comunidades, 2010 nodos, 2938 edges) como prueba viva — *"Cerebrito sabe explicar su propio codigo"*.

---

## 8. Riesgos principales

| Riesgo | Mitigacion |
|---|---|
| Obsidian cambia API de plugins | Fork nuestro, podemos adaptar |
| APIs de LLM cambian precios | Multi-proveedor + Ollama local como fallback gratuito |
| PyInstaller bloqueado por antivirus | Instrucciones de excepcion + futura firma de exe |
| Complejidad de UI crece demasiado | Principio: simple por defecto, power-user features ocultas |
| Privacidad de datos | Aviso claro cuando se envian datos a LLM externo, modo Ollama = 100% local |

---

## 9. Metricas de exito v1.1

| Metrica | Objetivo | Como medir |
|---|---|---|
| Nina chatea sin ayuda Spas | 1 semana | Telemetria local Niveles 1+2 |
| Miguel Angel crea vault y usa | 2 semanas | Telemetria + entrevista |
| Cambio modelo sin reiniciar | 100% | Test E2E |
| PDF extraido correctamente | > 95% (cascada pypdf+Mistral OCR+EasyOCR) | Test academias OPOS |
| Respuesta < 10s sin tools | Baseline medida | Telemetria session_duration |
| Kuzu retiene info entre sesiones | Test 3 dias | Manual |
| **Ahorro tokens via wiki/Kuzu** | > 60% | Validado 68% en pruebas D:\OPOS_PROJECT |
| **0 errores criticos primera semana** | 0 crashes | Telemetria error_occurred |

---

## 10. Entregables (4 SKUs)

1. **Plugin BMO Chatbot Plus** (MIT) — fork con UI mejorada, prefijos, Capability framework, anti-alucinacion configurable
2. **Backend Cerebrito** (Commercial) — FastAPI puerto 27182 con tools universales, multi-modelo, Kuzu, telemetria local
3. **Backend OPOS Chandra** (existente, separado) — FastAPI puerto 8080, Neo4j, 7 tools, verification Tier 1-3
4. **shared-tools** (submodulo git) — codigo comun reutilizable entre ambos backends
5. **Cerebrito_Vault** (plantilla generica) — estructura universal, perfiles, prompts
6. **Vault Miguel Angel Hititas** (Fase 4.1) — clon Nina + perfil novela historica
7. **Paquetes distribuibles**:
   - Cerebrito Core Lite (~50 MB)
   - Cerebrito Core Privacy (~180 MB con EasyOCR)
   - Cerebrito OPOS Pack (~700 MB)
   - Cerebrito OPOS Server (~3 GB)
8. **PRD v1.1 + Product Brief v1.1 + Project Overview v1.1** — documentacion BMAD completa con decisiones firmes

---

*Documento generado el 25/05/2026, actualizado a v1.1 el 26/05/2026 por Spas + Cascade.*
