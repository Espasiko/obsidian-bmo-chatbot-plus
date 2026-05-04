import { Notice } from 'obsidian';
import BMOGPT from '../../main';
import {
    getActiveConversation,
    renameConversation
} from './Conversations';
import { refreshSidebar } from './Sidebar';

// ============================================================================
// CHANDRA EDITION · Active conversation header (editable title)
// ----------------------------------------------------------------------------
// Renders a slim header right below #chatbotNameHeading showing the title of
// the active Conversation. Click-to-edit: the <span> turns into an <input>,
// Enter/blur persists via renameConversation(), Esc cancels. The header keeps
// a single DOM node (plus an ephemeral input) so refresh is cheap.
// ============================================================================

let headerEl: HTMLDivElement | null = null;
let titleEl: HTMLSpanElement | null = null;
let editing = false;

export function clearConversationHeaderRuntime(): void {
    headerEl = null;
    titleEl = null;
    editing = false;
}

export function isConversationHeaderRendered(): boolean {
    return headerEl !== null;
}

/**
 * Create the header element inside `parent` (typically the #header div in
 * view.ts) and wire the click-to-edit interaction. Idempotent: if already
 * rendered, returns the existing node.
 */
export function createConversationHeader(plugin: BMOGPT, parent: HTMLElement): HTMLDivElement {
    if (headerEl && parent.contains(headerEl)) {
        return headerEl;
    }

    const wrap = parent.createEl('div', { cls: 'bmo-conversation-header' });
    wrap.title = 'Clic para renombrar la conversación activa';

    const title = wrap.createEl('span', { cls: 'bmo-conversation-title' });
    title.textContent = resolveActiveTitle();

    title.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (editing) return;
        beginEdit(plugin);
    });

    headerEl = wrap;
    titleEl = title;
    return wrap;
}

/** Re-read the active conversation title and update the DOM. */
export function refreshConversationHeader(): void {
    if (!headerEl || !titleEl || editing) return;
    titleEl.textContent = resolveActiveTitle();
}

function resolveActiveTitle(): string {
    const active = getActiveConversation();
    if (!active) return 'Nueva conversación';
    return (active.title || '').trim() || 'Sin título';
}

function beginEdit(plugin: BMOGPT): void {
    if (!headerEl || !titleEl) return;
    const active = getActiveConversation();
    const current = titleEl.textContent || '';
    editing = true;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'bmo-conversation-title-input';
    input.value = current;
    input.maxLength = 80;
    input.setAttribute('aria-label', 'Título de la conversación');

    titleEl.replaceWith(input);
    input.focus();
    input.select();

    let committed = false;

    const finish = async (commit: boolean) => {
        if (committed) return;
        committed = true;

        const nextTitle = (input.value || '').trim();
        const rebuilt = document.createElement('span');
        rebuilt.className = 'bmo-conversation-title';
        rebuilt.addEventListener('click', (ev) => {
            ev.stopPropagation();
            if (!editing) beginEdit(plugin);
        });

        if (commit && active && nextTitle && nextTitle !== current) {
            try {
                await renameConversation(plugin, active, nextTitle);
                rebuilt.textContent = (active.title || '').trim() || nextTitle;
                void refreshSidebar(plugin);
            } catch (e) {
                console.warn('[BMO Chandra] header rename failed', e);
                new Notice('No se pudo renombrar la conversación');
                rebuilt.textContent = current;
            }
        } else {
            rebuilt.textContent = current;
        }

        input.replaceWith(rebuilt);
        titleEl = rebuilt;
        editing = false;
    };

    input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            void finish(true);
        } else if (ev.key === 'Escape') {
            ev.preventDefault();
            void finish(false);
        }
    });
    input.addEventListener('blur', () => { void finish(true); });
}
