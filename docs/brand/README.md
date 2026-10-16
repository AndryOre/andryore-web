# Brand kit

The public assets of the andryore.dev brand. The kit lives in this folder; see
[ADR 0001](../adr/0001-brand-kit-in-docs-brand.md). Rasters are generated only
by `bun run brand:export` and never edited by hand.

- [tokens.css](tokens.css): palette B7 and the two typefaces as shadcn-style
  variables, light and dark.
- [logo/](logo/): wordmark and "Ao" mark as outlined SVG, in color, dark, black,
  white and grid, plus PNG marks.
- [brandbook/fonts.css](brandbook/fonts.css) and
  [brandbook/fonts/](brandbook/fonts/): the Space Grotesk and JetBrains Mono
  font files and their [license](brandbook/fonts/OFL.md).
- [og/](og/): the Open Graph image.
- [avatar/](avatar/): the current memoji avatar.
- [tools/](tools/): the export script and its tests.

## Export

`bun run brand:export` reads `logo/` and `brandbook/fonts/` and writes the
platform banners and fallback avatars into `social/`, which is not tracked.

## License

See [ADR 0007](../adr/0007-split-license.md).
