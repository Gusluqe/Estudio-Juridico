# DESIGN.md — Estudio Jurídico · concepto "expediente"

## Concepto
El sitio es un expediente judicial. Panel izquierdo fijo = carátula (tinta oscura, sello giratorio, datos del estudio). Columna derecha = fojas numeradas (Foja 01…07) sobre papel crema con doble línea de margen vino, estampillas de goma, índice con puntos de guía y cierre "Archívese."

## Scene sentence (theme decision)
Una persona recién despedida busca abogado desde el celular a las 23h; la carátula oscura contiene y da seriedad, las fojas claras se leen como documento. El verde inglés (lámpara de banquero, escritorio de cuero) es el único acento; vino, azul tinta y violeta quedan como paletas alternativas elegibles desde el admin (data-theme).

## Color strategy: Committed
Tinta + papel cargan la superficie; un solo acento verde usado con intención (CTAs, sellos, numeración).

Tokens (OKLCH):
- `--ink`: oklch(17% 0.012 175) — tinta verdosa oscura, nunca #000
- `--paper`: oklch(95.5% 0.012 85) — papel crema, nunca #fff
- `--accent`: oklch(64% 0.115 162) — verde sobre tinta
- `--accent-deep`: oklch(40% 0.092 165) — verde profundo sobre papel (AA)
- Texto sobre tinta: oklch(91% 0.008 40) / oklch(69% 0.014 35)
- Texto sobre papel: oklch(25% 0.018 30) / oklch(43% 0.018 30)

## Typography
- Display: **Fraunces** variable (WONK 1 en itálicas). Títulos de foja y carátula.
- Texto/UI: **Instrument Sans** 400/500/600.
- **JetBrains Mono** para el lenguaje "expediente": etiquetas FOJA, materia, estampillas, sello circular, cifras de constancias tabulares.

## Motivos del sistema
- Doble línea vertical vino en el margen de las fojas (hoja de expediente) via background-gradient, y `.caratula-borde` en la carátula.
- `.estampilla`: borde 2px + outline offset, rotada -3.5°, mono uppercase (sello de goma).
- `.sello-giratorio`: SVG textPath circular, rotación 26s lineal.
- Índice de áreas con líder de puntos (`.indice-puntos`, dotted) y CONSULTAR ↗ mono.
- Cierre editorial: "Archívese." itálica gigante.

## Motion
- Reveal on scroll (IntersectionObserver, translateY 22px, 700ms ease-out-quint, stagger 80ms).
- Count-up en constancias. Sello giratorio continuo. Todo se apaga con prefers-reduced-motion.

## Bans reafirmados
Sin gradient-text, sin side-stripes decorativas, sin glassmorphism, sin grillas de cards idénticas, sin em dashes en copy.
