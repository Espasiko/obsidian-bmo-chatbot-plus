---
title: HANDOFF LibrarIA — Fase d verificada, lista para deploy
fecha: 2026-06-16
autor: Claude Opus 4.8 (continuación del handoff del Cascade)
estado: Fase A COMPLETA · Fase d CÓDIGO HECHO + VERIFICADO + BUILD OK · FALTA commitear y desplegar
complementa: HANDOFF_LibrarIA_2026-06-16.md (handoff detallado del Cascade — leerlo también)
---

# HANDOFF LibrarIA (16/06) — Fase d verificada, lista para desplegar

> **Para quien continúe:** este doc actualiza el estado tras VERIFICAR la Fase d. El handoff base
> (con todo el detalle de Fase A, el cableado y los 12 agentes) es `HANDOFF_LibrarIA_2026-06-16.md`.
> Aquí solo: qué verifiqué, el AVISO de código sin commitear, y los próximos pasos exactos.

---

## 1. Estado actual (resumen)
- **Fase A — COMPLETA:** vault `D:\LibrarIA` (= `/mnt/d/LibrarIA/`) montado: 12 agentes (perfiles BMO en
  `BMO/Profiles/`), `.obsidian` clonado de Miguel (9 plugins), `AgenteEscritor.exe` (puerto 9000, build con
  26 tools), `.env` (Mistral/Groq/Gemini/DeepSeek), `data.json` cableado, `.bat`. Probado: MaestrIA+Mistral OK.
- **Fase d — autocompletado `@agentes` / `/comandos`: CÓDIGO HECHO, VERIFICADO Y COMPILA. NO desplegado.**

## 2. Lo que VERIFIQUÉ hoy (Fase d está completa)
- `src/components/chat/Autocomplete.ts` (240 líneas): clase `ChatAutocomplete` con `onInput`, `onKeyDown`,
  `handleKeyupGuard`, `destroy`, constante `COMMANDS`, y al elegir agente → `executeCommand('/profile <Nombre>')`.
- `src/view.ts`: **las 7 ediciones presentes** (import, miembro `private autocomplete`, `new ChatAutocomplete`,
  guard en `handleKeydown`→`onKeyDown`, guard en `handleKeyup`→`handleKeyupGuard`, `onInput` en `handleInput`,
  `destroy` en `onClose`).
- `styles.css`: bloque `.bmo-autocomplete` + `.bmo-ac-item` + **`.chatbox { position: relative }`** (ancla el popup).
- **`npm run build` (tsc + esbuild) → exit 0.** `main.js` recompilado con la feature (refs a `ChatAutocomplete`).

## 3. ⚠️ AVISO IMPORTANTE — el código de Fase d está SIN COMMITEAR
En `/home/spas/obsidian-bmo-chatbot-plus/`:
- `?? src/components/chat/Autocomplete.ts` (untracked)
- `M  src/view.ts`
- `M  styles.css`
- (`main.js` es **gitignored** — build artifact, se regenera con `npm run build`)

👉 **Casi se pierde una vez** (un revert de `view.ts` durante una crisis previa). **LO PRIMERO al continuar:
commitear estos 3 archivos** para asegurarlos en git, antes de desplegar.

---

## 4. PRÓXIMOS PASOS EXACTOS (en orden)

### Paso 1 — Commitear Fase d (asegurar el código)
```bash
cd /home/spas/obsidian-bmo-chatbot-plus
git add src/components/chat/Autocomplete.ts src/view.ts styles.css
git commit -m "feat(chat): autocompletado @agentes y /comandos en el chat de BMO (Fase d)"
git push origin feature/multi-chat
```

### Paso 2 — Desplegar a LibrarIA (probar SOLO ahí primero)
```bash
cp /home/spas/obsidian-bmo-chatbot-plus/main.js \
   /home/spas/obsidian-bmo-chatbot-plus/styles.css \
   /mnt/d/LibrarIA/.obsidian/plugins/bmo-chatbot/
```
- (Existe la skill `deploy-bmo` para build+deploy a todos los vaults; **verificar que incluye `D:\LibrarIA`** antes de usarla. Para probar, mejor copiar solo a LibrarIA.)

