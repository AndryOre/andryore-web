/**
 * Whether an href leaves the site.
 * @param href A link target.
 * @returns `true` for absolute `http` and `https` URLs.
 */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

/**
 * The one `rel` value every external link uses, so a dist audit only has to
 * verify it.
 * @param options Link kind.
 * @param options.sponsored Marks a paid or affiliate link.
 * @returns The `rel` attribute value.
 */
export function externalLinkTokens({
  sponsored = false,
}: { sponsored?: boolean } = {}): string {
  return sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'
}

/**
 * `rel` for a link that may or may not be external.
 * @param href A link target.
 * @returns The external `rel`, or `undefined` for internal links.
 */
export function tokensForHref(href: string): string | undefined {
  return isExternalHref(href) ? externalLinkTokens() : undefined
}
