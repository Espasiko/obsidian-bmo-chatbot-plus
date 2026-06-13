---
tipo: plan + investigacion
fecha: 2026-06-13
estado: PROPUESTA — NO aplicado (a espera de OK de Spas)
componente: proxy AgenteEscritor + perfil Investigador (Miguel Ángel)
---

# 13/06/2026 — Más herramientas para el Investigador + ¿es vendible?

> Base: nota de Miguel `02_WIKI/OTROS/sitios_Bdatos_webs_IA-s_y_API-s_para_el_oriente_medio.md`.
> Todas las APIs de abajo PROBADAS el 13/06 salvo donde se indique. **Plan NO aplicado aún.**

---

## 1. APIs académicas gratuitas (candidatas a tools)

| API | Key | Probada 13/06 | Qué da | Tool propuesto |
|-----|-----|---------------|--------|----------------|
| **OpenAlex** | NO | ✅ 200 (devolvió Cline 1177 BC, Kaniewski, Bryce con DOI) | 250M+ papers: título, autores, año, **DOI**, abstract, citas | **`buscar_papers`** (PRIORITARIO) |
| **Zenodo** | NO | ✅ 200 (Mercimektepe Höyük 2025, Royal Hittite Religion 2024) | datasets, modelos 3D de artefactos, preprints, OA | `buscar_datasets` (opcional) |
| **Pleiades** | NO | ✅ 200 (JSON por lugar) | gazetteer de lugares antiguos: coords, nombres, periodos, refs | `buscar_lugar` (opcional) |
| **Semantic Scholar** | recomendada (gratis) | ⚠️ BÚSQUEDA 429 sin key · DOI directo ✅ 200 | citas, influencia, "citado por" | FUERA del buscador; enriquecer por-DOI |

> **Matiz Semantic Scholar (probado 13/06):** sin key, la **búsqueda por texto** (`/paper/search`) da
> **429** (pool keyless saturado). Pero la **consulta directa por DOI** (`/paper/DOI:...`) **funciona (200)**
> — devolvió "Environmental Roots of the Late Bronze Age Crisis (2013), 208 citas". La key es solo para
> académicos/organizaciones (no Gmail particular). **Decisión:** S2 FUERA de `buscar_papers` (usamos OpenAlex
> para buscar). Uso futuro opcional: tras encontrar un paper con OpenAlex, llamar a S2 **por su DOI** (sin key)
> para añadir nº de citas / papers influyentes.
| **Crossref** | NO | (conocida) | metadatos DOI de cualquier editorial | alternativa a OpenAlex |
| **CORE / BASE** | CORE sí (gratis) | (conocidas) | textos completos open access | futuro |

### Las 3 que "descarté a la primera" — para qué sirven
- **Pleiades** (gazetteer de lugares antiguos): da **coordenadas + periodos + referencias** de ciudades/yacimientos. Encaja con la novela de Miguel (mapas, geografía hitita). API JSON por lugar limpia. *No es para bibliografía, es para geografía.*
- **Semantic Scholar**: como OpenAlex pero fuerte en **grafo de citas e influencia** ("quién cita a quién", papers más influyentes). Gratis pero **rate-limited sin key**; con key gratis va fino. Complementa a OpenAlex, no lo sustituye.
- **Zenodo** (repositorio del CERN): **datasets, escaneos 3D de artefactos, preprints y libros OA**. Útil para material primario digital y datos de excavación, no tanto para bibliografía clásica.

---

## 2. ¿Dónde sacar bibliografía de arqueología e historia?

| Capa | Fuentes |
|------|---------|
| **Buscadores OA (con API)** | OpenAlex, Crossref, Semantic Scholar, CORE, BASE |
| **Libros académicos OA** | OAPEN, DOAB (clave en humanidades, que es muy de monografías) |
| **Datasets / 3D / preprints** | Zenodo, Archaeology Data Service (ADS), tDAR |
| **Dominio Oriente Próximo** (ya en la nota de Miguel) | CDLI, ORACC, ETCSL, CAD, BDTNS, Amarna Project, CCP |
| **Geografía antigua** | Pleiades, Pelagios |
| **De pago / suscripción** (verificación manual, no API libre) | JSTOR, L'Année Philologique, Brepols, Scopus, Web of Science |

**Regla de oro para el agente:** descubrir y verificar con OpenAlex/Semantic Scholar (DOI real) → solo
citar SIN DOI con "→ VERIFICAR". Las de pago se citan pero marcando verificación manual.

---

## 3. Tools propuestos (SOLO para el Investigador de Miguel)

Enfoque **prompt-first**: el tool se registra en el proxy (global), pero **solo se documenta/instruye
en `Investigador.md`**. Los demás agentes (Edi, Nina, Yayo) no lo llaman porque su prompt no lo menciona.

1. **`buscar_papers(query, limite=5)`** → OpenAlex. Devuelve título · autores · año · DOI · abstract.
   *Mata el problema de citas inventadas: da la referencia real con DOI.* **PRIORITARIO.**
2. `buscar_lugar(nombre)` → Pleiades. Coords + periodos + refs de un sitio antiguo. (opcional)
3. `buscar_datasets(query)` → Zenodo. Datasets/3D/preprints OA. (opcional)

---

## 4. Plan de implementación (ADITIVO, bajo riesgo) — NO aplicado

1. **Proxy** (`proxy_agente_escritor.py`): añadir `buscar_papers(query, limite)` (calcada de
   `search_internet`, pero a `https://api.openalex.org/works?search=...&mailto=...`). Registrar en
   `names_to_functions` + schema `tools`. NO tocar nada existente.
