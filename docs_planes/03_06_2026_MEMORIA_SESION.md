---
tipo: memoria-sesion
fecha: 2026-06-03
estado: completada-con-bug-pendiente
---

# Memoria Sesion 03/06/2026

## Resumen
- Vault YAYO_HELPER creado completo (tutor Historia España para Ainoa)
- 3 tools nuevos en proxy: create_summary, generate_esquema, generate_quiz
- Helper _tool_llm_call() para llamadas LLM internas sin recursión tools
- Sanitización de mensajes (_sanitize_messages) para evitar errores Mistral 3230
- MiniMax URL corregida (minimax-m2.com), Groq default cambiado
- Alias "yayo" añadido al proxy (agente-escritor sigue funcionando)
- Bug BMO textarea: PERSISTE — fix parcial, NO resuelto

## 1. Vault YAYO_HELPER (`/mnt/d/YAYO_HELPER/`)

### Estructura creada
```
/mnt/d/YAYO_HELPER/
├── 00_ESTUDIO/resumenes/, esquemas/, ejercicios/, examenes/
├── 01_CRUDO/
├── 02_WIKI/temario/ (12), conceptos/ (12), personajes/ (8), estrategia/ (3), cronologia/ (1)
├── 03_NOTAS/
├── 99_TEMPLATES/ (9 plantillas Templater con sintaxis dual)
├── BMO/Profiles/Yayo_Tutor.md, BMO.md
├── BMO/Chats/
├── .obsidian/ (copiado de Miguel Angel, limpiado)
├── .env (keys de Spas, Mistral default)
├── 1_arrancar.bat, 2_parar.bat, 3_verificar.bat
├── LEEME_PRIMERO.md
├── AgenteEscritor.exe (23.4 MB, con 22 tools)
├── mingit/
├── .gitignore
└── .git/ (init, user AINOA, ainoa@local)
```

### Wiki pre-cargada (36 notas)
- **Tier 1 (6 fichas completas ~100 líneas c/u):** Bloques 5, 6, 7, 10, 11, 12
- **Tier 2 (6 esqueletos ~30 líneas):** Bloques 1, 2, 3, 4, 8, 9
- **Conceptos (12):** Liberalismo, Absolutismo, Caciquismo, Desamortización, Pronunciamiento, Turno_pacífico, Autarquía, Desarrollismo, Falange, Constitución_1812, Constitución_1978, Soberanía_nacional
- **Personajes (8):** Fernando_VII, Isabel_II, Cánovas, Primo_de_Rivera, Azaña, Franco, Adolfo_Suárez, Juan_Carlos_I
- **Estrategia (3):** Plan_estudio, Formato_examen, Vocabulario_historico
- **Cronología (1):** Línea_temporal_general

### Perfil Yayo_Tutor.md
- Identidad: Yayo, tutor cercano pero riguroso
- Alumna: Ainoa, EASD Almería, pendientes 2º Bachillerato (NO PEvAU)
- 22 tools documentados (19 existentes + 3 nuevos)
- Modos: examen, repaso rápido, esquema
- Reglas: wiki first, NO inventar datos, wikilinks, español siempre
- Anti-alucinación: usar search_internet si duda, confiar en apuntes del profesor

### Templates (9, sintaxis dual Templater)
ficha_tema, ficha_concepto, ficha_personaje, ficha_documento, resumen_tema, simulacro_examen, comentario_texto, esquema_visual, presentacion_tema

### .obsidian copiada de Miguel Angel
- 9 plugins: bmo-chatbot, dataview, mcp-tools, mermaid-tools, obsidian-git, obsidian-local-rest-api, smart-connections, smart-lookup, templater-obsidian
- obsidian-git: authorName=AINOA, authorEmail=ainoa@local
- bmo-chatbot/data.json: vaciado historial Miguel, configurado REST API URL, modelos, perfil Yayo_Tutor
- workspace.json: borrado (Obsidian lo regenera)

## 2. Proxy — 3 tools nuevos + mejoras

