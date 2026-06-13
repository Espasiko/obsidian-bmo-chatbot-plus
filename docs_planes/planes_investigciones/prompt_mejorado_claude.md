# Guía Maestra · Prompt Engineering 2026
### 10 pasos para construir cualquier prompt desde cero con calidad de producción

> Válido para cualquier tema y cualquier modelo (Grok, Claude, Mistral, DeepSeek, GPT-OSS, Llama…).
> Los pasos marcados **[SIEMPRE]** son obligatorios. Los **[SEGÚN EL CASO]** dependen de la tarea.
> Los **[ANTI-ALUCINACIÓN]** son críticos si necesitas precisión factual.

---

## Paso 1 — Define el objetivo y el criterio de éxito `[SIEMPRE]`

- Escribe en **una sola frase** qué quieres que produzca el modelo. Si no cabe en una frase, el objetivo no está claro todavía.
- Define el criterio de "hecho": ¿cómo sabrás que la respuesta es buena? Escríbelo explícitamente en el prompt ("la respuesta es correcta si…").
- Distingue el **tipo de tarea**: factual, creativa, analítica, extractiva, de razonamiento o de código. Cada tipo necesita técnicas distintas.
- Identifica **quién usará la respuesta**: ¿es para ti, para una app, para un tercero? El destinatario cambia el tono, el nivel técnico y el formato.

**Ejemplo malo → bueno:**
> ❌ "Resume el tema"
> ✅ "Resume las causas del colapso hitita en 5 puntos de máximo 2 líneas cada uno, para un lector con conocimientos básicos de historia. La respuesta es buena si cada punto es independiente y verificable."

---

## Paso 2 — Diseña el rol con credenciales específicas `[SIEMPRE]`

- Investiga las **competencias reales** del experto que necesitas: qué estudió, dónde trabajó, qué metodologías usa, en qué publica. Cuanto más específico, mejor activa el modelo el conocimiento correcto.
- Incluye **institución, especialidad concreta y experiencia práctica** (no solo académica). "Arqueóloga con 20 años de campo en Siria" activa conocimiento distinto que "experta en historia".
- Añade **valores o actitudes del rol**: "priorizas exactitud sobre velocidad", "admites incertidumbre", "distingues hechos de hipótesis". Esto calibra el comportamiento epistémico.
- **Brevedad sobre elaboración**: el rol debe caber en 3-5 líneas. Un personaje demasiado largo añade ruido y satura la ventana de contexto útil.

> ⚠️ **Trampa frecuente:** roles genéricos como "eres un experto en X" sin detalles concretos apenas cambian el output. La especificidad es lo que activa el conocimiento especializado.

---

## Paso 3 — Construye el contexto y la memoria de trabajo `[SIEMPRE]`

- **Context engineering (tendencia 2025-2026):** el contexto no es solo las instrucciones. Es todo lo que el modelo ve: historial, documentos, herramientas disponibles, memoria previa. Diseña ese entorno completo, no solo el texto del prompt.
- Coloca la información más importante **al principio Y al final** del prompt (efecto de primacía y recencia). Los modelos son menos fiables con el contenido en el centro de contextos muy largos.
- **Provee solo el contexto necesario.** Contexto irrelevante baja la calidad. Si tienes 10.000 tokens de material, filtra los 1.000 más relevantes para la consulta actual.
- Para sesiones largas o agénticas: diseña un **sistema de memoria explícita** (vault, notas, resúmenes de sesión). El modelo no recuerda entre conversaciones — tú debes dárselo.

> 💡 **Karpathy (2025):** "El LLM es la CPU, la ventana de contexto es la RAM. Tu trabajo es ser el sistema operativo que carga exactamente el código y datos correctos para cada tarea."

---

## Paso 4 — Define las herramientas disponibles `[SEGÚN EL CASO]`

- Lista cada herramienta con **nombre, cuándo usarla y cómo formular las queries**. No asumas que el modelo sabe cuándo activarlas: sé explícito ("usa búsqueda web SIEMPRE que el dato sea de los últimos 2 años").
- Define la **secuencia de herramientas** cuando importa el orden: "primero revisa memoria, luego busca, luego sintetiza". Los modelos sin instrucciones tienden a saltarse pasos.
- Especifica qué hacer cuando una herramienta **falla o no devuelve resultados**: "si la búsqueda no encuentra nada relevante, indícalo y ofrece alternativa".
- Para modelos con razonamiento profundo (Think Mode, DeepThink): diles **cuándo activarlo**. Es costoso en tokens; úsalo solo para síntesis compleja o decisiones con datos contradictorios.

---

## Paso 5 — Pon guardrails anti-alucinación y epistémicos `[ANTI-ALUCINACIÓN]`

- **Da permiso explícito para no saber:** "Si no tienes certeza >90% sobre un dato, di 'no lo sé con certeza' y señala cómo verificarlo". Esto reduce alucinaciones hasta un 50% según estudios de 2025.
- **Exige etiquetas epistémicas** en cada afirmación principal:
  - ✅ Consenso académico establecido
  - ⚠️ Debate activo en la disciplina
  - 🔍 Hipótesis / investigación emergente
  - ❓ Requiere verificación actualizada