2. **NO** meterla en `build_critical_context` (así no sale para todos los agentes).
3. **Perfil `Investigador.md`**: añadir `buscar_papers` a su tabla + regla ("para bibliografía usa
   `buscar_papers`; solo cita sin DOI con → VERIFICAR").
4. Verificar sintaxis → rebuild Docker → deploy. (Mismo exe a los 3; solo Miguel lo usa por prompt.)
5. **Seguridad:** backup `.exe` + proxy; 100% aditivo; OpenAlex ya probado; revert en 1 min si falla.
6. (Opcional, mismo rebuild) `buscar_lugar` (Pleiades) y/o `buscar_datasets` (Zenodo).

**Coste:** 0 € (sin keys). **Riesgo:** mínimo (funciones nuevas e independientes).

---

## 5. ¿Se puede vender? Investigación de mercado (jun 2026)

### Competencia que YA existe
- **Asistentes IA de investigación (SaaS cloud, maduros y abundantes):** Elicit (138M papers, revisión
  sistemática a escala), Consensus (evidencia), SciSpace (paper a paper), Scite (verificación de citas),
  ResearchRabbit / Connected Papers / Litmaps (grafos de citas / descubrimiento), NotebookLM (corpus
  cerrado), Paperpal. **El mercado está MUY poblado y segmentado** (descubrir / revisar / verificar / sintetizar).
- **Obsidian + Zotero + LLM (nuestro terreno):** existe pero **fragmentado y técnico** — plugins ZotLit,
  Zotero Desktop Connector, `llm-for-zotero` (agente sobre tu Zotero), pipelines Zotero+Obsidian+LM Studio
  (offline) o +NotebookLM. Casi todo **centrado en Zotero** y para usuarios que saben montárselo.

### El hueco (nuestra diferenciación real)
Nadie empaqueta, **llave en mano y para NO-técnicos de humanidades/arqueología**, esto:
> "Echa tus **apuntes a mano** (fotos) y PDFs a una carpeta → el agente los **OCR-iza**, construye un
> **grafo** de personajes/lugares/hallazgos, busca **citas reales** (OpenAlex), y te **escribe las fichas**
> en tu propio vault, **local y privado**."

Los SaaS son cloud (tus datos salen, suscripción, enfocados a STEM/medicina). Las soluciones Obsidian son
DIY técnicas y Zotero-céntricas. **El arqueólogo/historiador/periodista no-técnico que tiene libretas
manuscritas y quiere un segundo cerebro local NO está bien servido.** Ese es el vertical "Investigador"
de Cerebrito-Durga.

### Veredicto
- **SÍ es vendible, pero como NICHO**, no como "otro Elicit" (ahí llegamos tarde y sin recursos).
- Diferenciadores: **local-first / privado · OCR de manuscritos y trabajo de campo · grafo de conocimiento ·
  no-techie (instalar = copiar carpeta) · humanidades** (no STEM).
- Riesgos: el espacio se mueve rápido; depender de APIs de terceros; soporte a no-técnicos.
- Siguiente paso comercial (cuando toque): validar con 2-3 investigadores reales (Miguel + arqueólogos/
  periodistas) antes de invertir; precio tipo licencia única o suscripción baja; posicionar como
  "segundo cerebro de investigación local", no como buscador de papers.

---

## 5b. Tavily — qué más ofrece (investigado 14/06, NO aplicado)

Ya usamos Tavily `search` en modo `basic`. Tiene mucho más:
- **Research (Create & Get Tasks)**: busca + analiza fuentes + genera **informe CITADO** (Perplexity/Deep Research). Async (crear tarea → consultar por ID), con streaming. → futuro tool `investigar_tema(query)`. Lo más potente; gasta más créditos.
- **Search params sin usar**: `include_answer` (respuesta sintetizada = Perplexity-lite, síncrona, casi gratis), `search_depth:"advanced"` (más contexto), `include_raw_content`, `chunks_per_source`.
- **Extract**: markdown limpio de URLs (mejor que `fetch_url`+DuckDuckGo). → futuro `extraer_web(url)`.
- **Crawl / Map**: recorrer/mapear un sitio entero.
- Plan gratis: 1.000 créditos/mes; Search/Extract con modo keyless.

**Recomendación (orden):** (1) tool `investigar_tema` con Tavily Research; (2) añadir `include_answer`
a `search_internet`; (3) `extraer_web` con Tavily Extract. PENDIENTE de OK de Spas.

## 6. Estado — APLICADO 13/06/2026
- ✅ **`buscar_papers`** (OpenAlex) implementado en el proxy + registrado + schema + documentado en `Investigador.md`. **Probado**: devuelve papers reales con DOI.
- ✅ **`buscar_datasets`** (Zenodo, `sort=bestmatch`) implementado igual. **Probado**: "Royal Hittite Religion", "Great Temple of Hattusa".
- ⏸️ **`buscar_lugar`** (Pleiades) **DIFERIDO**: su búsqueda por nombre no tiene endpoint JSON limpio (solo por ID/DOI). Pendiente: implementarlo vía RSS-search + parseo, o vía Pelagios/Peripleo, cuando se valide un endpoint robusto. El lookup por ID sí funciona.
- ✅ Ambos tools son **aditivos** y solo se documentan en el perfil Investigador (los demás agentes no los usan). NO se metieron en `build_critical_context`.
- Rebuild + deploy a los 3 vaults (mismo exe; solo Miguel los usa por prompt).
- Pendiente futuro: enriquecer por-DOI con Semantic Scholar (sin key, funciona) para nº de citas.
- Relacionado: `PLAN_CEREBRITO_DURGA_05_06_26.md` (vertical Investigador), `06_06_26_sesion_listo.md` (perfil Investigador ya creado), nota de fuentes de Miguel.
