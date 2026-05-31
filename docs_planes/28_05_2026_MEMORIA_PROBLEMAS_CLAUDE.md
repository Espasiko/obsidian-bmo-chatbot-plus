# Memoria de Sesion 28/05/2026 — Problemas BMO Plugin + AgenteEscritor

> **ESTADO FINAL: NO SE PUEDE ESCRIBIR EN EL CHAT BMO.**
> Despues de TODOS los cambios descritos abajo, el problema principal persiste:
> el usuario no puede teclear en el textarea del chat de BMO Chatbot en Obsidian.
> El icono puede o no aparecer, pero el input de texto NO FUNCIONA.

---

## Contexto

- Repo BMO fork: `/home/spas/obsidian-bmo-chatbot-plus/`
- Vault Nina: `/mnt/d/AgenteEscritor_Para_Nina/`
- Plugin destino: `/mnt/d/AgenteEscritor_Para_Nina/.obsidian/plugins/bmo-chatbot/`
- Proxy: `AgenteEscritor.exe` en puerto 9000 (antes 8000)
- El plugin funcionaba PERFECTAMENTE antes de las ediciones de esta sesion y la anterior (27-28/05/2026)

---

## Problema reportado por el usuario

1. El icono de BMO no aparece en la barra lateral de Obsidian
2. Cuando aparece, NO SE PUEDE ESCRIBIR en el textarea del chat
3. Error "Oops, something went wrong. Please try again." al intentar enviar
4. Despues del error, el chat se bloquea permanentemente (no acepta mas input)
5. **Probado en DOS ordenadores diferentes** — mismo problema en ambos
6. El usuario confirma que la version ANTERIOR (sin estas ediciones) funcionaba perfectamente

---

## Cambios realizados en esta sesion (27-28/05/2026)

### 1. styles.css — Sidebar CSS (lineas ~632-652)

**Archivo:** `/home/spas/obsidian-bmo-chatbot-plus/styles.css`

**Cambio:** Se anadio `visibility: hidden;` y `pointer-events: none;` al selector `.bmo-conversations-sidebar` para evitar que el sidebar oculto intercepte eventos del textarea.

```css
/* ANTES */
.bmo-conversations-sidebar {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 240px; max-width: 80%;
  transform: translateX(-100%);
  transition: transform 0.2s ease;
  z-index: 10;
  display: flex; flex-direction: column; overflow: hidden;
}

/* DESPUES */
.bmo-conversations-sidebar {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 240px; max-width: 80%;
  transform: translateX(-100%);
  transition: transform 0.2s ease, visibility 0s 0.2s;
  z-index: 10;
  display: flex; flex-direction: column; overflow: hidden;
  visibility: hidden;       /* ANADIDO */
  pointer-events: none;     /* ANADIDO */
}

.chatbotContainer.bmo-sidebar-open .bmo-conversations-sidebar {
  transform: translateX(0);
  visibility: visible;       /* ANADIDO */
  pointer-events: auto;      /* ANADIDO */
  transition: transform 0.2s ease, visibility 0s 0s;  /* ANADIDO */
}
```

**Razon:** Teoria de que el sidebar con position:absolute y z-index:10 interceptaba clicks/teclado aunque estuviera fuera de pantalla con translateX(-100%).

### 2. view.ts — preventEnter bug (lineas ~430-441)

**Archivo:** `/home/spas/obsidian-bmo-chatbot-plus/src/view.ts`

**Cambio:** Se anadio `this.preventEnter = false;` en el bloque `.catch()` de la llamada a `BMOchatbot()`.

```typescript
// ANTES
this.preventEnter = true;
this.BMOchatbot()
    .then(() => {
        this.preventEnter = false;
    })
    .catch(() => {
        // preventEnter NUNCA se reseteaba aqui!
        const messageContainer = document.querySelector('#messageContainer') as HTMLDivElement;
        const botMessageDiv = displayErrorBotMessage(this.plugin, this.settings, messageHistory, 'Oops, something went wrong. Please try again.');
        messageContainer.appendChild(botMessageDiv);
    });

// DESPUES
this.preventEnter = true;
this.BMOchatbot()
    .then(() => {
        this.preventEnter = false;
    })
    .catch(() => {
        this.preventEnter = false;  // <-- ANADIDO
        const messageContainer = document.querySelector('#messageContainer') as HTMLDivElement;
        const botMessageDiv = displayErrorBotMessage(this.plugin, this.settings, messageHistory, 'Oops, something went wrong. Please try again.');
        messageContainer.appendChild(botMessageDiv);
    });
```