### Archivo: `/home/spas/build_agente/proxy_agente_escritor.py`

#### _tool_llm_call() (~línea 942)
Helper interno para tools que generan contenido. Llama a `_chat_completion(provider, model, msgs, use_tools=False)` para evitar recursión de tools.

#### create_summary(nota_path, formato="bullet") (~línea 965)
1. Lee nota con read_obsidian_note
2. Prompt LLM: resume en formato bullet/parrafo/ficha, con wikilinks
3. Guarda en `00_ESTUDIO/resumenes/Resumen_{nombre}.md`
4. Devuelve path del resumen

#### generate_esquema(tema, formato="jerarquico") (~línea 1011)
1. Busca contexto wiki con find_similar_notes(tema, k=5)
2. Prompt LLM: esquema jerarquico/timeline/comparativo, bullets indentados, NO mermaid
3. Guarda en `00_ESTUDIO/esquemas/Esquema_{tema}.md`
4. Devuelve path del esquema

#### generate_quiz(tema, n_preguntas=5, tipo="mixto") (~línea 1064)
1. Busca contexto wiki con find_similar_notes(tema, k=5)
2. Prompt LLM: test (4 opciones), desarrollo, mixto, verdadero_falso
3. Incluye soluciones con explicación breve
4. Guarda en `00_ESTUDIO/ejercicios/Quiz_{tema}_{timestamp}.md`
5. Devuelve path + n_preguntas + tipo
6. SOLO para Yayo, NO para perfiles escritores

#### _sanitize_messages() (~línea 1755)
Fix para error Mistral 3230 (consecutive assistant messages):
1. Fusiona mensajes assistant consecutivos
2. Asegura que el último mensaje sea user/tool (añade "Continúa." si falta)
3. Elimina mensajes con content vacío

#### Alias "yayo"
- Endpoint /v1/models devuelve "yayo" + "agente-escritor" como modelos default
- Respuesta chat devuelve el model que pidió el cliente
- "yayo" y "agente-escritor" caen ambos al default provider del .env

#### Registros
- names_to_functions: +3 entradas
- tools[]: +3 schemas OpenAI format
- build_critical_context(): +3 descripciones

### Proveedores actualizados
| Proveedor | Cambio |
|-----------|--------|
| Groq | Default: `meta-llama/llama-4-scout-17b-16e-instruct` (antes llama-3.3-70b). 30K TPM vs 12K |
| MiniMax | URL: `https://minimax-m2.com/api/v1`, modelo: `MiniMax-M2.7` (antes api.minimax.io que daba 401) |
| Modelos Groq gratis añadidos | gpt-oss-120b, qwen/qwen3-32b, llama-4-scout |
| Modelos OpenRouter gratis añadidos | gpt-oss-120b:free, qwen3-coder-480b:free, nemotron-3-super-120b:free, gemma-4-31b-it:free, kimi-k2.6:free |

### Estado API keys de Ainoa (.env)
| Provider | Estado |
|----------|--------|
| Mistral | OK — funciona |
| DeepSeek | OK — funciona |
| Groq | OK — funciona (llama-4-scout, gpt-oss-120b, qwen3-32b) |
| Gemini | Key OK pero quota tier gratis agotada (429) |
| Kimi | OK — funciona (MOONSHOT_API_KEY) |
| MiniMax | Key nueva autentica pero saldo 0. Necesita cargar créditos |
| OpenRouter | Key OK pero sin $10 compra → 50 req/día. Pagar $10 una vez = 1000/día |

## 3. Bug BMO Textarea — NO RESUELTO

### Síntoma
Cuando NO hay conversaciones previas y se crea una nueva, el textarea NO acepta escritura por teclado. Pegar texto SÍ funciona. Minimizar y maximizar la ventana arregla el problema temporalmente.

