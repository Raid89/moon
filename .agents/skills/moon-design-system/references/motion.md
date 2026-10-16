# Moon — Motion Guidelines

## Filosofía de movimiento
El movimiento en Moon debe reforzar:
- emoción
- calidez
- energía
- descubrimiento
- interacción social

Las animaciones deben hacer que la experiencia se sienta viva, no pesada.

## Principios
- Suave
- Expresivo
- Natural
- Intencional
- Ligero
- Performante

## Tipos de animación recomendados

### Entrada de secciones
- fade up
- slight slide
- reveal progresivo
- stagger en listas o cards

### Microinteracciones
- hover en botones
- elevación sutil de tarjetas
- highlights en CTA
- reacción de íconos
- cambios de estado suaves

### Mascota
La mascota puede:
- entrar con pequeño bounce
- reaccionar con wave o blink
- aparecer en empty states
- acompañar mensajes de éxito

## Ritmo
Las animaciones deben sentirse:
- rápidas en UI
- suaves en transiciones
- un poco más teatrales en hero o campañas

## Recomendaciones técnicas
Si se usan animaciones en Angular:

- priorizar `transform` y `opacity`
- evitar animar propiedades costosas
- optimizar imágenes
- considerar carga diferida
- limitar animaciones pesadas simultáneas

## Scroll animations
Pueden usarse para:
- revelar beneficios
- mostrar cards
- destacar testimonios
- hacer más narrativa la landing

Usarlas con moderación.

## Reduced motion
Siempre respetar preferencias de accesibilidad:

- soportar `prefers-reduced-motion`
- reducir desplazamientos largos
- evitar parallax agresivo
- desactivar loops innecesarios

## Qué evitar
- animaciones lentas e incómodas
- exceso de bounce infantil
- motion decorativo sin propósito
- abuso de parallax
- saturar cada componente con efectos