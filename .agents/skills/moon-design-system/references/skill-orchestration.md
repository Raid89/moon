# Moon — Skill Orchestration

## Objetivo
Definir cómo deben colaborar las skills instaladas para que Codex produzca resultados coherentes.

## Skills activas
- angular-developer
- frontend-design
- ui-ux-pro-max
- ui-visual-composition
- design-systems-frontend-architecture
- web-design-guidelines
- moon-design-system

## Rol de cada skill

### moon-design-system
Es la fuente de verdad visual de Moon.
Define identidad, tono, mascot usage, layout, motion y principios de marca.

### frontend-design
Propone soluciones de interfaz con intención visual y personalidad.

### ui-ux-pro-max
Ayuda a evaluar patrones UX, jerarquía, composición y criterio visual.

### ui-visual-composition
Ayuda a mejorar el balance visual, spacing, ritmo, contraste y jerarquía.

### design-systems-frontend-architecture
Aterriza componentes, tokens y consistencia escalable.

### angular-developer
Implementa en Angular los componentes y secciones definidas.

### web-design-guidelines
Valida buenas prácticas generales de diseño web y experiencia.

## Regla de prioridad
Cuando haya conflicto entre recomendaciones:
1. moon-design-system
2. experiencia de usuario
3. accesibilidad
4. consistencia del sistema
5. preferencias estéticas secundarias

## Flujo recomendado para tareas
Cuando se diseñe o implemente una nueva sección:

1. Consultar moon-design-system
2. Definir objetivo de la sección
3. Proponer estructura visual
4. Validar consistencia con el sistema
5. Implementar en Angular
6. Auditar accesibilidad y calidad

## Prompt recomendado para Codex
Usa moon-design-system, frontend-design, ui-visual-composition,
design-systems-frontend-architecture y angular-developer.

Diseña e implementa una sección para Moon manteniendo:
- estética nocturna cálida
- alto contraste negro + naranja + crema
- estilo juvenil y social
- componentes reutilizables
- responsive design
- accesibilidad
- consistencia con la mascota y la marca

Antes de implementar, explica brevemente:
- objetivo de la sección
- estructura visual
- componentes que crearás
- tokens que usarás