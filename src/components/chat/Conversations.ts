import { Notice, TFile, normalizePath } from 'obsidian';
import BMOGPT, { BMOSettings } from '../../main';

// ============================================================================
// CHANDRA EDITION · Multi-chat module
// ----------------------------------------------------------------------------
// Each conversation is persisted as a single .md file inside
//   <conversationsFolderPath>/<profileBasename>/<yyyy-mm-dd>__<slug>__<shortId>.md
// with a YAML frontmatter holding metadata (id, profile, timestamps, pinned).
// The body uses the same `###### ROLE` syntax already produced by /save so
// existing chat exports remain compatible and human-readable.
// ============================================================================

export interface ConversationMessage {
    role: string;
    content: string;
    images: (Uint8Array | string)[];
}

export interface Conversation {
    id: string;
    title: string;
    profile: string;        // basename without .md (e.g. "Chandra_Opos")
    created: number;        // ms epoch
    updated: number;
    pinned: boolean;
    messages: ConversationMessage[];
    filePath: string | null; // null until first persist
}

export const CONVERSATIONS_FOLDER_DEFAULT = 'BMO/Chats';
export const CONVERSATION_FORMAT_VERSION = 1;
const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
const ROLE_HEADER_REGEX = /^######\s+(.+?)$/gm;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function generateConversationId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback: not cryptographically strong, but unique enough for our use
    return 'conv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export function shortId(id: string): string {
    return id.replace(/-/g, '').slice(0, 8);
}

export function slugify(text: string, maxLen = 60): string {
    const cleaned = (text || 'sin-titulo')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')           // strip accents
        .replace(/[^a-z0-9\s-]/g, '')               // keep alphanum + dash
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    return cleaned.slice(0, maxLen) || 'sin-titulo';
}

export function profileBasename(profile: string): string {
    return profile.replace(/\.[^/.]+$/, '');
}

export function dateStamp(ms: number): string {
    const d = new Date(ms);
    return d.getFullYear() + '-'
        + String(d.getMonth() + 1).padStart(2, '0') + '-'
        + String(d.getDate()).padStart(2, '0');
}

export function getConversationsFolder(settings: BMOSettings): string {
    // Will read from a future settings.conversations.folderPath; falls back to default
    const cfg = (settings as any).conversations?.folderPath;
    return (typeof cfg === 'string' && cfg.trim()) ? cfg.trim() : CONVERSATIONS_FOLDER_DEFAULT;
}

export function buildFilePath(folder: string, conv: Conversation): string {
    const subfolder = `${folder.replace(/\/+$/, '')}/${profileBasename(conv.profile)}`;
    const stamp = dateStamp(conv.created);
    const slug = slugify(conv.title);
    return normalizePath(`${subfolder}/${stamp}__${slug}__${shortId(conv.id)}.md`);
}

// ---------------------------------------------------------------------------
// Serialization (Conversation <-> Markdown)
// ---------------------------------------------------------------------------

