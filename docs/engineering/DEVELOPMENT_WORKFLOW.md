# Moon — Flujo de trabajo para humanos y Codex

## Antes de actuar
1. Leer el `AGENTS.md` más cercano y `docs/product/PRODUCT_CONTEXT.md`.
2. Identificar objetivo y revisar `MVP_SCOPE.md`, `BUSINESS_RULES.md`, `USER_FLOWS.md`.
3. Inspeccionar rutas reales, dependencias y patrones; no asumir `apps/web` o `apps/api` sin verificar.
4. Consultar `OPEN_DECISIONS.md`: distinguir confirmado, propuesto y pendiente.
5. Cargar **solo las skills relevantes**: para UI `moon-design-system` + `angular-developer` (y diseño según necesidad); para Nest `nestjs-best-practices`; para contratos Zod cuando encaje con arquitectura existente.

## Al planificar
- Formular intención, criterios de aceptación, casos de error, permisos, riesgos de datos y alcance.
- Para cambios end-to-end explicar contratos, validación y pasos de migración si corresponden.
- Pedir autorización antes de escoger proveedores/ORM o aumentar alcance de MVP.

## Al implementar
- Cambios pequeños y coherentes; reusar componentes y tokens.
- Estado de carga, error y éxito; accesibilidad; cuidado con PII.
- En registro probar carreras de concurrencia, duplicados y cupo lleno; en OTP expiración, abuso y replay.
- No modificar tests para esconder fallos y no inventar resultados de checks.

## Al entregar
- Enumerar cambios, rutas, pruebas realmente ejecutadas y limitaciones.
- Si cambia una regla o decisión, actualizar el archivo de contexto correspondiente y, si aplica, ADR.
- Si cambia identidad visual, sincronizar con las referencias de `moon-design-system`.

## Prompts reutilizables
**Análisis sin código:** «Lee AGENTS.md, PRODUCT_CONTEXT, MVP_SCOPE, BUSINESS_RULES y OPEN_DECISIONS. Inspecciona el monorepo. Propón un plan para [función] con criterios de aceptación, riesgos y decisiones pendientes. No modifiques código».

**Implementación:** «Implementa [función] respetando AGENTS.md y docs. Usa las skills relevantes. Verifica permisos en backend, contrato Angular/Nest y estados UI. Ejecuta checks disponibles y reporta resultados reales».