**Razon:** Despues de un error en BMOchatbot(), `preventEnter` se quedaba en `true` para siempre, bloqueando toda entrada de texto posterior.

### 3. Puerto cambiado de 8000 a 9000

**Archivos afectados:**
- `/mnt/d/AgenteEscritor_Para_Nina/.env` — `PROXY_PORT=9000`
- `/mnt/d/AgenteEscritor_Para_Nina/.obsidian/plugins/bmo-chatbot/data.json` — `RESTAPIURL: "http://localhost:9000/v1"`
- `/mnt/d/AgenteEscritor_Para_Nina/1_arrancar.bat` — puerto 9000
- `/mnt/d/AgenteEscritor_Para_Nina/2_parar.bat` — puerto 9000
- `/mnt/d/AgenteEscritor_Para_Nina/3_verificar.bat` — puerto 9000
- `/mnt/d/AgenteEscritor_Para_Nina/LEEME.txt` — puerto 9000

**Razon:** `svchost.exe` de Windows ocupaba `127.0.0.1:8000` (PID 6540), causando `ERR_CONNECTION_RESET` cuando Obsidian intentaba conectar al proxy. El proxy escuchaba en `0.0.0.0:8000` pero svchost interceptaba las conexiones localhost.

### 4. Plugins limpiados

**Archivo:** `/mnt/d/AgenteEscritor_Para_Nina/.obsidian/community-plugins.json`

**Antes:** Contenia "copilot" (sin carpeta correspondiente — plugin fantasma) y muchos otros.

**Despues:**
```json
[
  "obsidian-local-rest-api",
  "bmo-chatbot",
  "smart-connections",
  "dataview"
]
```

**Plugins ELIMINADOS de la carpeta plugins/:**
- `mcp-tools` (115MB!)
- `smart-chatgpt` (tenia 43 interceptores de textarea — posible causa de bloqueo de input)
- `syncthing-integration`
- `remotely-save`
- `obsidian-git`
- `obsidian-mind-map`
- `quickadd`
- `smart-context`
- `smart-lookup`

**Razon:** 
- "copilot" fantasma causaba error de carga de Obsidian al inicio
- `smart-chatgpt` interceptaba eventos del textarea con 43 event listeners
- Los demas no eran necesarios y ocupaban espacio

### 5. Archivos ocultos en Obsidian

**Archivo:** `/mnt/d/AgenteEscritor_Para_Nina/.obsidian/app.json`

```json
{
  "showUnsupportedFiles": false,
  "uriCallbacks": true,
  "alwaysUpdateLinks": true,
  "userIgnoreFilters": [
    "AgenteEscritor.exe",
    "*.bat",
    "*.txt",
    ".env",
    "logs/"
  ]
}
```

**Razon:** El usuario no quiere que Nina vea archivos de sistema en el explorador del vault.

### 6. Historial stale eliminado

**Archivo eliminado:** `/mnt/d/AgenteEscritor_Para_Nina/.obsidian/plugins/bmo-chatbot/data/messageHistory_BMO.json` (349KB)

**Razon:** Historial antiguo del perfil BMO por defecto, no del perfil Nina_Editor.

### 7. Build ejecutado

```bash
cd /home/spas/obsidian-bmo-chatbot-plus && npm run build
# > bmo-chatbot@2.3.3 build
# > tsc -noEmit -skipLibCheck && node esbuild.config.mjs production
# Compilacion exitosa, 0 errores
```

Archivos generados:
- `/home/spas/obsidian-bmo-chatbot-plus/main.js` (475,934 bytes)
- `/home/spas/obsidian-bmo-chatbot-plus/styles.css` (16,486 bytes)

Copiados a:
- `/mnt/d/AgenteEscritor_Para_Nina/.obsidian/plugins/bmo-chatbot/main.js`
- `/mnt/d/AgenteEscritor_Para_Nina/.obsidian/plugins/bmo-chatbot/styles.css`

---

## Archivos clave del plugin para debugging

