import { setIcon, Menu, Notice } from 'obsidian';
import BMOGPT from '../../main';
import { messageHistory } from '../../view';
import {
    Conversation,
    deleteConversation,
    getActiveConversation,
    listConversations,
    renameConversation,
    saveConversation,
    startNewActiveConversation,
    switchActiveConversation
} from './Conversations';

// ============================================================================
// CHANDRA EDITION · Conversations sidebar
// ----------------------------------------------------------------------------
// Collapsible left panel with: New Chat button, search, list of conversations
// for the active profile (pinned first, then by updated desc), context menu
// (rename / pin / open .md / delete). The actual message rendering is owned
// by view.ts; we only call the supplied onConversationSwitch() callback after
// loading another conversation, so the view re-renders #messageContainer.
// ============================================================================

let sidebarEl: HTMLDivElement | null = null;
let sidebarToggleBtn: HTMLButtonElement | null = null;
let onSwitch: (() => Promise<void> | void) | null = null;
let searchTerm = '';

const SIDEBAR_OPEN_CLASS = 'bmo-sidebar-open';

export function isSidebarRendered(): boolean {
    return sidebarEl !== null;
}

export function clearSidebarRuntime(): void {
    sidebarEl = null;
    sidebarToggleBtn = null;
    onSwitch = null;
    searchTerm = '';
}

/**
 * Create the sidebar DOM and the floating toggle button.
 * `parent` is typically `chatbotContainer`.
 * Returns the sidebar element so the caller may manage its lifecycle.
 */
export function createConversationsSidebar(
    plugin: BMOGPT,
    parent: HTMLElement,
    onConversationSwitch: () => Promise<void> | void
): HTMLDivElement {
    onSwitch = onConversationSwitch;

    // Floating toggle button (absolute, top-left of the chatbot container)
    const toggleBtn = parent.createEl('button', { cls: 'bmo-sidebar-toggle' });
    toggleBtn.title = 'Conversaciones (Ctrl/Cmd+B)';
    setIcon(toggleBtn, 'panel-left');
    toggleBtn.addEventListener('click', () => toggleSidebar(plugin));
    sidebarToggleBtn = toggleBtn;

    // Sidebar container
    const sidebar = parent.createEl('div', { cls: 'bmo-conversations-sidebar' });

    // Header: title + new chat button + close
    const header = sidebar.createEl('div', { cls: 'sidebar-head' });
    const titleSpan = header.createEl('span', { cls: 'sidebar-title' });
    titleSpan.textContent = 'Conversaciones';

    const closeBtn = header.createEl('button', { cls: 'sidebar-close' });
    closeBtn.title = 'Ocultar panel';
    setIcon(closeBtn, 'panel-left-close');
    closeBtn.addEventListener('click', () => toggleSidebar(plugin));

    // New chat
    const newChatBtn = sidebar.createEl('button', { cls: 'sidebar-new-chat' });
    setIcon(newChatBtn, 'plus');
    newChatBtn.appendChild(document.createTextNode(' Nuevo chat'));
    newChatBtn.addEventListener('click', async () => {
        try {
            await startNewActiveConversation(plugin, messageHistory);
            if (onSwitch) await onSwitch();
            await refreshSidebar(plugin);
        } catch (e) {
            console.warn('[BMO Chandra] new chat failed', e);
            new Notice('No se pudo crear nueva conversación');
        }
    });

    // Search
    const searchEl = sidebar.createEl('input', { cls: 'sidebar-search' });
    searchEl.type = 'search';
    searchEl.placeholder = 'Buscar…';
    searchEl.addEventListener('input', () => {
        searchTerm = (searchEl.value || '').trim().toLowerCase();
        void refreshSidebar(plugin);
    });

    // List
    sidebar.createEl('div', { cls: 'sidebar-list', attr: { id: 'bmo-conversations-list' } });

    sidebarEl = sidebar;

    // Restore visibility from settings
    if (plugin.settings.conversations.sidebarVisible) {
        parent.classList.add(SIDEBAR_OPEN_CLASS);
        setIcon(toggleBtn, 'panel-left-close');
    }

    void refreshSidebar(plugin);
    return sidebar;
}

export function toggleSidebar(plugin: BMOGPT): void {
    if (!sidebarEl) return;
    const container = sidebarEl.parentElement;
    if (!container) return;
    const willOpen = !container.classList.contains(SIDEBAR_OPEN_CLASS);
    container.classList.toggle(SIDEBAR_OPEN_CLASS, willOpen);
    plugin.settings.conversations.sidebarVisible = willOpen;
    void plugin.saveData(plugin.settings);
    if (sidebarToggleBtn) {
        setIcon(sidebarToggleBtn, willOpen ? 'panel-left-close' : 'panel-left');
    }
    if (willOpen) void refreshSidebar(plugin);
}

