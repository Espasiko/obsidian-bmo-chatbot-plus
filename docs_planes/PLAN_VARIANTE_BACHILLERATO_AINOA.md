---
tipo: plan
estado: BORRADOR v2 — NO EJECUTAR TODAVÍA
fecha: 2026-06-01
prioridad: alta
ambito: variante_bachillerato
cliente: Ainoa
asignatura_inicial: Historia de España (2º Bachillerato Artes, EASD Almería)
adaptable_a: cualquier asignatura de Bachillerato
related:
  - "[[prd_cerebrito]]"
  - "[[AgenteEscritor_Proxy]]"
  - "[[31_05_2026_MEMORIA_HECHO]]"
  - "[[28_05_2026_MEMORIA_PROBLEMAS_CLAUDE]]"
tags: [plan, bachillerato, historia, ainoa, yayo, estudiante, pevau, pendientes]
---

# Plan — Variante Bachillerato: Vault de Estudio para Ainoa

> **Objetivo:** Crear un vault de estudio asistido por IA para Ainoa (estudiante de 2º
> Bachillerato de Artes en la EASD Carlos Pérez Siquier, Almería), especializado inicialmente
> en **Historia de España**, reutilizando el mismo stack del AgenteEscritor (proxy + BMO + tools).
>
> **Producto mínimo:** Ainoa abre Obsidian, habla con "Yayo" (su tutor IA), y obtiene
> resúmenes, esquemas, fichas de repaso, simulacros de examen y estrategia de estudio —
> todo basado en el temario oficial de Andalucía y los criterios del centro.
>
> **Escenario real:** Ainoa necesita aprobar la asignatura de **pendientes** del curso.
> NO se presenta a la PEvAU (Selectividad) este año. El examen de pendientes lo pone el
> profesor del centro (EASD), no la Junta de Andalucía. Pero el temario es el mismo,
> así que preparar con rigor el temario oficial le garantiza aprobar pendientes Y le
> deja preparada por si se presenta a PEvAU en el futuro.
>
> **Principio clave:** Adaptable después a otras asignaturas. El vault y el perfil Yayo son
> la plantilla; solo cambia la wiki de contenidos y los templates.

---

## 0. Lecciones aprendidas (LEER ANTES de ejecutar)

De `28_05_2026_MEMORIA_PROBLEMAS_CLAUDE.md`:

| Error | Cómo evitarlo |
|-------|---------------|
| **Plugin fantasma en community-plugins.json** | Verificar que cada entrada tiene su carpeta en `plugins/`. Nunca añadir IDs sin el plugin instalado |
| **textarea BMO bloqueado por preventEnter** | Ya arreglado en el main.js actual. No revertir el fix del `.catch()` |
| **Puerto 8000 ocupado por svchost** | Siempre usar puerto 9000. No cambiar |
| **Plugins con event listeners que bloquean input** | No instalar smart-chatgpt ni plugins que intercepten textarea |
| **requestUrl de Obsidian rompe con proxy** | Ya migrado a `fetch` nativo en FetchModelResponse.ts |
| **Sync de archivos build→repo, NUNCA al revés** | Editar SIEMPRE `/home/spas/build_agente/proxy_agente_escritor.py` |
| **BMO no recarga perfiles en caliente** | Documentar en LÉEME: "Si cambias perfil, recarga Obsidian" |
| **Smart Connections no indexa solo** | Documentar: "Primera vez → Settings → SC → Re-import sources" |
| **Templater apuntando a carpeta equivocada** | Configurar `templates_folder` en data.json ANTES de entregar |
| **obsidian-git pide user/email** | Configurar `authorName`/`authorEmail` en obsidian-git data.json |

---

## 1. Investigación: El examen de Historia de España en Andalucía

### 1.1 Contexto de Ainoa

- **Centro:** EASD Carlos Pérez Siquier (Escuela de Arte de Almería)
- **Curso:** 2º Bachillerato de Artes (modalidad Artes Plásticas, Imagen y Diseño)
- **Horario:** L-V 08:15–14:45
- **Historia de España:** 4 horas semanales, materia COMÚN (obligatoria para todos)
- **Otras comunes:** Hª de la Filosofía (3h), Lengua y Lit. (3h), Inglés/Francés (3h)
- **Modalidad obligatoria:** Dibujo Artístico II (4h)
- **Situación:** Tiene **pendientes** de Historia de España → examen de recuperación del centro
- **NO** se presenta a PEvAU (Selectividad) este curso

