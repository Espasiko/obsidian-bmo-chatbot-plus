import BMOGPT from '../../main';
import { executeCommand } from './Commands';

// Autocompletado del textarea del chat:
//   - Al teclear "/" al principio: desplegable de COMANDOS (rellena el comando).
//   - Al teclear "@" (inicio o tras espacio): desplegable de AGENTES (cambia de perfil al elegir).
// Se integra desde view.ts (onKeyDown / handleKeyupGuard / onInput).

interface CommandDef { cmd: string; desc: string; }

interface Item { label: string; sub: string; value: string; mode: 'agent' | 'command'; }

// Comandos canónicos (los de commandMap) con descripción en español.
const COMMANDS: CommandDef[] = [
  { cmd: '/help', desc: 'Ayuda y lista de comandos' },
  { cmd: '/profile', desc: 'Cambiar de agente (perfil)' },
  { cmd: '/model', desc: 'Cambiar el modelo' },
  { cmd: '/prompt', desc: 'Insertar un prompt guardado' },
  { cmd: '/reference', desc: 'Activar/desactivar la nota actual' },
  { cmd: '/temperature', desc: 'Ajustar la temperatura' },
  { cmd: '/maxtokens', desc: 'Ajustar el máximo de tokens' },
  { cmd: '/save', desc: 'Guardar la conversación como nota' },
  { cmd: '/append', desc: 'Añadir la conversación a la nota actual' },
  { cmd: '/load', desc: 'Cargar una conversación guardada' },
  { cmd: '/clear', desc: 'Limpiar el hilo actual' },
  { cmd: '/stop', desc: 'Detener la generación' },
];

const NAV_KEYS = ['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'];

export class ChatAutocomplete {
  private plugin: BMOGPT;
  private textarea: HTMLTextAreaElement;
  private popup: HTMLDivElement;
  private open = false;
  private items: Item[] = [];
  private activeIndex = 0;
  private tokenStart = 0;
  private tokenEnd = 0;
  private swallowEnterKeyup = false;

  constructor(plugin: BMOGPT, textarea: HTMLTextAreaElement, anchor: HTMLElement) {
    this.plugin = plugin;
    this.textarea = textarea;
    this.popup = document.createElement('div');
    this.popup.className = 'bmo-autocomplete';
    this.popup.style.display = 'none';
    anchor.appendChild(this.popup);
  }

  destroy(): void {
    this.popup.remove();
    this.open = false;
  }

  isOpen(): boolean {
    return this.open;
  }

  // Lista de agentes = ficheros .md de la carpeta de perfiles (excluye plantillas "_").
  private getProfiles(): string[] {
    const folder = this.plugin.settings.profiles.profileFolderPath;
    if (!folder) return [];
    return this.plugin.app.vault.getFiles()
      .filter((f) => f.path.startsWith(folder) && f.extension === 'md' && !f.basename.startsWith('_'))
      .map((f) => f.basename)
      .sort((a, b) => a.localeCompare(b));
  }

  // Recalcula el popup según el token bajo el cursor.
  onInput(): void {
    const value = this.textarea.value;
    const cursor = this.textarea.selectionStart ?? value.length;
    const before = value.slice(0, cursor);

    // Comando: SOLO al inicio de la entrada ("/algo" sin espacios).
    const cmdMatch = before.match(/^\/(\S*)$/);
    // Agente: "@algo" al inicio o tras un espacio/salto de línea.
    const agentMatch = before.match(/(?:^|\s)@(\S*)$/);

    if (cmdMatch) {
      const query = cmdMatch[1].toLowerCase();
      this.tokenStart = 0;
      this.tokenEnd = cursor;
      const items: Item[] = COMMANDS
        .filter((c) => c.cmd.slice(1).toLowerCase().startsWith(query))
        .map((c) => ({ label: c.cmd, sub: c.desc, value: c.cmd, mode: 'command' as const }));
      this.show(items);
    } else if (agentMatch) {
      const query = agentMatch[1].toLowerCase();
      this.tokenStart = cursor - agentMatch[1].length - 1; // posición de la "@"
      this.tokenEnd = cursor;
      const current = (this.plugin.settings.profiles.profile || '').replace(/\.md$/, '');
      const items: Item[] = this.getProfiles()
        .filter((name) => name.toLowerCase().includes(query))
        .map((name) => ({
          label: '@' + name,
          sub: name === current ? 'activo' : 'agente',
          value: name,
          mode: 'agent' as const,
        }));
      this.show(items);
    } else {
      this.close();
    }
  }