| Archivo | Que hace | Lineas clave |
|---------|----------|--------------|
| `src/view.ts` | Vista principal del chat, manejo de Enter, preventEnter | ~430-441 (preventEnter), textarea creation |
| `src/main.ts` | onload(), ribbon icon, registerView | ~256 (onload), ~498 (addRibbonIcon) |
| `src/components/FetchModelResponse.ts` | Llamadas HTTP al proxy | ~366-458 (fetchRESTAPIURLResponse) |
| `src/components/chat/Conversations.ts` | CRUD conversaciones, multi-chat | ~414 (startNewActiveConversation) |
| `src/components/chat/Sidebar.ts` | Sidebar de conversaciones, toggle, search | createConversationsSidebar() |
| `styles.css` | Todo el CSS del plugin | ~632-652 (sidebar), todo el layout |

---

## Configuracion actual del plugin (data.json)

- **Modelo:** `agente-escritor`
- **URL proxy:** `http://localhost:9000/v1`
- **Perfil:** `Nina_Editor.md` en `BMO/Profiles/`
- **System role:** 7 tools en bulgaro (read, create, update, overwrite, delete, list_vault_files, search_internet)
- **Streaming:** DESACTIVADO (`enableStream: false`)
- **Max tokens:** 4096
- **Temperature:** 0.30
- **Conversaciones:** carpeta `BMO/Chats/`, auto-title activado

---

## Proxy AgenteEscritor (contexto)

- **Archivo repo:** `/home/spas/OPOS_GEMINI_1/backend/proxy_agente_escritor.py` (639 lineas)
- **Archivo build:** `/home/spas/build_agente/proxy_agente_escritor.py` (715 lineas, con adaptaciones Windows)
- **7 tools:** read_obsidian_note, create_obsidian_note, update_obsidian_note, overwrite_obsidian_note, delete_obsidian_note, list_vault_files, search_internet
- **Puerto:** 9000
- **Backend:** FastAPI + uvicorn
- **LLM:** Mistral via API (medium-latest)
- **Obsidian REST API bridge:** `http://172.26.240.1:27123` (WSL) o `http://localhost:27123` (Windows)
- **API Key Obsidian:** `097befc68922b9c32d6388ebbb871e127c5c9037af91a83813107e5e1e60699d`

---

## PROBLEMA SIN RESOLVER

**DESPUES DE TODOS ESTOS CAMBIOS, NO SE PUEDE ESCRIBIR EN EL CHAT.**

El textarea del chat de BMO no acepta input del teclado. Este es el problema principal que motivó todos los cambios anteriores, y NINGUNO lo ha resuelto.

Posibles causas NO investigadas todavia:
1. **Algo en view.ts que bloquea el textarea** — revisar toda la logica de creacion del textarea y event listeners de keydown/keypress
2. **El textarea se crea pero otro elemento lo tapa** — inspeccionar con DevTools de Obsidian (Ctrl+Shift+I)
3. **Event listeners duplicados o mal registrados** — revisar si hay addEventListener sin removeEventListener
4. **Conflicto con el sistema de conversaciones** — el usuario reporto que al borrar conversaciones y quedar solo "Nueva conversacion", no puede escribir
5. **El CSS del textarea** — revisar si tiene `pointer-events: none`, `user-select: none`, `contenteditable: false` o similar
6. **Error silencioso en onload()** — si algo falla antes de registerView, la vista puede cargarse incompleta

**Para debuggear:**
- Abrir Obsidian con el vault
- Ctrl+Shift+I para abrir DevTools
- Ir a Console y buscar errores
- Inspeccionar el textarea: verificar que existe, que tiene focus, que no hay overlay
- Verificar en Network que no hay llamadas fallidas al cargar el plugin
- Comparar con la version anterior del main.js que SI funcionaba

---

## Version anterior que funcionaba

Si nada funciona, restaurar el main.js y styles.css de la version anterior. 
El commit anterior en el repo de BMO Plus tendra los archivos que si funcionaban.

```bash
cd /home/spas/obsidian-bmo-chatbot-plus
git log --oneline -10  # ver commits recientes
git show HEAD~1:main.js > /tmp/main_old.js  # extraer version anterior
git show HEAD~1:styles.css > /tmp/styles_old.css
# copiar a vault si funcionan
```

---

*Documento creado el 28/05/2026 por Claude Opus 4.6 a peticion de Spas.*
*El proximo modelo que continue debe priorizar resolver el problema de input del textarea.*