### Causa raíz probable
Obsidian no asigna correctamente el routing de teclado al leaf del sidebar (BMO) durante la inicialización. El textarea está en el DOM, tiene event listeners, pero los keystrokes van a otro componente de Obsidian (file explorer, editor, etc). Al minimizar/maximizar se ejecuta un ciclo blur→focus que recalcula el leaf activo.

### Intentos de fix FALLIDOS (para que la siguiente IA no repita)

#### 1. Eliminar contenteditable del textarea (view.ts:178)
- **Qué:** Se quitó `textarea.setAttribute('contenteditable', true.toString())`
- **Por qué se intentó:** contenteditable + textarea nativo es conflicto DOM
- **Resultado:** No arregla el bug. El problema NO es contenteditable sino el routing de foco de Obsidian
- **Estado:** Cambio mantenido (era código malo igualmente)

#### 2. Mover <style> fuera del textarea (view.ts, main.ts, AppearanceSettings.ts)
- **Qué:** Los `<style>` elements se metían como hijos del `<textarea>` con `textarea.appendChild(style)`. Movidos a `document.head` con id `bmo-placeholder-style` reutilizable
- **Por qué se intentó:** DOM inválido (style dentro de textarea) podía corromper el content model
- **Resultado:** No arregla el bug. Pero era DOM inválido que se acumulaba → arreglado para siempre
- **Archivos:** view.ts (1 sitio), main.ts (2 sitios), AppearanceSettings.ts (2 sitios)
- **Estado:** Cambio mantenido (fix correcto de otro problema)

#### 3. saveSettings() condicional en handler delete (main.ts:390)
- **Qué:** `await this.saveSettings()` estaba fuera de los `if` blocks del handler de vault `delete`. Movido dentro de cada `if` para no dispararse en borrados irrelevantes
- **Por qué se intentó:** saveSettings() incondicional → modify event → updateProfile → cascada recursiva
- **Resultado:** No arregla el bug del textarea
- **Estado:** Cambio mantenido (era bug real de cascada)

#### 4. Path 3 loadOrCreateActiveConversation in-memory only (Conversations.ts:370-378)
- **Qué:** Cuando hay 0 conversaciones, se creaba archivo en disco + persistActiveSettings durante onOpen(). Cambiado a solo crear en memoria, persiste en primer mensaje via syncMessageHistoryToActive
- **Por qué se intentó:** I/O disco durante onOpen() interfiere con el layout de Obsidian
- **Resultado:** No arregla el bug del textarea
- **Estado:** Cambio mantenido (mejor comportamiento, menos I/O innecesario)

#### 5. Focus forzado con setTimeout en onOpen() y click handler (view.ts:230+)
- **Qué:** Añadidos `setTimeout(focusTextarea, 100)` y `setTimeout(focusTextarea, 500)` al final de onOpen(). Click handler en chatbox que fuerza focus en textarea
- **Por qué se intentó:** Si el problema es foco, forzarlo debería arreglarlo
- **Resultado:** No arregla el bug. Obsidian intercepta los keystrokes ANTES de que lleguen al textarea, incluso con focus. El foco visual está ahí pero el routing del teclado no
- **Estado:** Cambio mantenido (mejora UX en otros casos)

#### 6. Focus forzado tras crear nueva conversación en Sidebar (Sidebar.ts:82+)
- **Qué:** setTimeout 150ms con focus en textarea tras startNewActiveConversation
- **Resultado:** No arregla
- **Estado:** Cambio mantenido

### Lo que SÍ funciona (workaround)
- Minimizar y maximizar la ventana de Obsidian
- Esto fuerza un ciclo blur→focus a nivel de ventana Chromium/Electron
- Obsidian recalcula qué leaf tiene el routing de teclado

