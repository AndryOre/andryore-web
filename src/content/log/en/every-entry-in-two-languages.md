---
lang: en
key: every-entry-in-two-languages
title: Every entry exists in two languages
description:
  How this Log pairs English and Spanish files, and why the build fails when one
  is missing.
date: 2026-10-18
readMinutes: 2
review: Seed draft for Andry's review (ADR 0007). Edit or replace before launch.
---

The Log lives in plain Markdown files. Each entry is a pair: one file in English
and one in Spanish, tied together by a shared key.

```yaml
lang: en
key: every-entry-in-two-languages
```

Adding a pair publishes the entry in both languages. Nothing else changes.

If I forget one half, the build stops and names the missing file. I would rather
fail a build than ship a page that only works in one language.

The Spanish file also stores a short fingerprint of the English text it was
written from. When I edit the English entry later, a script reports that the
Spanish one is stale, so the two do not drift apart.
