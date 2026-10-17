---
lang: es
key: nothing-from-other-origins
title: Este sitio no le pide nada a otros orígenes
description:
  Sin CDN, sin fuentes alojadas fuera, sin embeds. Por qué todo en este sitio
  sale de un solo lugar.
date: 2026-10-17
readMinutes: 2
sourceHash: c88cb5593086
review:
  Borrador semilla para revisión de Andry (ADR 0007). Edítalo o reemplázalo
  antes del lanzamiento.
---

Todos los archivos de este sitio se sirven desde andryore.dev. No hay CDN, ni
fuentes alojadas fuera, ni embeds. Las fuentes viajan con el sitio, y también
cada ícono.

Lo hice por tres razones.

- **Velocidad.** Un solo origen significa una sola conexión por abrir, y nada
  espera a un servidor que no controlo.
- **Privacidad.** El navegador de quien visita nunca habla con una empresa que
  no eligió.
- **Durabilidad.** Si un servicio externo cambia sus condiciones o desaparece,
  este sitio sigue funcionando.

Hay una excepción: un script de analítica sin cookies que cuenta visitas y nada
más. No guarda cookies y no muestra ningún aviso.

La regla está escrita como registro de decisión en el repositorio, así que no
puedo romperla en silencio más adelante.
