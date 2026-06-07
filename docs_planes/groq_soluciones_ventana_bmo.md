Sí, el bug de redimensionado del input/chat sigue siendo común en Electron y afecta a BMO Chatbot (incluso la versión modificada por ti).
BMO usa componentes web estándar (probablemente un textarea o contenedor flex para el prompt de entrada) dentro de un pane de Obsidian, que a su vez corre sobre Electron/Chromium. Este tipo de problemas de layout (el input que se oculta, se corta o no queda espacio para escribir hasta que redimensionas la ventana) son clásicos y suelen deberse a:

CSS Flex/Grid que no recalcula bien las alturas al cambiar el tamaño de la ventana.
vh units, overflow hidden o contenedores con position: fixed/absolute que no se ajustan correctamente.
Comportamiento de Electron con el resize (el browser window no siempre notifica bien los cambios de tamaño a todos los componentes).
Modificaciones tuyas que alteraron el CSS o la estructura del chat (esto es lo más probable si es una versión custom).

Workarounds que suelen funcionar

Redimensionar la ventana o el pane (lo que ya haces) → fuerza un reflow del layout.
Recargar solo el pane del chat (Command Palette → “Reload” o Ctrl/Cmd + R enfocando el pane).
En las settings de BMO busca opciones de height, textarea rows, o auto-resize del input. Algunas versiones tienen configuraciones para esto.
Añadir CSS personalizado en Obsidian (Snippet):CSS.bmo-chat-input, .bmo-textarea, textarea[class*="chat"] {
    min-height: 60px !important;
    resize: vertical !important;
    overflow-y: auto !important;
}

.bmo-chat-container {
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
}(Ajusta los selectores según el HTML real de tu versión modificada).
Desactiva Hardware Acceleration en Obsidian (Settings → About → Advanced) o en las flags de Electron si usas launch options.
Prueba abrir el chat en una ventana separada (si BMO lo permite) o en un pane más ancho.

Si me pasas:

La versión de BMO que usas (o si es BRAT/beta)
Qué modificaciones exactas le hiciste (CSS, componentes, etc.)
Tu SO (Windows/Linux/macOS) y si usas multi-monitor o escalado alto

puedo darte consejos más precisos o ayudarte a depurar el CSS. ¿Puedes inspeccionar el elemento del input (dev tools: Ctrl+Shift+I) y ver qué clases tiene cuando se rompe?Cómo resuelven el bug otros desarrolladores? Hay solución definitiva?No hay una solución definitiva universal, pero otros desarrolladores resuelven este tipo de bugs (comunes en Electron + layouts flex/column) con enfoques que suelen dar resultados muy estables. El problema es típico de contenedores que no reaccionan bien al resize del BrowserWindow de Electron/Obsidian.
Cómo lo resuelven otros devs (en Obsidian plugins, Electron apps y chats similares):

Escuchar el evento resize y forzar reflow (la solución más común y efectiva):
Usan window.addEventListener('resize', ...) o el evento de Obsidian (app.workspace.on('resize', ...)).
Dentro, fuerzan un recalculo del layout con trucos como:JavaScript// Ejemplos comunes
element.style.height = 'auto';  // o '100%'
void element.offsetHeight;      // Forzar reflow (truco clásico)
element.style.height = '';      // Restaurar
// O
chatContainer.dispatchEvent(new Event('resize'));
Muchos plugins de Obsidian (y apps como VS Code, Discord forks, etc.) hacen esto para panes de chat.

CSS más robusto (lo que más se recomienda para tu caso modificado):
Evitar alturas fijas o vh puro.
Usar flex: 1; min-height: 0; en contenedores padres.
En el textarea/input:CSS.bmo-chat-input textarea {
    flex: 0 0 auto;           /* o 1 1 auto según estructura */
    min-height: 50px;
    max-height: 40vh;         /* límite razonable */
    resize: vertical;
    overflow-y: auto;
    box-sizing: border-box;
}

.bmo-chat-container {
    display: flex;
    flex-direction: column;
    height: 100% !important;
    min-height: 0;            /* clave para flex anidados */
}
Añadir transition: none; temporalmente durante resize si hay animaciones que interfieren.

Auto-resize del textarea (muy usado en chats modernos):
JS que ajusta scrollHeight en input / keydown events. Esto hace que crezca naturalmente y reduce dependencia del resize de la ventana.

Otras técnicas en Electron/Obsidian:
Usar ResizeObserver en el contenedor del chat (más moderno y preciso que window.resize).
Recargar el pane o llamar app.workspace.requestSaveLayout() / layout triggers.
Desactivar hardware acceleration en algunos casos (aunque no es ideal).
Plugins como Electron Window Tweaker o snippets que hookean resize events a nivel global.


¿Solución definitiva?

No al 100% porque depende de Electron/Chromium + cómo esté estructurado tu BMO modificado (especialmente si cambiaste HTML/CSS/JS). Pero combinando buen CSS flex + ResizeObserver + forzar reflow se soluciona en la gran mayoría de casos y se vuelve muy raro que reaparezca.
En proyectos grandes (Copilot para Obsidian, otros chats Electron, Streamlit chats, etc.) suelen aplicar estas capas defensivas.

Recomendación para ti:

Inspecciona el elemento (Ctrl+Shift+I) cuando se rompe y dime las clases principales del contenedor del chat y del input/textarea.
Pásame el CSS/JS relevante que modificaste → te ayudo a escribir el fix concreto.
Prueba primero el snippet CSS que te di antes + un listener simple en tu versión modificada.

¿Quieres que te ayude a implementar uno de estos (por ejemplo, un ResizeObserver básico para tu BMO)? Dime cómo tienes estructurado el chat ahora.