function escapeYamlString(value: string): string {
    // Quote if contains special chars, escape internal double quotes
    if (/[:#\n\r"']/.test(value) || value.trim() !== value) {
        return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    }
    return value;
}

function unescapeYamlString(raw: string): string {
    let v = raw.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
    }
    return v.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

export function serializeToMarkdown(conv: Conversation, opts: { userName?: string; chatbotName?: string } = {}): string {
    const userLabel = (opts.userName || 'USER').toUpperCase();
    const botLabel = (opts.chatbotName || profileBasename(conv.profile) || 'ASSISTANT').toUpperCase();

    const fm = [
        '---',
        `bmo_format: ${CONVERSATION_FORMAT_VERSION}`,
        `bmo_id: ${escapeYamlString(conv.id)}`,
        `bmo_title: ${escapeYamlString(conv.title)}`,
        `bmo_profile: ${escapeYamlString(conv.profile)}`,
        `bmo_created: ${new Date(conv.created).toISOString()}`,
        `bmo_updated: ${new Date(conv.updated).toISOString()}`,
        `bmo_pinned: ${conv.pinned ? 'true' : 'false'}`,
        '---',
        ''
    ].join('\n');

    const body = conv.messages.map((m) => {
        const role = (m.role || '').toLowerCase();
        const label = role === 'user' ? userLabel : role === 'assistant' ? botLabel : (m.role || 'SYSTEM').toUpperCase();
        return `###### ${label}\n${m.content || ''}`;
    }).join('\n\n');

    return fm + body + (body.endsWith('\n') ? '' : '\n');
}

export function parseFromMarkdown(content: string, filePath: string): Conversation | null {
    if (!content) return null;
    const fmMatch = content.match(FRONTMATTER_REGEX);
    if (!fmMatch) return null;

    const fmBlock = fmMatch[1];
    const meta: Record<string, string> = {};
    fmBlock.split('\n').forEach((line) => {
        const idx = line.indexOf(':');
        if (idx <= 0) return;
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        meta[key] = val;
    });

    if (!meta.bmo_id || !meta.bmo_profile) return null; // not a conversation file

    const body = content.slice(fmMatch[0].length);
    const messages: ConversationMessage[] = [];

    // Split by role headers; capture role then body until next header or end
    const headerMatches: { idx: number; role: string }[] = [];
    let m: RegExpExecArray | null;
    ROLE_HEADER_REGEX.lastIndex = 0;
    while ((m = ROLE_HEADER_REGEX.exec(body)) !== null) {
        headerMatches.push({ idx: m.index, role: m[1].trim() });
    }
    for (let i = 0; i < headerMatches.length; i++) {
        const start = headerMatches[i].idx;
        const end = i + 1 < headerMatches.length ? headerMatches[i + 1].idx : body.length;
        const headerLineEnd = body.indexOf('\n', start);
        const slice = headerLineEnd === -1 ? '' : body.slice(headerLineEnd + 1, end).trim();
        const roleRaw = headerMatches[i].role.toLowerCase();
        const role = roleRaw === 'user' || roleRaw === 'assistant' || roleRaw === 'system'
            ? roleRaw
            : (roleRaw === (unescapeYamlString(meta.bmo_profile) || '').toLowerCase().replace(/\.md$/, '') ? 'assistant' : 'user');
        messages.push({ role, content: slice, images: [] });
    }

    const created = meta.bmo_created ? Date.parse(unescapeYamlString(meta.bmo_created)) : Date.now();
    const updated = meta.bmo_updated ? Date.parse(unescapeYamlString(meta.bmo_updated)) : created;
    const pinned = (meta.bmo_pinned || '').toLowerCase() === 'true';

    return {
        id: unescapeYamlString(meta.bmo_id),
        title: unescapeYamlString(meta.bmo_title || 'Sin título'),
        profile: unescapeYamlString(meta.bmo_profile),
        created: Number.isFinite(created) ? created : Date.now(),
        updated: Number.isFinite(updated) ? updated : Date.now(),
        pinned,
        messages,
        filePath
    };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

async function ensureFolderRecursive(plugin: BMOGPT, path: string): Promise<void> {
    const segments = normalizePath(path).split('/').filter(Boolean);
    let acc = '';
    for (const seg of segments) {
        acc = acc ? `${acc}/${seg}` : seg;
        if (!(await plugin.app.vault.adapter.exists(acc))) {
            try { await plugin.app.vault.createFolder(acc); }
            catch (e) { /* race or already created */ }
        }
    }
}

export function newConversation(profile: string, title?: string): Conversation {
    const now = Date.now();
    return {
        id: generateConversationId(),
        title: title?.trim() || 'Nueva conversación',
        profile,
        created: now,
        updated: now,
        pinned: false,
        messages: [],
        filePath: null
    };
}

export async function listConversations(plugin: BMOGPT, profile: string): Promise<Conversation[]> {
    const folder = getConversationsFolder(plugin.settings);
    const profileFolder = `${folder}/${profileBasename(profile)}`;
    if (!(await plugin.app.vault.adapter.exists(profileFolder))) return [];

    const files = plugin.app.vault.getFiles().filter((f) => f.path.startsWith(profileFolder + '/') && f.extension === 'md');
    const out: Conversation[] = [];
    for (const f of files) {
        try {
            const txt = await plugin.app.vault.read(f);
            const conv = parseFromMarkdown(txt, f.path);
            if (conv) out.push(conv);
        } catch (e) {
            console.warn('[BMO Chandra] Skip unreadable conversation file:', f.path, e);
        }
    }
    out.sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (b.updated - a.updated));
    return out;
}

export async function saveConversation(plugin: BMOGPT, conv: Conversation): Promise<TFile> {
    const folder = getConversationsFolder(plugin.settings);
    const profileFolder = `${folder}/${profileBasename(conv.profile)}`;
    await ensureFolderRecursive(plugin, profileFolder);

    conv.updated = Date.now();
    const targetPath = conv.filePath || buildFilePath(folder, conv);
    const userName = plugin.settings?.appearance?.userName;
    const chatbotName = plugin.settings?.appearance?.chatbotName;
    const md = serializeToMarkdown(conv, { userName, chatbotName });

    const existing = plugin.app.vault.getAbstractFileByPath(targetPath);
    if (existing instanceof TFile) {
        await plugin.app.vault.modify(existing, md);
        conv.filePath = existing.path;
        return existing;
    }
    const created = await plugin.app.vault.create(targetPath, md);
    conv.filePath = created.path;
    return created;
}

export async function loadConversation(plugin: BMOGPT, filePath: string): Promise<Conversation | null> {
    const file = plugin.app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) return null;
    const txt = await plugin.app.vault.read(file);
    return parseFromMarkdown(txt, file.path);
}