### Paso 3 — Probar en Obsidian (Windows)
1. Arrancar proxy: doble clic `D:\LibrarIA\1_arrancar.bat` (esperar `Application startup complete`).
2. Abrir `D:\LibrarIA` como vault.
3. **Settings → Community plugins → desactivar y reactivar "BMO"** (carga el `main.js` nuevo).
4. En el chat: teclear **`@`** (debe salir lista de los 12 agentes; al elegir uno cambia de perfil) y
   **`/`** (lista de comandos, rellena el texto).
5. Confirmar que con el popup cerrado el chat va igual (Enter envía, Shift+Enter salto de línea).

---

## 5. PENDIENTES (después de Fase d, en orden)
1. **Bug "borrar conversación deja restos en el lateral".** Conviven 2 sistemas de historial:
   `chatHistory`/`messageHistory` (`/clear`=`removeMessageThread`, ficheros `data/messageHistory_*.json`) y el
   nuevo `conversations` (lateral: `src/components/chat/Sidebar.ts`, `Conversations.ts`, `ConversationHeader.ts`).
   Revisar `Sidebar.ts` (`refreshSidebar`, `deleteConversation`) y `Commands.ts` (`/clear`, `/save`, `/load`).
2. **Gemini 503** (throttling de Google, no es bug nuestro). Si persiste, cambiar `model:` en los 7 perfiles
   Gemini de `D:\LibrarIA\BMO\Profiles\*.md` a `mistral:mistral-large-latest`. Reversible.
3. **FASE B — grafo de conocimiento (en el BACKEND del proxy, NO en este repo del plugin):**
   `graph_store.py` + tool `graph_cypher` + indexador vault→grafo (personajes/lugares/eventos/`deriva_de`).
   Recompilar `.exe` con skill `rebuild-exe`. Reactivar consultas exactas en GardIA/CronistIA/ContinuIA/BibliotecarIA.

## 6. ⚠️ Cosas a VERIFICAR (no dar por hechas)
- El handoff del Cascade dice *"usar **LadybugDB**, sucesor de Kuzu; Kuzu legacy en jun-2026"*. **VERIFICAR esto**
  antes de Fase B — la decisión firme del proyecto era **Kuzu** (PRD Cerebrito + `PLAN_CEREBRITO_DURGA_05_06_26.md`);
  no me consta que esté obsoleto. Confirmar con búsqueda real antes de cambiar de motor.
- Deploy de Fase d es **aditivo** (no debería tocar el dropdown de modelos), pero **probar solo en LibrarIA primero**.
  Hubo un incidente previo donde `RESTAPIURLModels` de un vault se vació al refrescar con el proxy caído → no usar
  "refrescar URL" en BMO con el proxy apagado.

## 7. Rutas y datos clave
| Qué | Ruta / dato |
|---|---|
| Vault LibrarIA | `/mnt/d/LibrarIA/` (`D:\LibrarIA`) |
| Repo plugin BMO | `/home/spas/obsidian-bmo-chatbot-plus/` (rama `feature/multi-chat`) |
| Proxy source | `/home/spas/build_agente/proxy_agente_escritor.py` (backup commiteado en `OPOS_GEMINI_1/backend/`) |
| Proxy URL | `http://localhost:9000/v1` (el `.exe` usa su propia carpeta como vault; sin `VAULT_PATH`) |
| OBSIDIAN_REST_API_KEY | `d4bae2eda0b859372b99dcebbafb0c728fd647bbea13839609746c5fe472676e` (debe = key del plugin Local REST API) |
| Modelos por defecto | gemini-flash-latest (7 agentes), gemini-3-flash-preview (MundalIA), mistral-large (PersonalIA/ProsaIA/EstilIA), mistral-small (CartografIA) |
| Skills útiles | `deploy-bmo` (deploy plugin), `rebuild-exe` (recompilar .exe), `arrancar-chandra`, `sync-graphify` |

---

## 8. Decisiones tomadas (NO re-litigar)
- 12 agentes en el MVP; diferidos: MaquetIA, MercadIA, BloguerIA, Autopiloto.
- Enfoque **prompt-first** (agentes = perfiles `.md`; Fase A no tocó código).
- HITL estricto (agentes proponen estado `propuesta`/`canon`, el autor decide).
- Defaults gratis (Gemini/Mistral) para pruebas; premium (Claude/DeepSeek) al final.

*Fin del handoff. Continuación: Paso 1 (commit) → Paso 2 (deploy a LibrarIA) → Paso 3 (probar @ y /).*