- **Para bibliografía y citas:** prohíbe explícitamente inventar referencias. Pide el formato "Apellido (Año) → VERIFICAR en [base de datos]" para cualquier cita que no provenga de búsqueda web activa en la sesión.
- **Añade auto-consistencia:** "Si las secciones de tu respuesta se contradicen entre sí, señálalo antes de entregar". Pedir revisión interna reduce errores factuales significativamente.
- **Calibra según el modelo:** Grok ~94% alucinación en citas, Perplexity ~37%, Claude/GPT en el medio. Ajusta la exigencia de verificación según el modelo que uses.

> ⚠️ Los modelos instruccionados tienden a ser más confiados de lo que deberían. "Might" y "potentially" en el output no garantizan calibración real. Los guardrails en el prompt son la segunda línea de defensa.

---

## Paso 6 — Diseña la cadena de razonamiento (CoT) `[SIEMPRE]`

- **Chain-of-Thought (CoT):** pide razonamiento paso a paso antes de la respuesta final. "Piensa primero, luego responde" mejora precisión en tareas complejas de forma consistente y demostrada.
- **Descompón tareas complejas en subtareas** secuenciales dentro del prompt: "Primero identifica X, luego contrasta con Y, finalmente sintetiza". El modelo sigue la secuencia explícita mejor que inferirla.
- **Self-consistency:** para preguntas importantes, pide al modelo que genere 2-3 caminos de razonamiento distintos y seleccione el más respaldado por evidencias. Reduce errores en tareas analíticas.
- Para **modelos de razonamiento nativo** (DeepSeek V4, o1, Claude con extended thinking): el CoT ya ocurre internamente. No necesitas pedirlo con tanta fuerza, pero sí especificar los subpasos que quieres que considere.

**Estructura CoT básica (copia esto):**
```
Paso 1: Establece el marco o cronología base.
Paso 2: Identifica tensiones o contradicciones en las fuentes.
Paso 3: Sintetiza una interpretación coherente con los datos disponibles.
Paso 4: Señala qué requiere verificación adicional.
```

---

## Paso 7 — Añade ejemplos Few-Shot bien elegidos `[SEGÚN EL CASO]`

- Los **ejemplos Few-Shot** son la técnica con mayor ROI después de un buen contexto. Muestra 1-3 pares entrada/salida en el formato exacto que quieres. El modelo aprende el patrón, no solo la instrucción.
- Elige ejemplos que cubran **casos borde o difíciles**, no solo los fáciles. Si el modelo va a encontrar incertidumbre, incluye un ejemplo de cómo responder ante incertidumbre correctamente.
- Incluye también un **ejemplo negativo etiquetado**: "Esto es lo que NO quiero: [ejemplo malo]. Esto sí: [ejemplo bueno]". Los negativos son especialmente potentes para problemas de formato o tono.
- **Prueba Zero-Shot primero** si tu modelo es de frontera (GPT-5, Claude, etc.). Los modelos avanzados a veces empeoran con ejemplos si ya comprenden la tarea por instrucción. Añade Few-Shot solo si el zero-shot falla.

---

## Paso 8 — Especifica el contrato de output `[SIEMPRE]`

- Define **formato, estructura de secciones, longitud aproximada y tono**. Lo que no especificas, el modelo lo elige según patrones de entrenamiento, no según tus necesidades.
- Usa etiquetas Markdown o XML para secciones obligatorias:
  ```
  Tu respuesta DEBE incluir estas secciones en este orden:
  ## Resumen ejecutivo
  ## Análisis detallado
  ## Estado del debate académico
  ## Fuentes y bibliografía
  ## Limitaciones y advertencias
  ```
- **Especifica el público objetivo y el nivel técnico**: "escribe para alguien con conocimientos universitarios de historia, sin jerga sin explicar".
- Añade instrucciones para la incertidumbre en el output: "si algo requiere verificación, ponlo en la sección ## Advertencias al final, no inline en el texto". Esto separa el contenido de los metadatos de calidad.

> 💡 **Insight clave 2026:** "Prompt engineering no es escribir prompts más largos. Es escribir especificaciones más claras. La estructura supera a la longitud."

---

## Paso 9 — Adapta al modelo específico que usas `[SEGÚN EL CASO]`

| Modelo | Fortalezas para investigación | Ajustes necesarios |
|--------|-------------------------------|--------------------|
| **Grok** | DeepSearch en tiempo real, acceso a X/Twitter de investigadores | Guardrails de citas muy estrictos (94% alucinación en bibliografía) |
| **Claude** | Razonamiento largo, redacción académica, respeta formato | Menos agresivo en búsqueda, complementar con herramientas externas |
| **DeepSeek V4** | 1M contexto, Thinking Mode nativo y visible, CoT explícita | En preview — verificar comportamiento según versión |
| **Mistral L3** | Multilingüe, integración con Tavily + Obsidian, 256K contexto | Sin búsqueda nativa — depende de Tavily externo |
| **GPT-OSS 120B / Groq** | 500+ tokens/seg, razonamiento factual sólido, gratis | Sin búsqueda web nativa en chat, complementar con Perplexity/Scholar |
| **Perplexity** | Citas verificadas en tiempo real (37% alucinación), Deep Research | API de pago — usar web gratis para verificación manual de citas |

