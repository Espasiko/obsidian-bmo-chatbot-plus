---
tipo: memoria-sesion
fecha: 2026-06-02
estado: completada
---

# Memoria Sesion 02/06/2026

## Resumen
- Bug HTTP 401 RESUELTO (netsh portproxy)
- 3 tools nuevas: ingest_file, scan_disk_files, list_vault_files ampliada
- Deploy .exe a Miguel + Nina
- Docs wiki + pushes GitHub
- MCP memory: 8 entidades nuevas, 14 relaciones
- Arquitectura Cerebrito explicada

## 1. Bug HTTP 401
Causa real: Windows `netsh interface portproxy` interceptaba puertos 27123/27124.
Fix: `netsh interface portproxy delete v4tov4 listenport=27123/27124`
Resultado: Cero errores 401 resto del dia. Docs en wiki.

## 2. Tools Nuevas
- **ingest_file**: convierte docx/pdf/txt/csv/rtf -> .md gemelo con YAML frontmatter
- **scan_disk_files**: lee disco directamente (bypass REST API cuando Obsidian oculta archivos)
- **list_vault_files**: ahora `extension=""` lista todas las extensiones recursivamente

## 3. Deploy .exe
Build docker -> AgenteEscritor.exe (23,4 MB). Deploy a Miguel y Nina.
Fix Miguel app.json: `showUnsupportedFiles: true`. Nina identificado pero no tocado.

## 4. Documentacion + Pushes
Wiki OPOS_PROJECT: Sesion_02_06, Windows_Bridges, AgenteEscritor_Proxy, _index, Lecciones, Graphify
GitHub pushes: OPOS_GEMINI_1 main (1aed1b1), obsidian-bmo-chatbot-plus feature/multi-chat (eab8dd2)

## 5. MCP Memory (8 entidades)
Sesion_02_06_Bug401_Ingest, Windows_Portproxy_Bug_27123, Windows_Bridges_Puertos_Procesos,
Vault_MiguelAngel_AppJson_Fix_02_06, Tool_ingest_file, Tool_scan_disk_files,
Graphify_CLI_Setup, Graphify_Sync_Workflow. + 14 relaciones + 7 observaciones a AgenteEscritor_Proxy.

## 6. Arquitectura Cerebrito — 4 Repos
1. obsidian-bmo-chatbot-plus (TIENDA BMO) - existe, feature/multi-chat
2. OPOS_GEMINI_1 (TIENDA OPOS) - existe, main intocable
3. cerebrito-backend (TIENDA CEREBRITO, puerto 27182) - NO EXISTE, hoy en build_agente
4. shared-tools (ALMACEN, submodule) - NO EXISTE, hoy duplicado

shared-tools submodule: una sola fuente de verdad para vault_tools.py, pdf_tools.py, etc.
4 SKUs via build flags (NO branches): Lite, Privacy, OPOS Pack, OPOS Server.

## 7. Estado Miguel
Tools usadas con exito: create_obsidian_note(6), read_docx(5), scan_disk_files(4), read_pdf(2),
list_vault_files(2), ingest_file(2), read_obsidian_note(1), fetch_url(1).
Errores terceros: OpenRouter 402 (sin creditos), Mistral code:3230 (bug proxy historial).

## 8. Estado Nina
.exe = mismo binario Miguel (19 tools). system_role actualizado a 19 tools en bulgaro
con scan_disk_files + ingest_file + ejemplos nuevos. Backup creado.

## 9. Graphify
NO regenerado (timing 5-10 min excesivo). Documentado en wiki con TL;DR.
Binario: /home/spas/OPOS_GEMINI_1/.venv/bin/graphify v0.8.13

## 10. Pendientes
- Plan Ainoa bachillerato (revisar PLAN_VARIANTE_BACHILLERATO_AINOA.md)
- Doc seguridad plugins para LLMs
- Fix bug Mistral code:3230 en proxy
- Graphify sync (cuando usuario tenga tiempo)
- Crear repos 3 y 4 (cerebrito-backend, shared-tools)

## Enlaces
- Sesion_02_06: /mnt/d/OPOS_PROJECT/01-Wiki/Backend/Sesion_02_06_2026_Bug401_Ingest.md
- Windows_Bridges: /mnt/d/OPOS_PROJECT/01-Wiki/Arquitectura/Windows_Bridges_Puertos_Procesos.md
- AgenteEscritor_Proxy: /mnt/d/OPOS_PROJECT/01-Wiki/Backend/AgenteEscritor_Proxy.md
- Graphify: /mnt/d/OPOS_PROJECT/01-Wiki/Graphify/Sincronizar_Graphify.md
- Plan Ainoa: PLAN_VARIANTE_BACHILLERATO_AINOA.md
