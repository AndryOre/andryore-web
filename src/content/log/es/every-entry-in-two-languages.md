---
lang: es
key: every-entry-in-two-languages
title: Cada entrada existe en dos idiomas
description:
  Cómo este Log empareja archivos en inglés y español, y por qué el build falla
  si falta uno.
date: 2026-10-18
readMinutes: 2
sourceHash: 091f2f91e368
review:
  Borrador semilla para revisión de Andry (ADR 0007). Edítalo o reemplázalo
  antes del lanzamiento.
---

El Log vive en archivos Markdown simples. Cada entrada es un par: un archivo en
inglés y otro en español, unidos por una clave compartida.

```yaml
lang: en
key: every-entry-in-two-languages
```

Agregar un par publica la entrada en ambos idiomas. Nada más cambia.

Si olvido una de las dos mitades, el build se detiene y nombra el archivo que
falta. Prefiero que falle un build a publicar una página que solo funciona en un
idioma.

El archivo en español también guarda una huella corta del texto en inglés a
partir del cual se escribió. Cuando edito después la entrada en inglés, un
script avisa que la de español quedó desactualizada, y así las dos no se
separan.