- **Fija la versión del modelo** en producción (model snapshot). El comportamiento cambia entre versiones aunque el nombre sea el mismo.
- Para **modelos open-weight** (Mistral, DeepSeek, GPT-OSS): el system prompt tiene más peso relativo que en modelos propietarios. Sé más explícito con las instrucciones de comportamiento.

---

## Paso 10 — Itera, evalúa y documenta `[SIEMPRE]`

- **Testea con al menos 5-10 inputs variados** antes de considerar el prompt estable. Un prompt que funciona para un caso puede fallar sistemáticamente en otro.
- Define un **rubric de evaluación**: lista de 3-5 criterios binarios que puedas chequear en cada output, no evaluación por impresión general.
- **Haz una modificación a la vez.** Cambiar rol + formato + instrucciones simultáneamente hace imposible saber qué mejoró qué. Itera en secuencia.
- **Guarda versiones del prompt con fecha y notas** de qué cambió y por qué. Los prompts son código: necesitan control de versiones.
- Para refinamiento en conversación: si el output no es perfecto, no reescribas desde cero. Añade una instrucción de corrección específica en el siguiente turno y analiza qué parte del prompt original falló.

**Rubric mínimo viable (copia y adapta):**
```
[ ] ¿La respuesta cumple el objetivo definido en el paso 1?
[ ] ¿Usa las etiquetas epistémicas correctamente?
[ ] ¿El formato es exactamente el especificado en el contrato de output?
[ ] ¿No hay afirmaciones sin etiquetar ni citas sin advertencia de verificación?
[ ] ¿La longitud es apropiada (ni demasiado corta ni relleno innecesario)?
```

---

## Referencia rápida — Técnicas por tipo de problema

| Problema | Técnica principal | Técnica secundaria |
|----------|------------------|--------------------|
| Respuestas imprecisas o vagas | Contrato de output + CoT | Few-Shot con ejemplos correctos |
| Alucinación de datos/citas | Guardrails epistémicos + permiso para no saber | Exigir búsqueda web antes de afirmar |
| Formato incorrecto | Ejemplos Few-Shot negativos + secciones obligatorias | Contrato de output con etiquetas XML |
| Razonamiento superficial | CoT explícito + self-consistency | Think Mode si el modelo lo soporta |
| Pérdida de contexto en sesiones largas | Context engineering + resúmenes de sesión | Vault/memoria externa (Obsidian, etc.) |
| El modelo no usa las herramientas | Instrucciones explícitas de cuándo y cómo | Ejemplos de queries correctas para cada herramienta |
| Respuesta demasiado general | Rol con credenciales específicas + restricción de dominio | Contexto adicional del caso concreto |
| Inconsistencias internas | Auto-revisión + CoT | Self-consistency con 2-3 caminos |

---

## Plantilla base universal (copia y rellena)

```
Eres [ROL CON CREDENCIALES ESPECÍFICAS], actualizado/a a [FECHA].
Tu prioridad absoluta es [VALOR PRINCIPAL: exactitud / creatividad / velocidad…].

REGLAS ESTRICTAS:
1. [GUARDRAIL 1 — ej: nunca inventes fuentes]
2. [GUARDRAIL 2 — ej: etiqueta cada afirmación como ✅/⚠️/🔍/❓]
3. [GUARDRAIL 3 — ej: si no tienes certeza >X%, di "no lo sé" y sugiere verificación]
4. [INSTRUCCIÓN DE RAZONAMIENTO — ej: razona paso a paso antes de responder]

HERRAMIENTAS DISPONIBLES (úsalas así):
- [HERRAMIENTA 1]: usar cuando [CONDICIÓN]. Query modelo: "[EJEMPLO DE QUERY]"
- [HERRAMIENTA 2]: usar cuando [CONDICIÓN].

TAREA: [DESCRIPCIÓN CLARA Y ESPECÍFICA DEL OBJETIVO]

EJEMPLOS DE ENTRADA/SALIDA DESEADA:
Input: [EJEMPLO 1]
Output correcto: [RESPUESTA MODELO]

Input: [EJEMPLO NEGATIVO — qué NO quiero]
Output incorrecto: [LO QUE NO DEBE HACER]

FORMATO DE SALIDA OBLIGATORIO:
## [SECCIÓN 1]
## [SECCIÓN 2]
## [SECCIÓN 3 — siempre: Limitaciones y advertencias]
## [SECCIÓN 4 — siempre: Fuentes / Verificación]

CRITERIO DE ÉXITO: La respuesta es buena si [CRITERIO MEDIBLE].
```

---

*Guía creada junio 2026 · Basada en las mejores prácticas actualizadas de prompt y context engineering*
*Complementar con los system prompts específicos para Grok, Mistral, DeepSeek y Groq ya entregados*