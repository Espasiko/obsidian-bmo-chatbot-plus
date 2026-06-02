---
tipo: memoria_problema
fecha: 2026-06-01
estado: NO RESUELTO
componente: AgenteEscritor proxy + Obsidian Local REST API
vault_afectado: Miguel Ángel (probablemente Nina también)
investigador: Claude Opus 4.6
tags: [bug, rest_api, 401, obsidian, proxy, no_resuelto]
---

# Bug: HTTP 401 en TODAS las llamadas autenticadas a Obsidian REST API

## Síntoma

El proxy AgenteEscritor.exe no puede crear, editar ni borrar notas en el vault
de Miguel Ángel. La LLM (GPT-4o-mini, Mistral Large) ejecuta los tools
(`create_obsidian_note`, `update_obsidian_note`, etc.) pero la Obsidian Local
REST API devuelve **401 Authorization Required** en TODOS los casos.

El usuario ve: "No puedo crear la nota, error de autorización 401".

## Datos duros del diagnóstico `/diagnose`

Se añadió un endpoint `GET /diagnose` al proxy que ejecuta 7 tests contra la
REST API. Resultado (01/06/2026 ~20:40):

| Test | Método | Headers | Resultado |
|------|--------|---------|-----------|
| 1. GET `/` (root, sin auth) | GET | ninguno | **200 OK** |
| 2. GET `/vault/` (con auth) | GET | Authorization: Bearer d4bae... | **401** |
| 3. PUT `/vault/test.md` (HEADERS compartido) | PUT | Authorization + Content-Type | **401** |
| 4. PUT `/vault/test.md` (headers fresh) | PUT | Authorization + Content-Type | **401** |
| 5. PUT `/vault/test.md` (sin Content-Type) | PUT | Solo Authorization | **401** |
| 6. POST `/vault/test.md` (append) | POST | Authorization + Content-Type | **401** |
| 7. DELETE `/vault/test.md` | DELETE | Solo Authorization | **401** |

**TODOS los requests autenticados fallan.** Solo la raíz `/` funciona porque
el plugin la exime de auth explícitamente en el código:
```javascript
const authenticationExemptRoutes = ["/", `/${CERT_NAME}`, "/openapi.yaml"];
```

## La key ES correcta (verificado por el usuario)

- `.env` de Miguel: `OBSIDIAN_REST_API_KEY=d4bae2eda0b859372b99dcebbafb0c728fd647bbea13839609746c5fe472676e`
- `data.json` del plugin REST API: `"apiKey": "d4bae2eda0b859372b99dcebbafb0c728fd647bbea13839609746c5fe472676e"`
- Obsidian Settings → Local REST API: **misma key** (confirmado por Spas visualmente)

El proxy envía exactamente `Authorization: Bearer d4bae2eda0b859372b99dcebbafb0c728fd647bbea13839609746c5fe472676e`.

El plugin REST API comprueba:
```javascript
requestIsAuthenticated(req) {
    const authorizationHeader = req.get(this.settings.authorizationHeaderName ?? "Authorization");
    return authorizationHeader === `Bearer ${this.settings.apiKey}`;
}
```

Comparación estricta (`===`). La key coincide carácter a carácter. No debería fallar.

## Lo que NO es el problema (descartado)

| Hipótesis | Descartado porque |
|-----------|-------------------|
| Content-Type interfiere con auth | Test 5 (sin Content-Type) también da 401 |
| Solo PUT falla (GET funciona) | Test 2 (GET /vault/) también da 401 |
| Key diferente en .env vs plugin | Verificado byte a byte: idénticas |
| Key diferente en disco vs memoria | Spas copió la key de Obsidian Settings → es la misma |
| `requests` modifica HEADERS dict | Probado: no lo modifica |
| body parser de Express rompe auth | Auth middleware va ANTES de body parsers en el código del plugin |
| Encoding del header (charset) | Python `requests` envía UTF-8 correcto |
| Plugin en modo read-only | No existe tal setting en v3.6.1 |
| Puerto incorrecto | proxy → 27123 (HTTP insecure), config confirma `enableInsecureServer: true` |

## Lo que NO he probado (ideas para Spas)

1. **¿`this.settings` del plugin tiene la key cargada en runtime?**
   - Abrir la consola de Obsidian (Ctrl+Shift+I → Console) y ejecutar:
     ```javascript
     app.plugins.plugins["obsidian-local-rest-api"].settings.apiKey
     ```
   - Si devuelve algo diferente a `d4bae2eda...`, ESA es la causa.

2. **¿Hay un proxy/firewall/antivirus que modifica los headers HTTP?**
   - Windows Defender, o un proxy corporativo, podría estar stripping el header
     Authorization de las peticiones a localhost.

3. **¿El plugin REST API tiene un custom `authorizationHeaderName`?**
   - No aparece en `data.json`, pero quizá está en `this.settings` con otro nombre.
   - Probar desde consola de Obsidian:
     ```javascript
     app.plugins.plugins["obsidian-local-rest-api"].settings.authorizationHeaderName
     ```

