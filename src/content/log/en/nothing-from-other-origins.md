---
lang: en
key: nothing-from-other-origins
title: This site asks nothing from other origins
description:
  No CDNs, no hosted fonts, no embeds. Why every file on this site comes from
  one place.
date: 2026-10-17
readMinutes: 2
review: Seed draft for Andry's review (ADR 0007). Edit or replace before launch.
---

Every file on this site is served from andryore.dev. There are no CDNs, no
hosted fonts and no embeds. The fonts ship with the site, and so does every
icon.

I did it for three reasons.

- **Speed.** One origin means one connection to set up, and nothing waits on a
  server I do not control.
- **Privacy.** A visitor's browser never talks to a company they did not choose
  to talk to.
- **Durability.** If a third-party service changes its terms or disappears, this
  site keeps working.

There is one exception: a cookieless analytics script that counts visits and
nothing else. It sets no cookies and shows no banner.

The rule is written down as a decision record in the repository, so I cannot
quietly break it later.
