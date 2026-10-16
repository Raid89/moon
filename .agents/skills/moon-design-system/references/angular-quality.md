# Moon — Angular Quality Notes

## Objetivo
Implementar la identidad visual de Moon en Angular sin sacrificar:
- mantenibilidad
- reusabilidad
- performance
- accesibilidad
- consistencia

## Principios
- componentes desacoplados
- estilos reutilizables
- tokens centralizados
- separación clara entre UI y lógica
- mobile-first
- accesibilidad desde el inicio

## Organización recomendada
- design tokens centralizados
- componentes UI reutilizables
- secciones de landing desacopladas
- assets optimizados
- iconografía consistente

## Componentes candidatos
- Button
- SectionHeader
- HeroBanner
- FeatureCard
- TestimonialCard
- EventCard
- MascotBlock
- CTASection
- Navbar
- Footer

## Estilos
Preferir:
- variables CSS o design tokens
- nomenclatura consistente
- estilos previsibles
- evitar sobreescrituras caóticas

## Accesibilidad
Asegurar:
- contraste suficiente
- foco visible
- semántica HTML correcta
- navegación por teclado
- alt text en imágenes
- headings bien estructurados

## Performance
- optimizar imágenes
- lazy loading donde aplique
- evitar bundles innecesarios
- revisar animaciones
- evitar dependencia excesiva de librerías pesadas si no aportan valor real

## SSR / SEO
Si Moon depende de descubrimiento orgánico o landing pública:
- considerar SSR o prerender
- metatags por página
- títulos y descripciones claros
- contenido indexable