  private show(items: Item[]): void {
    if (items.length === 0) {
      this.close();
      return;
    }
    this.items = items;
    this.activeIndex = 0;
    this.render();
    this.popup.style.display = 'block';
    this.open = true;
  }

  private render(): void {
    while (this.popup.firstChild) this.popup.removeChild(this.popup.firstChild);

    const header = document.createElement('div');
    header.className = 'bmo-ac-header';
    header.textContent = this.items[0].mode === 'agent' ? 'Agentes' : 'Comandos';
    this.popup.appendChild(header);

    this.items.forEach((it, i) => {
      const el = document.createElement('div');
      el.className = 'bmo-ac-item' + (i === this.activeIndex ? ' is-active' : '');

      const name = document.createElement('span');
      name.className = 'bmo-ac-name';
      name.textContent = it.label;

      const desc = document.createElement('span');
      desc.className = 'bmo-ac-desc';
      desc.textContent = it.sub;

      el.appendChild(name);
      el.appendChild(desc);

      // mousedown (no click) para no perder el foco del textarea (evita blur).
      el.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        this.activeIndex = i;
        this.select();
      });
      el.addEventListener('mousemove', () => {
        if (this.activeIndex !== i) {
          this.activeIndex = i;
          this.updateActive();
        }
      });

      this.popup.appendChild(el);
    });
  }

  private updateActive(): void {
    const els = this.popup.querySelectorAll('.bmo-ac-item');
    els.forEach((el, i) => el.classList.toggle('is-active', i === this.activeIndex));
    const activeEl = els[this.activeIndex] as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: 'nearest' });
  }

  close(): void {
    this.open = false;
    this.popup.style.display = 'none';
    this.items = [];
  }

  // Devuelve true si consume la tecla (en keydown). Lo llama view.handleKeydown.
  onKeyDown(event: KeyboardEvent): boolean {
    if (!this.open || this.items.length === 0) return false;
    switch (event.key) {
      case 'ArrowDown':
        this.activeIndex = (this.activeIndex + 1) % this.items.length;
        this.updateActive();
        event.preventDefault();
        event.stopPropagation();
        return true;
      case 'ArrowUp':
        this.activeIndex = (this.activeIndex - 1 + this.items.length) % this.items.length;
        this.updateActive();
        event.preventDefault();
        event.stopPropagation();
        return true;
      case 'Enter':
      case 'Tab':
        this.select();
        event.preventDefault();
        event.stopPropagation();
        if (event.key === 'Enter') this.swallowEnterKeyup = true;
        return true;
      case 'Escape':
        this.close();
        event.preventDefault();
        event.stopPropagation();
        return true;
      default:
        return false;
    }
  }

  // Evita que el keyup de Enter dispare el envío tras seleccionar. Lo llama view.handleKeyup.
  handleKeyupGuard(event: KeyboardEvent): boolean {
    if (this.swallowEnterKeyup && event.key === 'Enter') {
      this.swallowEnterKeyup = false;
      return true;
    }
    if (this.open && NAV_KEYS.includes(event.key)) return true;
    return false;
  }

  private select(): void {
    const it = this.items[this.activeIndex];
    if (!it) {
      this.close();
      return;
    }
    const value = this.textarea.value;

    if (it.mode === 'command') {
      // Rellena el comando y deja al usuario añadir argumentos / pulsar Enter.
      const rest = value.slice(this.tokenEnd);
      this.textarea.value = it.value + ' ' + rest;
      const pos = (it.value + ' ').length;
      this.textarea.setSelectionRange(pos, pos);
      this.close();
      this.textarea.focus();
      this.textarea.dispatchEvent(new Event('input'));
    } else {
      // Agente: quita el token "@..." y cambia de perfil reutilizando commandProfile.
      this.textarea.value = value.slice(0, this.tokenStart) + value.slice(this.tokenEnd);
      this.close();
      void executeCommand('/profile ' + it.value, this.plugin.settings, this.plugin);
    }
  }
}
