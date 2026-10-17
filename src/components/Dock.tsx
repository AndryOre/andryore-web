import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react'

import { localePath, LOCALES, type Locale } from '@/i18n/locales'
import {
  activePageKey,
  DOCK_PAGES,
  pageHref,
  type DockPageKey,
} from '@/lib/dock'
import {
  focusInitialItem,
  focusTrigger,
  magnifyItems,
  moveInMenu,
  shouldMagnify,
  type DockMenuName,
} from '@/lib/dock-dom'
import { THEME_PREFERENCES, type ThemePreference } from '@/lib/theme'
import { chooseTheme } from '@/lib/theme-store'
import { cn } from '@/lib/utils'

import {
  ThemeIcon,
  useThemePreference,
  type ThemeToggleCopy,
} from './ThemeToggle'
import { Button } from './ui/button'

interface DockCopy {
  label: string
  pages: Record<DockPageKey, string>
  language: { label: string } & Record<Locale, string>
}

interface DockProps {
  copy: DockCopy
  themeCopy: ThemeToggleCopy
  locale: Locale
  path: string
}

const ITEM_CLASS =
  'relative inline-flex size-11 items-center justify-center rounded-pill text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-5 [&_svg]:shrink-0'

const PAGE_ICONS: Record<DockPageKey, ReactElement> = {
  home: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  products: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  log: (
    <>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M9 11h6M9 15h6" />
    </>
  ),
  about: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </>
  ),
  uses: (
    <>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
}

function PageIcon({ page }: { page: DockPageKey }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PAGE_ICONS[page]}
    </svg>
  )
}

function Tooltip({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute bottom-full left-1/2 mb-5 -translate-x-1/2 translate-y-1 rounded-lg bg-foreground px-2.5 py-1 text-xs font-medium whitespace-nowrap text-background opacity-0 transition duration-150 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-has-focus-visible:translate-y-0 group-has-focus-visible:opacity-100 group-data-[menu-open]:hidden motion-reduce:transition-none"
    >
      {children}
    </span>
  )
}

function DockItem({
  label,
  menuOpen = false,
  children,
}: {
  label: string
  menuOpen?: boolean
  children: ReactNode
}) {
  return (
    <div className="group relative" data-menu-open={menuOpen ? '' : undefined}>
      <div
        data-dock-scale
        className="origin-bottom transition-transform duration-160 ease-out motion-reduce:transition-none"
      >
        {children}
      </div>
      <Tooltip>{label}</Tooltip>
    </div>
  )
}

function MenuPanel({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <div
      role="menu"
      aria-label={label}
      className="absolute bottom-full left-1/2 z-10 mb-3 grid min-w-36 origin-bottom -translate-x-1/2 gap-0.5 rounded-card border border-border bg-popover p-1.5 text-popover-foreground shadow-lg transition duration-150 ease-out motion-reduce:transition-none starting:scale-95 starting:opacity-0"
    >
      {children}
    </div>
  )
}

/**
 * The language menu: one link per language, each to the same page.
 * @param props Component props.
 * @param props.copy Language names and the menu label.
 * @param props.locale The current language.
 * @param props.path Locale-neutral path of the current page.
 * @returns The menu panel.
 */
export function LanguageMenu({
  copy,
  locale,
  path,
}: {
  copy: DockCopy['language']
  locale: Locale
  path: string
}) {
  return (
    <MenuPanel label={copy.label}>
      <div data-dock-menu="language" className="contents">
        {LOCALES.map((code) => (
          <a
            key={code}
            role="menuitem"
            href={localePath(code, path)}
            hrefLang={code}
            lang={code}
            data-locale-switch={code}
            aria-current={code === locale ? 'true' : undefined}
            className={menuItemClass(code === locale)}
          >
            {copy[code]}
          </a>
        ))}
      </div>
    </MenuPanel>
  )
}

/**
 * The theme menu: system, light and dark as radio items.
 * @param props Component props.
 * @param props.copy Theme labels.
 * @param props.preference The stored preference.
 * @param props.onChoose Called with the chosen preference.
 * @returns The menu panel.
 */
export function ThemeMenu({
  copy,
  preference,
  onChoose,
}: {
  copy: ThemeToggleCopy
  preference: ThemePreference
  onChoose: (option: ThemePreference) => void
}) {
  return (
    <MenuPanel label={copy.label}>
      <div data-dock-menu="theme" className="contents">
        {THEME_PREFERENCES.map((option) => (
          <button
            key={option}
            type="button"
            role="menuitemradio"
            aria-checked={preference === option}
            className={menuItemClass(preference === option)}
            onClick={() => {
              onChoose(option)
            }}
          >
            {copy[option]}
          </button>
        ))}
      </div>
    </MenuPanel>
  )
}

const menuItemClass = (selected: boolean): string =>
  cn(
    'rounded-xl px-3 py-2 text-left text-sm no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring',
    selected
      ? 'bg-muted text-foreground'
      : 'text-muted-foreground hover:text-foreground',
  )