Sources:
- [EASD Carlos Pérez Siquier — Bachillerato de Artes](https://www.eaalmeria.es/estudios/bachillerato-de-artes)

### 1.2 El examen de pendientes vs PEvAU

| | Examen de pendientes (EASD) | PEvAU (Selectividad) |
|---|---|---|
| **Quién lo pone** | Profesor del centro | Junta de Andalucía |
| **Formato** | Varía según el profesor — puede ser test, desarrollo, mixto | Fijo: Bloque A (tema) + Bloque B (cuestiones) |
| **Temario** | El mismo temario oficial LOMLOE | El mismo temario oficial LOMLOE |
| **Duración** | Suele ser 60-90 min | 90 minutos |
| **Nota** | 5/10 para aprobar | Nota media ponderada |

**Estrategia:** Aunque el formato del examen de pendientes varía, dominar el temario oficial
y la técnica de desarrollo/cuestiones le prepara para CUALQUIER formato que le pongan.
El temario es el mismo — lo que cambia es solo la forma de preguntar.

### 1.3 Estructura del examen PEvAU 2025-2026 (referencia para conocer el temario a fondo)

**Duración:** 90 minutos

| Sección | Qué pide | Puntuación | Detalle |
|---------|----------|------------|---------|
| **Bloque A — Tema** | Desarrollar 1 de 4 temas propuestos | 0–5,5 puntos | 2 temas de Agrupación III (s. XIX) + 2 de Agrup. IV-V (s. XX). Elegir solo 1 |
| **Bloque B — Cuestiones** | Responder 3 de 6 cuestiones | 0–4,5 puntos | Cada cuestión: 1 pregunta semiabierta (0,5 pts) + 1 abierta (1 pt) = 1,5 pts × 3 |

**Criterios de corrección del Tema (0–5,5):**
- Localización temporal y espacial: hasta 2 puntos
- Causalidad e identificación de procesos: hasta 2 puntos
- Exposición clara y ordenada: hasta 0,75 puntos
- Vocabulario histórico apropiado: hasta 0,75 puntos

**Penalización ortográfica:**
- Los 2 primeros errores NO penalizan
- A partir del 3º: -0,10 por cada error
- Máximo penalización: 1 punto
- Corrección lingüística pesa mínimo 10% en todas las materias (novedad 2026)

**Cambio CRÍTICO 2026:** Se eliminó la pregunta de desarrollo largo clásica. Ahora se
pide desarrollar un **epígrafe específico** (más concreto, menos memorístico). Y es
**obligatorio dominar AMBOS siglos** (XIX y XX), ya no se puede elegir solo uno.

Sources:
- [Directrices y Orientaciones PEvAU 2025-2026 (PDF oficial Junta de Andalucía)](https://www.juntadeandalucia.es/economiaconocimientoempresasyuniversidad/sguit/examanes_anios_anteriores/selectividad/sel_2025-2026-Orientaciones_historia_espana.pdf)
- [Novedades Selectividad 2026 — Academia Málaga](https://academia-malaga.es/blog/novedades-selectividad/)
- [PEvAU Andalucía exámenes resueltos](https://www.selectividad.academy/examenes/andalucia/historia-de-espana)
- [Exámenes PEvAU Historia — examenesdepau.com](https://www.examenesdepau.com/examenes/andalucia/historia/)

### 1.4 Temario oficial — 12 bloques en 5 agrupaciones

#### Agrupación I (Antigüedad–Edad Media) — para cuestiones breves
| Bloque | Periodo | Contenido |
|--------|---------|-----------|
| 1 | Prehistoria–711 | Hominización, pueblos prerromanos, colonizaciones (fenicios, griegos, cartagineses), Hispania romana, reino visigodo |
| 2 | 711–1474 | Al-Ándalus (emirato, califato, taifas), reinos cristianos, reconquista, Corona de Aragón, rutas atlánticas |

#### Agrupación II (Edad Moderna) — para cuestiones breves
| Bloque | Periodo | Contenido |
|--------|---------|-----------|
| 3 | 1474–1700 | Reyes Católicos, unión dinástica, descubrimiento de América, Carlos V (Comunidades, Germanías), Felipe II, Austrias menores, gobierno de validos, crisis 1640, Siglo de Oro |
| 4 | 1700–1788 | Guerra de Sucesión, Utrecht, reformas borbónicas, despotismo ilustrado, Ilustración española |

#### Agrupación III (Siglo XIX) — para temas de desarrollo
| Bloque | Periodo | Contenido |
|--------|---------|-----------|
| 5 | 1788–1833 | Crisis del Antiguo Régimen, Guerra de la Independencia, Cortes de Cádiz, Constitución 1812, Fernando VII, emancipación de América |
| 6 | 1833–1874 | Guerras carlistas, construcción del Estado liberal, Isabel II, desamortizaciones (Mendizábal), Sexenio Revolucionario, I República |
| 7 | 1874–1902 | Restauración borbónica, Cánovas/Sagasta, bipartidismo, fraude electoral (caciquismo), pérdida colonias 1898, crisis del 98 |
| 8 | Siglo XIX | Transformaciones económicas: desamortizaciones, ferrocarril, proteccionismo/librecambismo, movimiento obrero |

#### Agrupación IV (Primer tercio s. XX) — para temas de desarrollo
| Bloque | Periodo | Contenido |
|--------|---------|-----------|
| 9 | 1902–1931 | Crisis de la Restauración, Semana Trágica, crisis de 1917, dictadura de Primo de Rivera, fin de la monarquía |
| 10 | 1931–1939 | Segunda República (constitución, bienios, Frente Popular), Guerra Civil (bandos, intervención extranjera, evolución) |

#### Agrupación V (Dictadura y democracia) — para temas de desarrollo
| Bloque | Periodo | Contenido |
|--------|---------|-----------|
| 11 | 1939–1975 | Dictadura franquista: bases, autarquía, desarrollismo, oposición, crisis final |
| 12 | 1975–hoy | Transición, Constitución de 1978, Estado de las Autonomías, integración en Europa, España en el mundo |

Sources:
- [Contenidos Historia de España 2º Bach — educaciongratuita.es](https://www.educaciongratuita.es/asignaturas/2-bachillerato/historia-de-espana/contenidos-historia-de-espana-2-bachillerato.php)
- [Temario Selectividad Andalucía — formarformacion.com](https://formarformacion.com/temario-historia-selectividad-andalucia/)
- [Temario Selectividad Historia — academia-cordoba.es](https://academia-cordoba.es/blog/temario-historia-espana/)
- [Criterios evaluación MEC — Educagob](https://educagob.educacionfpydeportes.gob.es/curriculo/curriculo-lomloe/menu-curriculos-basicos/bachillerato/materias/historia-espana/criterios-evaluacion-segundo-curso.html)

### 1.5 Estrategia de estudio para aprobar pendientes

Basada en el temario oficial + formato típico de examen de pendientes:

**Prioridad 1 — Lo que SIEMPRE cae (saber bien 6 temas):**
- Siglo XIX: Guerra de la Independencia + Cortes de Cádiz, Estado Liberal + Desamortizaciones, Restauración Borbónica
- Siglo XX: Segunda República + Guerra Civil, Franquismo, Transición
- Ya NO se puede elegir solo un siglo → preparar al menos 2 temas de cada

**Prioridad 2 — Cuestiones breves (saber ubicar en el tiempo):**
- Al-Ándalus y Reyes Católicos (Agrup. I-II) — siempre caen
- Son respuestas cortas: nombre + fecha + consecuencia en un párrafo

**Prioridad 3 — Técnica de examen:**
- Plantilla de 4 pasos para comentarios de texto
- Vocabulario histórico (lista de 50-80 términos clave)
- Ubicación cronológica cuando no recuerdas la fecha exacta ("A mediados del siglo XIX...")
- Cuidar ortografía (penalización a partir de la 3ª falta)

---

## 2. Arquitectura del vault

### 2.1 Estructura de carpetas

```
/mnt/d/YAYO_AINOA/
├── 00_ESTUDIO/                    # Contenido propio de Ainoa
│   ├── resumenes/                 # Resúmenes propios por tema
│   ├── esquemas/                  # Esquemas y mapas conceptuales
│   ├── ejercicios/                # Ejercicios resueltos y simulacros
│   └── examenes/                  # Exámenes tipo con respuestas
├── 01_CRUDO/                      #  y docs del libro, apuntes del profesor escaneados, fotos de pizarra y otros materiales
├── 02_WIKI/                       # Base de conocimiento PRE-cargada por nosotros
│   ├── temario/                   # 12 bloques oficiales (fichas)
│   ├── conceptos/                 # Glosario de términos históricos
│   ├── cronologia/                # Línea temporal por siglos
│   ├── personajes/                # Personajes históricos relevantes
│   ├── documentos/                # Documentos históricos tipo examen
│   └── estrategia/                # Estrategia de examen + plantillas de respuesta
├── 03_NOTAS/                      # Notas sueltas de Ainoa
├── 99_TEMPLATES/                  # Plantillas Templater
│   ├── ficha_tema.md              # Ficha de un bloque/tema del temario
│   ├── ficha_concepto.md          # Ficha de un concepto/término histórico
│   ├── ficha_personaje.md         # Ficha de un personaje histórico
│   ├── ficha_documento.md         # Ficha de un documento/fuente primaria
│   ├── resumen_tema.md            # Resumen esquematizado para repaso
│   ├── simulacro_examen.md        # Plantilla de simulacro tipo examen
│   ├── comentario_texto.md        # Plantilla de 4 pasos para comentario de texto
│   ├── esquema_visual.md          # Plantilla de esquema con emojis y jerarquía
│   └── presentacion_tema.md       # Plantilla para presentación HTML
├── BMO/
│   ├── Profiles/
│   │   ├── BMO.md                 # Perfil default
│   │   └── Yayo_Tutor.md          # ★ PERFIL PRINCIPAL — tutor de Historia
│   └── Chats/
├── AgenteEscritor.exe             # Mismo binario que Nina/Miguel (idéntico)
├── 1_arrancar.bat
├── 2_parar.bat
├── 3_verificar.bat
├── .env                           # Keys de prueba (Mistral), Ainoa pondrá las suyas
├── LÉEME_PRIMERO.md               # Guía adaptada para NO-técnica
├── mingit/                        # Git portable
└── logs/
```

### 2.2 Contenido pre-cargado en 02_WIKI/ (antes de que Ainoa toque nada)

Nosotros creamos esto ANTES de entregar el vault. Es lo que le da ventaja a la IA sobre
un ChatGPT genérico: tiene el temario oficial, los criterios de corrección, y la estrategia
de examen ya internalizados.

| Carpeta | Contenido a crear | Cantidad aprox. |
|---------|-------------------|-----------------|
| `temario/` | 1 ficha por cada uno de los 12 bloques (periodo, contenidos clave, preguntas tipo, peso en examen) | 12 fichas |
| `conceptos/` | Glosario de términos históricos (desamortización, caciquismo, pronunciamiento, fueros...) | 50-80 fichas |
| `personajes/` | Fichas de personajes clave (Fernando VII, Isabel II, Cánovas, Primo de Rivera, Franco...) | 20-30 fichas |
| `documentos/` | Documentos históricos tipo examen (Constitución 1812, Manifiesto de Manzanares, etc.) | 10-15 fichas |
| `cronologia/` | Línea temporal por siglos (XVIII, XIX, XX) con hitos | 3-4 fichas |
| `estrategia/` | Estrategia de examen, plantilla comentario texto, vocabulario histórico, distribución de puntos | 4-5 fichas |

**Total: ~100-140 notas pre-cargadas.**

> **IMPORTANTE:** Este contenido será la primera cosa que Smart Connections indexe. Cuando
> Ainoa pregunte "¿qué es una desamortización?", la IA encontrará la ficha en la wiki ANTES
> de inventar. Esto es anti-alucinación por diseño (RAG con contenido curado).

---

## 3. Perfil BMO: Yayo (tutor de Historia)

### 3.1 Configuración YAML

```yaml
# BMO/Profiles/Yayo_Tutor.md
---
model: mistral:mistral-large-latest
max_tokens: 4096
temperature: 0.3
enable_reference_current_note: true
user_name: Ainoa
enable_header: true
systen_role: Tutor de Historia de España para Ainoa
---
```

> **Nota:** Modelo por defecto = `mistral:mistral-large-latest` (usa la MISTRAL_API_KEY del .env).
> Ainoa puede cambiar a cualquier otro modelo después poniendo sus propias API keys.

### 3.2 System prompt (borrador)

```markdown
Eres **Yayo**, tutor privado de Historia de España para estudiantes de 2º de Bachillerato
en Andalucía. Especializado en preparación de **exámenes** y repaso del curso, siguiendo
el **temario oficial LOMLOE**.

## Tu alumna
Ainoa, estudiante de 2º Bachillerato de **Artes** en la Escuela de Arte de Almería (EASD
Carlos Pérez Siquier). Historia de España es materia común obligatoria (4h/semana).
Necesita aprobar **pendientes** de esta asignatura.

## Estructura del vault (usa SIEMPRE estas rutas exactas)
```
00_ESTUDIO/          → resúmenes, esquemas, ejercicios y exámenes de Ainoa
01_CRUDO/            → material subido por Ainoa (PDFs, fotos, apuntes)
02_WIKI/temario/     → fichas de los 12 bloques del temario oficial
02_WIKI/conceptos/   → glosario de términos históricos
02_WIKI/cronologia/  → línea temporal por siglos
02_WIKI/personajes/  → fichas de personajes históricos clave
02_WIKI/documentos/  → documentos históricos tipo examen
02_WIKI/estrategia/  → estrategia de examen y plantillas de respuesta
03_NOTAS/            → notas sueltas de Ainoa
99_TEMPLATES/        → plantillas (fichas, resúmenes, simulacros)
```

## Reglas obligatorias

1. **Responde SIEMPRE en español.**
2. **Nunca digas "el archivo no existe" sin antes llamar a `list_vault_files`.**
3. Cuando Ainoa diga "explícame el tema X" → busca primero en `02_WIKI/temario/` con
   `find_similar_notes`, luego complementa. NO inventes datos: si no está en la wiki,
   dilo y busca con `search_internet`, !!PERO NUNCA INVENTES NADA!! ¡¡NO CONFIES EN TU CONOCIMIENTO PREVIO DE ENTRENAMIENTO ESTA OBSOLETO!!.
4. **Wikilinks:** cuando menciones un concepto, personaje o periodo que tenga ficha,
   escríbelo como `[[Nombre]]` para construir el grafo de conocimiento.
5. **Rigor histórico:** cita SIEMPRE el periodo, la fecha aproximada O EXACTA, SI LA TIENES EN LA WIKI y el contexto.
   Si afirmas un dato, que sea verificable Y VERIDICO, NUNCA INVENTADO. Usa `search_internet` si dudas.
6. **Orientación a examen:** Cuando Ainoa estudie un tema, recuérdale:
   - Qué tipo de pregunta puede caer sobre este tema (desarrollo, cuestión breve, documento)
   - Vocabulario histórico que DEBE usar en su respuesta
   - Fechas y nombres imprescindibles
7. **Estrategia:** Si Ainoa pregunta "¿qué estudio primero?" o "¿cómo apruebo?",
   consulta `02_WIKI/estrategia/` y dale un plan concreto y priorizado.
8. Si Ainoa sube un PDF/foto de apuntes a `01_CRUDO/`, léelo con `read_pdf` y crea
   fichas automáticas en la wiki correspondiente. El OCR de Mistral se activa
   automáticamente si el PDF es una imagen escaneada.
9. **Tono:** Sé cercano pero riguroso. No seas condescendiente. Explica como un
   profesor que se preocupa por su alumna, con claridad y sin jerga innecesaria. ANÍMALA DE SEGUIR ESTUDIANDO, PERO SIN INSISTIR, USA MNEMOTECNICAS CUANDO ES ADECUADO PARA QUE LO RECUERDE TODO MAS FACILMENTE! 

## Tus herramientas

| Herramienta | Para qué |
|------------|----------|
| `list_vault_files(folder, extension)` | Lista archivos. Ej: `list_vault_files(folder="02_WIKI/temario")` |
| `read_obsidian_note(filename)` | Lee una nota del vault |
| `create_obsidian_note(filename, content)` | Crea una nota nueva (ficha, resumen, esquema) |
| `update_obsidian_note(filename, content)` | Añade texto al final de una nota |
| `overwrite_obsidian_note(filename, content)` | Reescribe una nota entera (CUIDADO) |
| `delete_obsidian_note(filename)` | Borra una nota (va a papelera) |
| `find_similar_notes(query, k)` | Búsqueda SEMÁNTICA. Úsala cuando Ainoa pregunte por un tema sin saber el archivo exacto |
| `run_template(name, arguments, target_path)` | Crea una ficha desde plantilla (99_TEMPLATES/) |
| `git_status()` | Estado del versionado |
| `git_save(message)` | Guarda una versión con mensaje |
| `read_pdf(path)` | Extrae texto de un PDF (OCR automático si está escaneado) |
| `read_docx(path)` | Extrae texto de un Word (.docx) |
| `fetch_url(url)` | Lee el texto de una página web |
| `search_internet(query)` | Busca en internet (para verificar datos o buscar info nueva) |
| `generate_quiz(tema, n_preguntas, tipo)` | Genera un cuestionario sobre un tema |
| `create_summary(nota_path, formato)` | Genera resumen de una nota larga |
| `generate_esquema(tema, formato)` | Genera un esquema/mapa conceptual jerárquico |
| `export_html(nota_path, template)` | Exporta una nota a HTML presentable |

## Modo examen
Cuando Ainoa diga "ponme un examen" o "hazme un simulacro":
1. Genera un examen con la estructura que mejor prepare para pendientes:
   - 2-3 temas de desarrollo (elige 1)
   - 4-6 cuestiones breves (responde 3)
   - Opcionalmente: 1 comentario de texto/documento
2. Después de que responda, corrígele con criterios claros:
   - ¿Ubica bien el periodo temporal?
   - ¿Identifica causas y consecuencias?
   - ¿Usa vocabulario histórico apropiado?
   - ¿Exposición clara y ordenada?
3. Dale nota numérica + feedback constructivo + puntos de mejora Y REPETICION ESPACIAL!

## Modo repaso rápido
Cuando Ainoa diga "repásame X" o tenga poco tiempo:
- Dale los 5-7 puntos clave del tema en formato bullet
- Fechas imprescindibles
- Vocabulario que debe usar
- Cómo puede caer en un examen

## Modo esquema
Cuando Ainoa diga "hazme un esquema de X":
- Usa `generate_esquema` o crea manualmente un esquema jerárquico markdown
- Usa indentación, bullets y negritas para la jerarquía
- Guárdalo en `00_ESTUDIO/esquemas/` con wikilinks a conceptos

NUNCA respondas en otro idioma. NUNCA digas que no tienes herramientas.
NUNCA pidas permiso antes de llamar a una herramienta de lectura o listado.
```

---

## 4. Herramientas: qué hay, qué falta, qué añadir

### 4.1 Tools actuales del proxy (17) — ¿sirven para Ainoa?

| # | Tool | ¿Sirve para estudio? | Notas |
|---|------|---------------------|-------|
| 1 | `read_obsidian_note` | ✅ Sí | Leer fichas de la wiki, resúmenes |
| 2 | `create_obsidian_note` | ✅ Sí | Crear fichas, resúmenes, esquemas |
| 3 | `update_obsidian_note` | ✅ Sí | Añadir info a fichas existentes |
| 4 | `overwrite_obsidian_note` | ✅ Sí | Reescribir fichas mejoradas |
| 5 | `delete_obsidian_note` | ✅ Sí | Limpiar notas obsoletas |
| 6 | `list_vault_files` | ✅ Sí | Explorar estructura |
| 7 | `find_similar_notes` | ✅ **CLAVE** | Busca temas por significado, no por nombre |
| 8 | `run_template` | ✅ **CLAVE** | Crear fichas desde plantillas — fundamental para generar contenido rápido |
| 9 | `git_status` | ✅ Sí | Ver estado de las copias |
| 10 | `git_save` | ✅ Sí | Guardar versión antes de examen |
| 11 | `read_pdf` | ✅ **CLAVE** | Extraer apuntes/libro de texto de Ainoa. OCR Mistral automático para escaneados |
| 12 | `read_docx` | ✅ Sí | Leer apuntes en Word |
| 13 | `fetch_url` | ✅ Sí | Leer webs de referencia |
| 14 | `list_obsidian_plugins` | ❌ Omitir del prompt | Ainoa no es técnica |
| 15 | `read_obsidian_config` | ❌ Omitir del prompt | Ainoa no es técnica |
| 16 | `update_obsidian_config` | ❌ **OMITIR** | Peligroso — la IA no debe tocar configs |
| 17 | `search_internet` | ✅ **CLAVE** | Verificar datos, buscar info adicional |

### 4.2 Tools NUEVOS a implementar en el proxy

Todos estos son funciones Python puras en el proxy que usan el LLM + las notas existentes.
**Se añaden al .exe, disponibles para TODOS los clientes** (Nina, Miguel, Ainoa).

| # | Tool | Qué hace | Parámetros | Prioridad |
|---|------|----------|------------|-----------|
| 18 | `generate_quiz(tema, n_preguntas, tipo)` | Genera cuestionario: tipo test, verdadero/falso, o preguntas abiertas. Lee la wiki del tema primero y genera preguntas basadas en el contenido real | `tema`: str (nombre o path de nota), `n_preguntas`: int (default 10), `tipo`: str ("test"/"vf"/"abierta"/"mixto") | **ALTA** |
| 19 | `create_summary(nota_path, formato)` | Lee una nota larga y genera resumen compacto | `nota_path`: str, `formato`: str ("bullet"/"esquema"/"parrafo", default "bullet") | **ALTA** |
| 20 | `generate_esquema(tema, formato)` | Genera esquema/mapa conceptual jerárquico en markdown con wikilinks. Busca primero en la wiki, luego estructura | `tema`: str, `formato`: str ("jerarquico"/"timeline"/"comparativo"), guarda en `00_ESTUDIO/esquemas/` | **ALTA** |
| 21 | `export_html(nota_path, template)` | Exporta una nota markdown a HTML presentable (con CSS bonito embebido). Ideal para imprimir, enviar al profesor, o presentar | `nota_path`: str, `template`: str ("estudio"/"presentacion"/"examen"), devuelve path del .html generado en la misma carpeta | **MEDIA** |
| 22 | `compare_notes(nota1, nota2)` | Compara dos fichas/temas y muestra diferencias, conexiones y evolución cronológica | `nota1`: str, `nota2`: str | **BAJA** |

### 4.3 Detalle de implementación de cada tool nuevo

#### 18. `generate_quiz` — Generador de cuestionarios

```python
def generate_quiz(tema: str, n_preguntas: int = 10, tipo: str = "mixto") -> str:
    """Genera un cuestionario sobre un tema. Primero busca en la wiki (find_similar_notes),
    luego usa el LLM para generar preguntas basadas en el contenido REAL de la wiki.
    Tipos: 'test' (4 opciones), 'vf' (verdadero/falso), 'abierta', 'mixto' (mezcla).
    Guarda el resultado en 00_ESTUDIO/ejercicios/quiz_TEMA_FECHA.md"""
```

**Flujo:**
1. `find_similar_notes(tema, k=5)` → recoge contexto real de la wiki
2. Compone prompt al LLM: "Basándote en este contenido, genera N preguntas tipo X"
3. Formatea en markdown con respuestas ocultas (callout colapsable `> [!answer]-`)
4. Guarda en `00_ESTUDIO/ejercicios/` con timestamp
5. Devuelve confirmación + path del quiz creado

#### 19. `create_summary` — Resumidor de notas

```python
def create_summary(nota_path: str, formato: str = "bullet") -> str:
    """Lee una nota larga y genera un resumen compacto.
    Formatos: 'bullet' (puntos clave), 'esquema' (jerárquico con indentación),
    'parrafo' (texto fluido de 150-200 palabras).
    Guarda en 00_ESTUDIO/resumenes/resumen_NOMBRE.md"""
```

**Flujo:**
1. `read_obsidian_note(nota_path)` → contenido completo
2. Prompt al LLM: "Resume esta nota en formato X, máximo Y palabras, con wikilinks"
3. Guarda resumen en `00_ESTUDIO/resumenes/`
4. Devuelve confirmación + path

#### 20. `generate_esquema` — Generador de esquemas

```python
def generate_esquema(tema: str, formato: str = "jerarquico") -> str:
    """Genera un esquema/mapa conceptual sobre un tema en markdown.
    Formatos: 'jerarquico' (bullets anidados), 'timeline' (cronológico con fechas),
    'comparativo' (tabla de comparación).
    Busca primero en la wiki, luego estructura con wikilinks.
    Guarda en 00_ESTUDIO/esquemas/esquema_TEMA.md"""
```

**Flujo:**
1. `find_similar_notes(tema, k=8)` → recoge todo el contexto
2. Prompt al LLM: "Estructura un esquema FORMATO sobre este contenido, usa wikilinks"
3. Genera markdown con indentación, negritas, `[[wikilinks]]` a conceptos existentes
4. Guarda en `00_ESTUDIO/esquemas/`
5. Devuelve confirmación + path

#### 21. `export_html` — Exportador a HTML

```python
def export_html(nota_path: str, template: str = "estudio") -> str:
    """Exporta una nota .md a .html con CSS embebido. Templates:
    - 'estudio': diseño limpio para estudiar en pantalla o imprimir
    - 'presentacion': diseño tipo diapositivas (secciones = slides)
    - 'examen': diseño tipo examen oficial (con espacios de respuesta)
    El .html se guarda junto a la nota original."""
```

**Flujo:**
1. `read_obsidian_note(nota_path)` → markdown
2. Convierte markdown → HTML (con `markdown` lib, ya disponible en Python stdlib parcialmente; o con regex para lo básico)
3. Envuelve en template HTML con CSS embebido (no dependencias externas)
4. Guarda como `.html` en la misma carpeta
5. Devuelve path del HTML

**Dependencias:** `markdown` (lib Python, ~100KB) o conversión manual con regex. `markdown` es preferible y **ligera** — solo hay que añadirla al `requirements.txt` y a `hiddenimports` del `.spec`.

#### 22. `compare_notes` — Comparador (prioridad baja)

```python
def compare_notes(nota1: str, nota2: str) -> str:
    """Lee dos notas y genera una comparación: similitudes, diferencias,
    evolución cronológica si procede. Útil para comparar dos periodos o personajes."""
```

### 4.4 Templates Templater nuevos para Ainoa

Además de los 4 templates que ya tiene Miguel Ángel (ficha_personaje, ficha_lugar,
ficha_historica, ficha_yacimiento), Ainoa necesita templates específicos para estudio.
**Todos con sintaxis dual** `tp.mcpTools ? ... : await tp.system.prompt()`:

| Template | Campos | Para qué |
|----------|--------|----------|
| `ficha_tema.md` | nombre, periodo, contenidos_clave, preguntas_tipo, peso_examen, vocabulario | Ficha de un bloque del temario oficial |
| `ficha_concepto.md` | nombre, definicion, periodo, ejemplo, importancia | Ficha de un término histórico |
| `ficha_personaje.md` | nombre, periodo, cargo, acciones_clave, relaciones, importancia_examen | Ficha de un personaje (adaptada de Miguel Ángel) |
| `ficha_documento.md` | nombre, fecha, autor, tipo, contexto, contenido_clave, preguntas_tipo | Ficha de un documento histórico tipo examen |
| `resumen_tema.md` | tema, periodo, puntos_clave, fechas, vocabulario, como_cae | Resumen rápido para repaso |
| `simulacro_examen.md` | tipo_examen, temas_incluidos, tiempo | Plantilla de simulacro completo |
| `comentario_texto.md` | documento, autor, fecha | Plantilla de 4 pasos para comentar un documento |
| `esquema_visual.md` | tema, tipo_esquema | Plantilla base para esquemas |
| `presentacion_tema.md` | tema, n_secciones | Plantilla para presentación (exportable a HTML) |

### 4.5 Dependencias del .exe

| Dependencia | Estado | Para qué | Tamaño |
|-------------|--------|----------|--------|
| `mistralai` | ✅ Ya incluida | Chat + OCR | Incluida |
| `requests` | ✅ Ya incluida | REST API Obsidian | Incluida |
| `beautifulsoup4` | ✅ Ya incluida | fetch_url | Incluida |
| `pypdf` | ✅ Ya incluida | read_pdf | Incluida |
| `python-docx` | ✅ Ya incluida | read_docx | Incluida |
| `markdown` | **NUEVA — añadir** | export_html (md→html) | ~100KB |
| `jinja2` | **NUEVA — añadir** | templates HTML para export_html | ~500KB |

> **Solo 2 dependencias nuevas**, muy ligeras (~600KB total). No hay impacto significativo
> en el tamaño del .exe (de 23.4MB a ~23.5MB).

**NO añadir** (se descartó para el MVP):
- `weasyprint` (~200MB) — demasiado pesado para generar PDFs
- `python-pptx` — no necesario si exportamos a HTML

### 4.6 Tools a OMITIR del prompt de Yayo (defensa por omisión)

El .exe es el mismo para todos los clientes. Los tools de configuración de plugins son
peligrosos en manos de una IA que no controla Spas. **No los mencionamos en el prompt
de Yayo** → la IA no los usará:

- `update_obsidian_config` — puede romper plugins
- `read_obsidian_config` — información irrelevante para una estudiante
- `list_obsidian_plugins` — ídem

---

## 5. .env y API Keys

### 5.1 .env de Ainoa (para pruebas iniciales)

```bash
# === Ainoa — YAYO_AINOA ===
# Modelo por defecto: Mistral Large (key de prueba de Spas)
MISTRAL_API_KEY=FpxxgzuLHRIWlPL6PMUOkzdPblGNBuHF

# Obsidian REST API (se genera al instalar el plugin, la copias de Settings → Local REST API)
OBSIDIAN_REST_API_KEY=  # ← Ainoa tiene que copiar esto de su Obsidian

# Internet search (Tavily — gratis tier de 1000 búsquedas/mes)
TAVILY_API_KEY=  # ← Ainoa crea cuenta en tavily.com

# Puerto del proxy (NO CAMBIAR)
PROXY_PORT=9000
PROXY_HOST=127.0.0.1

# Git portable (viene incluido, no tocar)
GIT_EXE=mingit\cmd\git.exe
```

### 5.2 Dónde conseguir las API keys (para el LÉEME)

Ainoa no es técnica, así que el LÉEME debe explicar paso a paso cómo conseguir cada key:

| Servicio | URL para conseguir key | Gratis? | Para qué |
|----------|----------------------|---------|----------|
| **Mistral** | https://console.mistral.ai/api-keys | Sí, tier gratuito generoso (~1M tokens/día) | Chat principal + OCR de PDFs escaneados |
| **Google Gemini** | https://aistudio.google.com/app/apikey | Sí, 15 peticiones/min gratis | Alternativa: `gemini:gemini-2.0-flash` |
| **OpenRouter** | https://openrouter.ai/keys | Sí, modelos con `:free` | Acceso a muchos modelos. Modelos gratis: `google/gemma-4-31b-it:free`, `deepseek/deepseek-v4-flash:free` |
| **Groq** | https://console.groq.com/keys | Sí, tier gratuito rápido | Alternativa rápida: `groq:llama-3.3-70b-versatile` |
| **DeepSeek** | https://platform.deepseek.com/api_keys | Sí, $5 crédito regalo | Alternativa barata: `deepseek:deepseek-chat` |
| **Tavily** | https://tavily.com (Sign Up) | Sí, 1000 búsquedas/mes | Búsqueda en internet desde el chat |
| **OpenAI** | https://platform.openai.com/api-keys | No, de pago | Solo si quiere usar GPT-4o |

> **Para empezar, Ainoa solo necesita la key de Mistral.** Con eso funciona el chat,
> el OCR de PDFs escaneados, y la búsqueda semántica. Todo lo demás es opcional.

### 5.3 OCR de PDFs escaneados

El proxy ya tiene OCR implementado: cuando `read_pdf` detecta que un PDF no tiene texto
extraíble (es imagen escaneada), llama automáticamente a **Mistral OCR** (`mistral-ocr-latest`).
Usa la misma `MISTRAL_API_KEY` del .env — **no necesita key separada**.

Esto es clave para Ainoa: puede **fotografiar apuntes de clase**, guardar el PDF en
`01_CRUDO/`, y pedirle a Yayo "lee mis apuntes" → el proxy:
1. Detecta PDF sin texto → activa OCR
2. Sube a Mistral Files API → procesa con `mistral-ocr-latest`
3. Devuelve el texto extraído
4. Yayo puede entonces crear fichas automáticas en la wiki

---

## 6. LÉEME_PRIMERO.md — Guía para Ainoa

El LÉEME debe estar escrito para alguien que **NO es técnica**. Lenguaje claro, sin
jerga, con capturas de pantalla (o al menos descripciones paso a paso). Contenido:

```
# ¡Hola, Ainoa! 👋

Este es tu espacio de estudio con Yayo, tu tutor de Historia de España.

## Primer arranque (solo la primera vez)

1. **Haz doble clic en `1_arrancar.bat`** — verás una ventana negra que dice "Proxy OK"
2. **Abre Obsidian** y abre esta carpeta como vault
3. **Ve a Settings → Smart Connections → pulsa "Re-import sources"** — esto indexa
   toda la wiki para que Yayo pueda buscar en ella. Solo se hace la primera vez.
4. **¡Listo!** Abre el chat de BMO (icono de robot en la barra lateral) y saluda a Yayo

## Cada día de estudio

1. Haz doble clic en `1_arrancar.bat`
2. Abre Obsidian
3. Chatea con Yayo

## Qué puedes pedirle a Yayo

- "Explícame la Restauración Borbónica"
- "Hazme un resumen del tema 5"
- "Ponme un examen"
- "Hazme un esquema de la Guerra Civil"
- "Lee mis apuntes" (después de poner un PDF en 01_CRUDO/)
- "Hazme un quiz de 10 preguntas sobre el Franquismo"
- "Exporta este resumen a HTML para imprimir"
- "¿Qué estudio primero para aprobar?"
- "Repásame la II República en 5 minutos"

## Si quieres cambiar de modelo de IA

Yayo usa Mistral por defecto. Si quieres usar otro modelo:
1. Crea una cuenta en el servicio (ver tabla abajo)
2. Copia la API key
3. Abre el archivo `.env` con el Bloc de Notas
4. Añade la línea correspondiente (ej: GEMINI_API_KEY=tu_key_aquí)
5. Guarda y reinicia el proxy (cierra la ventana negra + abre `1_arrancar.bat`)

### Dónde conseguir API keys gratuitas

| Servicio | Web | ¿Gratis? |
|----------|-----|----------|
| Mistral | https://console.mistral.ai/api-keys | Sí |
| Google Gemini | https://aistudio.google.com/app/apikey | Sí |
| OpenRouter | https://openrouter.ai/keys | Sí (modelos con :free) |
| Groq | https://console.groq.com/keys | Sí |
| DeepSeek | https://platform.deepseek.com/api_keys | Sí ($5 regalo) |
| Tavily (búsqueda) | https://tavily.com | Sí (1000/mes) |

## Si algo falla

- **"No hay respuesta"** → ¿Está la ventana negra abierta? Si no, abre `1_arrancar.bat`
- **"Error 401"** → La API key no es válida. Revisa el archivo `.env`
- **Yayo no encuentra tus apuntes** → ¿Los pusiste en la carpeta `01_CRUDO/`?
- **Yayo inventa cosas** → Dile: "Busca en la wiki antes de responder"
```

---

## 7. Pasos de implementación

### Fase 1 — Crear vault base (1 día)

- [ ] **P1.1** Copiar estructura de Miguel Ángel a `/mnt/d/YAYO_AINOA/`:
  `.exe`, `.bat`, `mingit/`, `.obsidian/` (con plugins: bmo-chatbot, smart-connections,
  templater, dataview, obsidian-local-rest-api, mcp-tools, obsidian-git)
- [ ] **P1.2** Renombrar carpetas: `00_LIBRO` → `00_ESTUDIO` (con subcarpetas:
  resumenes, esquemas, ejercicios, examenes), adaptar `02_WIKI/`
- [ ] **P1.3** Crear `.env` con MISTRAL_API_KEY de prueba (la de Spas)
- [ ] **P1.4** Crear perfil `BMO/Profiles/Yayo_Tutor.md` con el system prompt de §3
- [ ] **P1.5** Configurar `obsidian-git/data.json`: authorName=Ainoa, authorEmail=ainoa@local
- [ ] **P1.6** Configurar `templater-obsidian/data.json`: templates_folder=99_TEMPLATES
- [ ] **P1.7** Crear `LÉEME_PRIMERO.md` con la guía de §6 (lenguaje no técnico, URLs de
  API keys, instrucciones paso a paso, troubleshooting)
- [ ] **P1.8** Borrar contenido de Miguel Ángel (00_LIBRO, 02_WIKI/personajes hititas, etc.)

### Fase 2 — Templates + Wiki de contenido (2-3 días)

- [ ] **P2.1** Crear 9 templates nuevos en `99_TEMPLATES/` (ficha_tema, ficha_concepto,
  ficha_personaje, ficha_documento, resumen_tema, simulacro_examen, comentario_texto,
  esquema_visual, presentacion_tema) — todos con sintaxis dual `tp.mcpTools ? ... : await tp.system.prompt()`
- [ ] **P2.2** Crear las 12 fichas de temario (`02_WIKI/temario/Bloque_01.md` a `Bloque_12.md`)
  con el contenido oficial de cada bloque, preguntas tipo, y peso en el examen
- [ ] **P2.3** Crear glosario de 50-80 conceptos históricos clave (`02_WIKI/conceptos/`)
- [ ] **P2.4** Crear 20-30 fichas de personajes históricos (`02_WIKI/personajes/`)
- [ ] **P2.5** Crear 10-15 fichas de documentos históricos tipo examen (`02_WIKI/documentos/`)
- [ ] **P2.6** Crear 3-4 fichas de cronología por siglos (`02_WIKI/cronologia/`)
- [ ] **P2.7** Crear fichas de estrategia de examen (`02_WIKI/estrategia/`):
  - `Estructura_Examen.md` — cómo suelen ser los exámenes de pendientes
  - `Estrategia_Aprobar.md` — plan de estudio priorizado para aprobar
  - `Plantilla_Comentario_Texto.md` — 4 pasos para comentar un documento
  - `Vocabulario_Historico.md` — lista de 50+ términos que DEBE usar
  - `Criterios_Evaluacion.md` — criterios habituales de corrección

### Fase 3 — Tools nuevos en el proxy (1-2 días)

- [ ] **P3.1** Implementar `generate_quiz()` en `proxy_agente_escritor.py` (§4.3.18)
- [ ] **P3.2** Implementar `create_summary()` (§4.3.19)
- [ ] **P3.3** Implementar `generate_esquema()` (§4.3.20)
- [ ] **P3.4** Implementar `export_html()` (§4.3.21) + añadir `markdown` y `jinja2`
  a `requirements.txt` y a `hiddenimports` del `.spec`
- [ ] **P3.5** (Opcional) Implementar `compare_notes()` (§4.3.22)
- [ ] **P3.6** Añadir todos los tools nuevos a `names_to_functions`, `tools[]`, y
  `build_critical_context()`
- [ ] **P3.7** Actualizar perfiles de TODOS los clientes con los tools nuevos
  (Miguel Ángel y Nina también se benefician — `generate_quiz`, `create_summary`,
  `generate_esquema`, `export_html` son útiles para cualquier vault)
- [ ] **P3.8** Testear cada tool nuevo con curl antes de compilar
- [ ] **P3.9** `/rebuild-exe` — compilar y desplegar a los 3 vaults (Nina, Miguel, Ainoa)

### Fase 4 — Verificación y entrega (medio día)

- [ ] **P4.1** Arrancar el .exe en el vault de Ainoa y verificar con `3_verificar.bat`
- [ ] **P4.2** Abrir Obsidian, verificar que BMO carga el perfil Yayo
- [ ] **P4.3** Smart Connections: "Re-import sources" → verificar que indexa las ~120 notas
- [ ] **P4.4** Test: pedirle a Yayo "explícame la Restauración Borbónica" → debe consultar
  la wiki, no inventar
- [ ] **P4.5** Test: "hazme un quiz de 5 preguntas sobre el Franquismo" → debe usar
  `generate_quiz`, crear nota en 00_ESTUDIO/ejercicios/
- [ ] **P4.6** Test: "hazme un esquema de la Guerra Civil" → debe usar `generate_esquema`,
  crear nota en 00_ESTUDIO/esquemas/
- [ ] **P4.7** Test: "exporta este resumen a HTML" → debe generar .html presentable
- [ ] **P4.8** Test: subir un PDF escaneado a `01_CRUDO/` y pedir "lee mis apuntes" →
  OCR Mistral debe activarse y extraer texto
- [ ] **P4.9** Test: "ponme un examen" → debe generar estructura tipo examen de pendientes
- [ ] **P4.10** Entregar a Ainoa con sesión de 30 min de onboarding presencial

---

## 8. Adaptabilidad a otras asignaturas (futuro)

El vault de Ainoa se diseña como **plantilla replicable**:

| Componente | Qué cambia | Qué NO cambia |
|-----------|-----------|---------------|
| `02_WIKI/` | Todo el contenido (temario, conceptos, personajes) | La estructura de carpetas |
| Perfil BMO | System prompt (asignatura, criterios, estrategia) | Configuración técnica (model, tokens) |
| `99_TEMPLATES/` | Los campos de las fichas | El mecanismo dual tp.mcpTools/tp.system.prompt |
| `.exe` y tools | Nada | Todo — el binario es universal |

Para crear un vault de **Filosofía**, **Lengua**, o **Matemáticas**:
1. Copiar el vault de Ainoa
2. Vaciar `02_WIKI/` y rellenar con contenido de la nueva asignatura
3. Crear nuevo perfil BMO con prompt adaptado
4. Adaptar templates

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Alucinación en datos históricos | Media | Alto | RAG con wiki curada + `search_internet` como fallback + prompt "si no está en la wiki, dilo" |
| Ainoa no usa Smart Connections "Re-import" | Alta | Alto | Instrucción DESTACADA en LÉEME + pop-up en el primer arranque si es posible |
| Ainoa no entiende cómo poner API keys | Alta | Medio | Guía paso a paso con URLs directas en LÉEME. Mistral ya viene configurada de fábrica |
| Modelo de IA no disponible/caro | Media | Medio | Mistral gratis por defecto. URLs de 5 alternativas gratuitas en LÉEME |
| Ainoa pierde el vault o el .exe | Media | Alto | obsidian-git auto-commit cada 10 min; "no borres nada" en LÉEME |
| Examen de pendientes tiene formato sorpresa | Media | Bajo | Dominar el temario completo cubre cualquier formato |
| OCR no extrae bien fotos de pizarra | Media | Medio | Mistral OCR es bueno pero no perfecto. Alternativa: pedir que escriba apuntes en Word/texto |

---

## 10. Presupuesto de tokens (estimación)

| Acción | Tokens aprox. | Coste (Mistral Large) |
|--------|---------------|----------------------|
| Crear 120 fichas de wiki | ~200K input + ~300K output | ~2,40€ |
| 1 sesión de estudio (30 min) | ~50K input + ~20K output | ~0,27€ |
| 1 simulacro de examen | ~30K input + ~15K output | ~0,18€ |
| 1 quiz de 10 preguntas | ~20K input + ~10K output | ~0,12€ |
| 1 esquema completo | ~25K input + ~8K output | ~0,13€ |
| 1 export HTML | ~5K input + ~3K output | ~0,03€ |

**Coste mensual estimado de Ainoa** (si estudia 1h/día): **~5-8€/mes** con Mistral Large.
Con la key de prueba de Spas: **0€** mientras dure el tier gratuito de Mistral (~1M tokens/día).

---

## 11. Cronograma resumido

| Día | Tarea | Resultado |
|-----|-------|-----------|
| 1 | Fase 1: vault base + configuración | Vault arranca, Yayo responde |
| 2-3 | Fase 2: templates + wiki completa | 120+ notas pre-cargadas, 9 templates |
| 4-5 | Fase 3: 5 tools nuevos + rebuild exe | generate_quiz, create_summary, generate_esquema, export_html, compare_notes |
| 6 | Fase 4: testing completo + entrega | Ainoa estudiando con Yayo |

---

## 12. Fuentes utilizadas en esta investigación

- [Directrices PEvAU 2025-2026 Historia de España (Junta de Andalucía)](https://www.juntadeandalucia.es/economiaconocimientoempresasyuniversidad/sguit/examanes_anios_anteriores/selectividad/sel_2025-2026-Orientaciones_historia_espana.pdf)
- [EASD Carlos Pérez Siquier — Bachillerato de Artes](https://www.eaalmeria.es/estudios/bachillerato-de-artes)
- [Temario Historia Selectividad Andalucía — Formar Formación](https://formarformacion.com/temario-historia-selectividad-andalucia/)
- [Novedades Selectividad 2026 — Academia Málaga](https://academia-malaga.es/blog/novedades-selectividad/)
- [Contenidos Historia de España 2º Bach — educaciongratuita.es](https://www.educaciongratuita.es/asignaturas/2-bachillerato/historia-de-espana/contenidos-historia-de-espana-2-bachillerato.php)
- [Temario Historia — academia-cordoba.es](https://academia-cordoba.es/blog/temario-historia-espana/)
- [PEvAU Andalucía exámenes resueltos — Selectividad Academy](https://www.selectividad.academy/examenes/andalucia/historia-de-espana)
- [Exámenes PEvAU Historia — examenesdepau.com](https://www.examenesdepau.com/examenes/andalucia/historia/)
- [Criterios evaluación MEC — Educagob](https://educagob.educacionfpydeportes.gob.es/curriculo/curriculo-lomloe/menu-curriculos-basicos/bachillerato/materias/historia-espana/criterios-evaluacion-segundo-curso.html)
- [Criterios corrección PEvAU — Junta de Andalucía](https://www.juntadeandalucia.es/economiaconocimientoempresasyuniversidad/sguit/?q=grados&d=g_b_criterios_correccion.php)
- Conversación previa con Grok (análisis de mercado PMV, estructura vault estudiantes)
- `28_05_2026_MEMORIA_PROBLEMAS_CLAUDE.md` (errores a evitar)
- `31_05_2026_MEMORIA_HECHO.md` (estado actual del stack)

---

*Plan v2 — 01/06/2026 por Claude Opus 4.6 a petición de Spas.*
*Cambios vs v1: Mistral default, vault YAYO_AINOA, solo pendientes (no PEvAU),
5 tools nuevos detallados, 9 templates, URLs de API keys en LÉEME, guía no-técnica.*
*Próximo paso: revisión por Spas → aprobación → ejecutar Fase 1.*