### Hipótesis no probadas (para la siguiente IA)
1. **`this.app.workspace.setActiveLeaf(leaf, {focus: true})`** — forzar que Obsidian reconozca el leaf de BMO como activo a nivel workspace, no solo a nivel DOM
2. **`this.app.workspace.revealLeaf(leaf)`** + delay — ya se hace en activateView pero no en onOpen
3. **Investigar `this.leaf`** en la clase BMOView — puede tener métodos para reclamar el foco del workspace
4. **Comprobar si el bug ocurre en el left sidebar** — si es solo right sidebar, puede ser un bug de Obsidian con sidebar derecho
5. **`activeWindow.dispatchEvent(new Event('resize'))`** — simular el efecto de minimizar/maximizar sin hacerlo
6. **Investigar si hay un hotkey handler global** de Obsidian que captura keystrokes antes del textarea

### Archivos modificados en BMO (todos los cambios)
| Archivo | Cambio |
|---------|--------|
| `src/view.ts` | -contenteditable, style→head, focus en onOpen + click handler |
| `src/main.ts` | style→head (2 sitios), saveSettings condicional en delete handler |
| `src/components/settings/AppearanceSettings.ts` | style→head (2 sitios) |
| `src/components/chat/Conversations.ts` | path 3 in-memory only |
| `src/components/chat/Sidebar.ts` | focus tras nueva conversación |

## 4. Deploy

### .exe (22 tools)
Build: Docker pyinstaller-windows → 23.4 MB
Deploy: YAYO_HELPER + Nina + Miguel Angel (3 vaults, mismo .exe)

### BMO main.js
Build: `npm run build` (tsc + esbuild)
Deploy: YAYO_HELPER + Nina + Miguel Angel (3 vaults, mismo main.js)

## 5. Investigación proveedores gratis

### Groq (todo gratis, sin tarjeta)
| Modelo | RPM | TPM | TPD | Tool calling |
|--------|-----|-----|-----|---|
| llama-4-scout-17b-16e-instruct | 30 | 30K | 500K | Sí |
| qwen/qwen3-32b | 60 | 6K | 500K | Sí |
| openai/gpt-oss-120b | 30 | 8K | 200K | Sí |
| llama-3.3-70b-versatile | 30 | 12K | 100K | A veces falla |

### OpenRouter (modelos :free)
- Sin compra de créditos: 50 req/día (inservible)
- Con $10 compra única: 1000 req/día para siempre
- Modelos gratis con tools: gemma-4-31b, gpt-oss-120b, qwen3-coder-480b, nemotron-3-super-120b, kimi-k2.6

### MiniMax
- minimax-m2.com ≠ platform.minimax.io (URLs y keys diferentes)
- URL correcta para key m2: `https://minimax-m2.com/api/v1`
- Modelos: MiniMax-M2.7, M2.5, M2.1, M2
- Pricing: $0.50/1M in, $1.50/1M out. Sin tier gratis confirmado

## 6. Sincronización Graphify
Ejecutada al final de sesión: update 3 repos + merge.

## 7. Pendientes
- [ ] Bug textarea BMO (ver hipótesis no probadas arriba)
- [ ] OBSIDIAN_REST_API_KEY pendiente de copiar en .env de Ainoa
- [ ] Testear tools create_summary, generate_esquema, generate_quiz con Yayo funcionando
- [ ] Deploy create_summary + generate_esquema a perfiles Nina y Miguel (sin generate_quiz)
- [ ] Cargar $10 en OpenRouter para desbloquear 1000 req/día
- [ ] MiniMax: cargar saldo o registrar en platform.minimax.io (free trial hasta nov 2026)
- [ ] Actualizar wiki OPOS_PROJECT

## Enlaces
- Vault Yayo: `/mnt/d/YAYO_HELPER/`
- Perfil tutor: `/mnt/d/YAYO_HELPER/BMO/Profiles/Yayo_Tutor.md`
- Proxy fuente: `/home/spas/build_agente/proxy_agente_escritor.py`
- Proxy backup: `/home/spas/OPOS_GEMINI_1/backend/proxy_agente_escritor.py`
- Plan aprobado: `/home/spas/.claude/plans/zany-doodling-spindle.md`
- Plan Ainoa original: `/home/spas/obsidian-bmo-chatbot-plus/docs_planes/PLAN_VARIANTE_BACHILLERATO_AINOA.md`