const scaleTargets = (nav: HTMLElement): NodeListOf<HTMLElement> =>
  nav.querySelectorAll<HTMLElement>('[data-dock-scale]')

const onPointerMove = (event: PointerEvent<HTMLElement>): void => {
  if (!shouldMagnify(globalThis, event.pointerType)) return
  magnifyItems(scaleTargets(event.currentTarget), event.clientX)
}

const onPointerLeave = (event: PointerEvent<HTMLElement>): void => {
  magnifyItems(scaleTargets(event.currentTarget), undefined)
}

function useMenuBehaviour(
  nav: HTMLElement | null,
  openMenu: DockMenuName | undefined,
  close: () => void,
): void {
  useEffect(() => {
    if (!nav || !openMenu) return
    focusInitialItem(nav, openMenu)
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        focusTrigger(nav, openMenu)
        return
      }
      if (moveInMenu(nav, openMenu, event.key, document.activeElement))
        event.preventDefault()
    }
    const onOutside = (event: Event): void => {
      if (event.target instanceof Node && !nav.contains(event.target)) close()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onOutside)
    document.addEventListener('focusin', onOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onOutside)
      document.removeEventListener('focusin', onOutside)
    }
  }, [nav, openMenu, close])
}

/**
 * The floating pill navigation: the five pages, then the language and theme
 * menus. Neighbours of the pointer magnify on fine pointers when motion is
 * allowed, the active page carries a pill that morphs between routes through
 * view transitions, and both menus open upward.
 * @param props Component props.
 * @param props.copy Localised labels of the dock.
 * @param props.themeCopy Localised labels of the theme options.
 * @param props.locale The current language.
 * @param props.path Locale-neutral path of the current page.
 * @returns The navigation landmark holding the pages and both menus.
 */
export default function Dock({ copy, themeCopy, locale, path }: DockProps) {
  const [nav, setNav] = useState<HTMLElement | null>(null)
  const [openMenu, setOpenMenu] = useState<DockMenuName | undefined>()
  const preference = useThemePreference()
  const activeKey = activePageKey(path)

  const closeMenu = useCallback(() => {
    setOpenMenu(undefined)
  }, [])

  useMenuBehaviour(nav, openMenu, closeMenu)

  const chooseAndClose = (option: ThemePreference): void => {
    chooseTheme(option)
    setOpenMenu(undefined)
    if (nav) focusTrigger(nav, 'theme')
  }

  const toggleMenu = (name: DockMenuName): void => {
    setOpenMenu((current) => (current === name ? undefined : name))
  }

  return (
    <nav
      ref={setNav}
      aria-label={copy.label}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="pointer-events-auto relative inline-flex items-center gap-1 rounded-pill border border-border bg-card/92 p-2 shadow-lg shadow-black/10"
    >
      {DOCK_PAGES.map((page) => {
        const active = activeKey === page.key
        return (
          <DockItem key={page.key} label={copy.pages[page.key]}>
            <a
              href={pageHref(locale, page.path)}
              aria-label={copy.pages[page.key]}
              aria-current={active ? 'page' : undefined}
              className={cn(ITEM_CLASS, active && 'text-foreground')}
            >
              {active && (
                <span
                  data-dock-pill
                  aria-hidden="true"
                  className="absolute inset-0 rounded-pill bg-muted"
                />
              )}
              <span className="relative inline-flex">
                <PageIcon page={page.key} />
              </span>
            </a>
          </DockItem>
        )
      })}

      <span aria-hidden="true" className="mx-1 h-6 w-px bg-border" />

      <DockItem label={copy.language.label} menuOpen={openMenu === 'language'}>
        <Button
          variant="dock"
          size="dock"
          aria-label={copy.language.label}
          aria-haspopup="menu"
          aria-expanded={openMenu === 'language'}
          data-dock-trigger="language"
          onClick={() => {
            toggleMenu('language')
          }}
        >
          <span className="font-mono text-xs font-bold tracking-wide uppercase">
            {locale}
          </span>
        </Button>
        {openMenu === 'language' && (
          <LanguageMenu copy={copy.language} locale={locale} path={path} />
        )}
      </DockItem>

      <DockItem label={themeCopy.label} menuOpen={openMenu === 'theme'}>
        <Button
          variant="dock"
          size="dock"
          aria-label={themeCopy.label}
          aria-haspopup="menu"
          aria-expanded={openMenu === 'theme'}
          data-dock-trigger="theme"
          onClick={() => {
            toggleMenu('theme')
          }}
        >
          <ThemeIcon preference={preference} />
        </Button>
        {openMenu === 'theme' && (
          <ThemeMenu
            copy={themeCopy}
            preference={preference}
            onChoose={chooseAndClose}
          />
        )}
      </DockItem>
    </nav>
  )
}
