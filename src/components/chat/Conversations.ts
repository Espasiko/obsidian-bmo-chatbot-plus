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
// Auto-title (lightweight fallback: first user line truncated).
// LLM-based title via fetchModelRenameTitle is wired in maybeGenerateAutoTitle.
// ---------------------------------------------------------------------------

export function deriveAutoTitle(conv: Conversation, maxLen = 60): string {
    const firstUser = conv.messages.find((m) => m.role === 'user' && m.content?.trim());
    if (!firstUser) return conv.title || 'Nueva conversación';
    const oneLine = firstUser.content.replace(/\s+/g, ' ').trim();
    if (oneLine.length <= maxLen) return oneLine;
    return oneLine.slice(0, maxLen).trim() + '…';
}

// ---------------------------------------------------------------------------
// Active conversation runtime state
// ---------------------------------------------------------------------------
// Single source of truth shared with the legacy `messageHistory` array in
// view.ts: every change to that array is mirrored to the active Conversation
// and persisted to its .md file. We never reassign messageHistory here (it is
// `let` and externally referenced) — we mutate via splice in callers and pass
// the array reference into syncMessageHistoryToActive().
// ---------------------------------------------------------------------------

let activeConversation: Conversation | null = null;
let pendingAutoTitle = false;

export function getActiveConversation(): Conversation | null {
    return activeConversation;
}

export function setActiveConversation(conv: Conversation | null): void {
    activeConversation = conv;
}

/** Persist current active conversation settings (path + id) to plugin data. */
async function persistActiveSettings(plugin: BMOGPT): Promise<void> {
    plugin.settings.conversations.activeId = activeConversation?.id ?? null;
    plugin.settings.conversations.activeFilePath = activeConversation?.filePath ?? null;
    try { await plugin.saveData(plugin.settings); } catch (e) { console.warn('[BMO Chandra] saveData failed', e); }
}

/**
 * On view open: figure out which Conversation should be active.
 * Priority:
 *   1. settings.conversations.activeFilePath if file exists in vault.
 *   2. Most recent conversation for the active profile.
 *   3. New empty conversation seeded with current messageHistory[].
 */
export async function loadOrCreateActiveConversation(
    plugin: BMOGPT,
    messageHistoryRef: ConversationMessage[]
): Promise<Conversation> {
    const profile = plugin.settings.profiles.profile;
    const activePath = plugin.settings.conversations.activeFilePath;

    // 1) try the path stored in settings
    if (activePath) {
        const conv = await loadConversation(plugin, activePath);
        if (conv && conv.profile === profile) {
            activeConversation = conv;
            replaceMessageHistory(messageHistoryRef, conv.messages);
            return conv;
        }
    }

    // 2) most recent for this profile
    const all = await listConversations(plugin, profile);
    if (all.length > 0) {
        activeConversation = all[0];
        replaceMessageHistory(messageHistoryRef, all[0].messages);
        await persistActiveSettings(plugin);
        return all[0];
    }

    // 3) No conversations yet: start a brand-new EMPTY conversation (in-memory; persisted on
    //    first message via syncMessageHistoryToActive). IMPORTANT: do NOT seed from the legacy
    //    messageHistory[] — that made a just-deleted conversation "reappear" on reopen, because
    //    the legacy JSON is re-read on every loadData(). Legacy history is migrated once via
    //    migrateLegacyHistory() (main.ts onload), so nothing is lost by starting empty here.
    replaceMessageHistory(messageHistoryRef, []);
    const conv = newConversation(profile);
    activeConversation = conv;
    return conv;
}

/** Replace contents of the live messageHistory array (preserves reference). */
function replaceMessageHistory(target: ConversationMessage[], src: ConversationMessage[]): void {
    target.splice(0, target.length, ...src.map((m) => ({
        role: m.role,
        content: m.content,
        images: Array.isArray(m.images) ? m.images : []
    })));
}

/** Persist the current message array to the active conversation's .md file. */
export async function syncMessageHistoryToActive(
    plugin: BMOGPT,
    messageHistoryRef: ConversationMessage[]
): Promise<void> {
    if (!activeConversation) {
        await loadOrCreateActiveConversation(plugin, messageHistoryRef);
        if (!activeConversation) return;
    }
    activeConversation.messages = messageHistoryRef.map((m) => ({
        role: m.role,
        content: m.content,
        images: Array.isArray(m.images) ? m.images : []
    }));
    try {
        await saveConversation(plugin, activeConversation);
        await persistActiveSettings(plugin);
        pendingAutoTitle = true;
    } catch (e) {
        console.warn('[BMO Chandra] syncMessageHistoryToActive failed', e);
    }
}

/** Start a fresh empty conversation and clear messageHistory in place. */
export async function startNewActiveConversation(
    plugin: BMOGPT,
    messageHistoryRef: ConversationMessage[]
): Promise<Conversation> {
    const conv = newConversation(plugin.settings.profiles.profile);
    activeConversation = conv;
    replaceMessageHistory(messageHistoryRef, []);
    await persistActiveSettings(plugin);
    return conv;
}

/** Switch active to an existing conversation by file path. */
export async function switchActiveConversation(
    plugin: BMOGPT,
    filePath: string,
    messageHistoryRef: ConversationMessage[]
): Promise<Conversation | null> {
    const conv = await loadConversation(plugin, filePath);
    if (!conv) return null;
    activeConversation = conv;
    replaceMessageHistory(messageHistoryRef, conv.messages);
    await persistActiveSettings(plugin);
    return conv;
}

/**
 * Generate an LLM-based title once the conversation reaches >=2 turns and the
 * current title is still default. Caller passes a generator function to avoid
 * a circular import with FetchRenameNoteTitle.
 */
export async function maybeGenerateAutoTitle(
    plugin: BMOGPT,
    titleGenerator: (transcript: string) => Promise<string | null>
): Promise<void> {
    if (!plugin.settings.conversations.autoTitle) return;
    if (!activeConversation) return;
    if (!pendingAutoTitle) return;
    if (activeConversation.messages.length < 2) return;
    const isDefaultTitle = !activeConversation.title
        || activeConversation.title === 'Nueva conversación'
        || activeConversation.title.startsWith('[migrado]');
    if (!isDefaultTitle) { pendingAutoTitle = false; return; }

    const transcript = activeConversation.messages.slice(0, 4).map((m) => {
        const role = m.role === 'user' ? 'USER' : m.role === 'assistant' ? 'ASSISTANT' : (m.role || 'SYSTEM').toUpperCase();
        return `${role}: ${(m.content || '').slice(0, 800)}`;
    }).join('\n\n');

    pendingAutoTitle = false; // attempt once per pending mark
    try {
        const generated = await titleGenerator(transcript);
        const cleaned = (generated || '').replace(/^["'\s]+|["'\s]+$/g, '').slice(0, 80);
        if (cleaned && cleaned.length >= 3) {
            await renameConversation(plugin, activeConversation, cleaned);
            await persistActiveSettings(plugin);
        }
    } catch (e) {
        console.warn('[BMO Chandra] auto-title failed', e);
    }
}

/** Clear runtime state (used on plugin unload / view close). */
export function resetActiveRuntime(): void {
    activeConversation = null;
    pendingAutoTitle = false;
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