export async function deleteConversation(plugin: BMOGPT, conv: Conversation): Promise<void> {
    if (!conv.filePath) return;
    const file = plugin.app.vault.getAbstractFileByPath(conv.filePath);
    if (file instanceof TFile) {
        await plugin.app.vault.trash(file, true);
    }
}

export async function renameConversation(plugin: BMOGPT, conv: Conversation, newTitle: string): Promise<TFile | null> {
    const trimmed = newTitle.trim();
    if (!trimmed) return null;
    conv.title = trimmed;
    if (!conv.filePath) return saveConversation(plugin, conv);

    const folder = getConversationsFolder(plugin.settings);
    const newPath = buildFilePath(folder, conv);
    if (newPath === conv.filePath) return saveConversation(plugin, conv);

    // Rename file and re-write content with updated title in frontmatter
    const file = plugin.app.vault.getAbstractFileByPath(conv.filePath);
    if (file instanceof TFile) {
        try { await plugin.app.fileManager.renameFile(file, newPath); }
        catch (e) { console.warn('[BMO Chandra] rename file failed, falling back to save', e); }
    }
    conv.filePath = newPath;
    return saveConversation(plugin, conv);
}

// ---------------------------------------------------------------------------
// Auto-title (lightweight: no extra LLM call yet — first user line truncated).
// Hook for fetchModelRenameTitle is in main.ts integration step.
// ---------------------------------------------------------------------------

export function deriveAutoTitle(conv: Conversation, maxLen = 60): string {
    const firstUser = conv.messages.find((m) => m.role === 'user' && m.content?.trim());
    if (!firstUser) return conv.title || 'Nueva conversación';
    const oneLine = firstUser.content.replace(/\s+/g, ' ').trim();
    if (oneLine.length <= maxLen) return oneLine;
    return oneLine.slice(0, maxLen).trim() + '…';
}

// ---------------------------------------------------------------------------
// Migration: legacy `messageHistory_<profile>.json` -> first conversation .md
// Returns the conversation created, or null if nothing to migrate.
// ---------------------------------------------------------------------------

export async function migrateLegacyHistory(plugin: BMOGPT, profile: string): Promise<Conversation | null> {
    const legacyPath = `./.obsidian/plugins/bmo-chatbot/data/messageHistory_${profile.replace(/\.md$/, '')}.json`;
    if (!(await plugin.app.vault.adapter.exists(legacyPath))) return null;

    let raw = '';
    try { raw = await plugin.app.vault.adapter.read(legacyPath); }
    catch (e) { console.warn('[BMO Chandra] Cannot read legacy history', legacyPath, e); return null; }
    if (!raw.trim()) return null;

    let parsed: any;
    try { parsed = JSON.parse(raw); }
    catch (e) { console.warn('[BMO Chandra] Legacy history not valid JSON', e); return null; }
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    const messages: ConversationMessage[] = parsed
        .filter((m) => m && typeof m === 'object' && typeof m.content === 'string')
        .map((m) => ({
            role: typeof m.role === 'string' ? m.role : 'user',
            content: m.content,
            images: Array.isArray(m.images) ? m.images : []
        }));
    if (messages.length === 0) return null;

    const conv: Conversation = {
        id: generateConversationId(),
        title: '[migrado] ' + (deriveAutoTitle({ messages } as Conversation) || 'historial anterior'),
        profile,
        created: Date.now(),
        updated: Date.now(),
        pinned: false,
        messages,
        filePath: null
    };
    await saveConversation(plugin, conv);
    new Notice(`Historial migrado: ${conv.messages.length} mensajes → ${conv.filePath}`);
    return conv;
}