4. **¿Funciona con curl desde CMD de Windows?**
   ```cmd
   curl -H "Authorization: Bearer d4bae2eda0b859372b99dcebbafb0c728fd647bbea13839609746c5fe472676e" http://127.0.0.1:27123/vault/
   ```
   - Si esto también da 401, el problema es del plugin Obsidian, no del proxy.
   - Si esto da 200, el problema es cómo Python `requests` envía los headers.

5. **¿Desactivar y reactivar el plugin REST API ayuda?**
   - Settings → Community Plugins → desactivar "Local REST API" → reactivar.

6. **¿Reinstalar el plugin REST API?**
   - Borrar la carpeta `.obsidian/plugins/obsidian-local-rest-api/` y reinstalar
     desde Community Plugins. La key se regenerará — copiar la nueva al `.env`.

## Mis intentos fallidos (para que no se repitan)

### Intento 1: Añadir logging de resultados de tools
- **Qué hice:** Antes el proxy no logeaba el resultado de los tools. Añadí log
  del resultado (con warning si contiene "Error" o "Fallo").
- **Resultado:** Permitió ver el 401 en los logs. Útil para diagnóstico pero no
  arregla nada.

### Intento 2: Logging HTTP detallado en create/update/overwrite
- **Qué hice:** Ahora `create_obsidian_note` logea `HTTP {status}: {body}`
  cuando falla.
- **Resultado:** Confirma que el 401 viene de la REST API de Obsidian, no de
  otro componente. Útil pero no arregla nada.

### Intento 3: Endpoint `/diagnose`
- **Qué hice:** Añadí `GET /diagnose` que prueba 7 variantes de requests contra
  la REST API (GET, PUT, POST, DELETE, con/sin Content-Type, etc.).
- **Resultado:** Demostró que TODOS los requests autenticados fallan, no solo PUT.
  Descartó la hipótesis de Content-Type y de diferencia GET vs PUT.

### Intento 4: Hipótesis de key cambiada en runtime
- **Qué hice:** Sugerí que Obsidian podría haber regenerado la key.
- **Resultado:** INCORRECTO. Spas verificó que la key en Settings es la misma.

### Error de razonamiento principal
Asumí que `list_vault_files` funcionaba en los logs anteriores porque aparecía
`✔️`. En realidad devolvía "No se encontraron archivos" — que podría ser tanto
un resultado legítimo como un error silenciado. Con el /diagnose se confirmó que
incluso los GETs autenticados fallan, así que `list_vault_files` TAMPOCO funcionaba
realmente (simplemente no tenía error visible porque la función devolvía "no hay
archivos" en vez de "401").

**Sin embargo**, los logs DE ANTES del rebuild (17:23-17:34) sí muestran tools
ejecutándose correctamente (read_pdf con OCR, list_vault_files devolviendo archivos,
git_save haciendo commits). Algo cambió entre esos logs y el estado actual.

## Datos del entorno

| Componente | Versión/dato |
|-----------|-------------|
| Plugin REST API | v3.6.1 (Adam Coddington) |
| Puerto HTTP insecure | 27123 |
| Puerto HTTPS secure | 27124 |
| Proxy | AgenteEscritor.exe, FastAPI, puerto 9000 |
| OS | Windows (WSL2 underneath) |
| Obsidian | Desktop |
| Python en .exe | 3.x (PyInstaller bundle) |

## Código relevante

- **Auth check del plugin:** `main.js:57169` — `requestIsAuthenticated(req)` —
  comparación estricta `req.get("Authorization") === Bearer ${apiKey}`
- **Auth middleware:** `main.js:57181` — `authenticationMiddleware` — exime `/`,
  `/obsidian-local-rest-api.crt`, `/openapi.yaml`
- **HEADERS del proxy:** `proxy_agente_escritor.py:159` — dict global
  `{"Authorization": "Bearer {key}", "Content-Type": "text/markdown"}`
- **create_obsidian_note:** `proxy_agente_escritor.py:182` — PUT a
  `{OBSIDIAN_URL}/vault/{filename}` con `headers=HEADERS`

## Archivos modificados en esta sesión (proxy)

1. `proxy_agente_escritor.py:1318-1327` — logging de resultado de tools
2. `proxy_agente_escritor.py:182-195` — logging HTTP en create_obsidian_note
3. `proxy_agente_escritor.py:196-210` — logging HTTP en update_obsidian_note
4. `proxy_agente_escritor.py:212-226` — logging HTTP en overwrite_obsidian_note
5. `proxy_agente_escritor.py:1170+` — endpoint `/diagnose` (7 tests E2E)
6. `.exe` recompilado y desplegado 2 veces

---

*01/06/2026 — Claude Opus 4.6. Bug no resuelto. Pendiente de investigación manual por Spas.*