export async function refreshSidebar(plugin: BMOGPT): Promise<void> {
    if (!sidebarEl) return;
    const listEl = sidebarEl.querySelector('#bmo-conversations-list') as HTMLDivElement | null;
    if (!listEl) return;

    listEl.empty();

    const profile = plugin.settings.profiles.profile;
    let all: Conversation[] = [];
    try { all = await listConversations(plugin, profile); }
    catch (e) { console.warn('[BMO Chandra] listConversations failed', e); }

    const active = getActiveConversation();
    const term = searchTerm;

    const filtered = term
        ? all.filter((c) => c.title.toLowerCase().includes(term)
            || c.messages.some((m) => (m.content || '').toLowerCase().includes(term)))
        : all;

    if (filtered.length === 0) {
        const empty = listEl.createEl('div', { cls: 'sidebar-empty' });
        empty.textContent = term ? 'Sin coincidencias.' : 'Aún no hay conversaciones.';
        return;
    }

    for (const conv of filtered) {
        const item = listEl.createEl('div', { cls: 'sidebar-item' });
        if (active && active.id === conv.id) item.addClass('active');
        if (conv.pinned) item.addClass('pinned');

        const main = item.createEl('div', { cls: 'item-main' });
        const titleEl = main.createEl('div', { cls: 'item-title' });
        titleEl.textContent = conv.title || 'Sin título';
        const subEl = main.createEl('div', { cls: 'item-sub' });
        subEl.textContent = `${formatRelativeDate(conv.updated)} · ${conv.messages.length} msg${conv.messages.length === 1 ? '' : 's'}`;

        const menuBtn = item.createEl('button', { cls: 'item-menu' });
        setIcon(menuBtn, 'more-horizontal');
        menuBtn.title = 'Acciones';
        menuBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            showItemMenu(plugin, conv, ev as MouseEvent);
        });

        item.addEventListener('click', async () => {
            if (active && active.id === conv.id) return;
            if (!conv.filePath) return;
            try {
                const switched = await switchActiveConversation(plugin, conv.filePath, messageHistory);
                if (switched && onSwitch) await onSwitch();
                await refreshSidebar(plugin);
            } catch (e) {
                console.warn('[BMO Chandra] switch failed', e);
                new Notice('No se pudo cargar la conversación');
            }
        });
    }
}

function showItemMenu(plugin: BMOGPT, conv: Conversation, ev: MouseEvent): void {
    const menu = new Menu();

    menu.addItem((it) => it
        .setTitle(conv.pinned ? 'Desfijar' : 'Fijar')
        .setIcon(conv.pinned ? 'pin-off' : 'pin')
        .onClick(async () => {
            conv.pinned = !conv.pinned;
            try { await saveConversation(plugin, conv); }
            catch (e) { console.warn(e); }
            await refreshSidebar(plugin);
        })
    );

    menu.addItem((it) => it
        .setTitle('Renombrar')
        .setIcon('pencil')
        .onClick(async () => {
            const next = window.prompt('Nuevo título:', conv.title);
            if (!next) return;
            try {
                await renameConversation(plugin, conv, next);
                await refreshSidebar(plugin);
                if (onSwitch) await onSwitch();
            } catch (e) {
                console.warn('[BMO Chandra] rename failed', e);
                new Notice('No se pudo renombrar');
            }
        })
    );

    menu.addItem((it) => it
        .setTitle('Abrir como nota')
        .setIcon('file-text')
        .onClick(() => {
            if (!conv.filePath) return;
            plugin.app.workspace.openLinkText(conv.filePath, '', true);
        })
    );

    menu.addSeparator();

    menu.addItem((it) => it
        .setTitle('Eliminar')
        .setIcon('trash-2')
        .onClick(async () => {
            const ok = window.confirm(`¿Eliminar "${conv.title}"? Se moverá a la papelera del vault.`);
            if (!ok) return;
            try {
                const wasActive = getActiveConversation()?.id === conv.id;
                await deleteConversation(plugin, conv);
                if (wasActive) {
                    await startNewActiveConversation(plugin, messageHistory);
                    if (onSwitch) await onSwitch();
                }
                await refreshSidebar(plugin);
            } catch (e) {
                console.warn('[BMO Chandra] delete failed', e);
                new Notice('No se pudo eliminar');
            }
        })
    );

    menu.showAtMouseEvent(ev);
}

function formatRelativeDate(ms: number): string {
    const diff = Date.now() - ms;
    if (diff < 60_000) return 'ahora';
    if (diff < 3_600_000) return Math.floor(diff / 60_000) + ' min';
    if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + ' h';
    if (diff < 7 * 86_400_000) return Math.floor(diff / 86_400_000) + ' d';
    const d = new Date(ms);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
