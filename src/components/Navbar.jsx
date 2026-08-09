import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useI18n } from '../i18n/useI18n';
import './Navbar.css';

// =========================================================================
// 🛠️ THE MASTER TWEAKING ZONE: NAVBAR 🛠️
// One design at one size for every route. Landing is the only variation, and
// only in stacking: the bar is absolutely positioned so the hero art can run
// to the top of the page. Its box is identical to the menus'.
// =========================================================================
const NAV_HEIGHT = '62px';
const CONTENT_MAX_WIDTH = '1440px';

const INK = '#06133d';
const ACCENT_BLUE = '#1f78f2';

const NAV_FONT = '"Nunito", "Inter", sans-serif';

// The soft white pill used for the active tab and the language control.
const PILL_BG = '#ffffff';
const PILL_SHADOW = '0 7px 16px rgba(23, 31, 56, 0.13), inset 0 0 0 1px rgba(15, 23, 42, 0.06)';

// Breakpoint below which hamburger menu appears
const MOBILE_BREAKPOINT = 700;
// =========================================================================

const BASE_NAV_ITEMS = [
  { labelKey: 'nav.games', path: '/games' },
  { labelKey: 'nav.activities', path: '/activities' },
  { labelKey: 'nav.tools', path: '/tools' },
];

// Translations store nav labels in caps; the shared bar renders them Title Case.
function formatNavLabel(label) {
  return label.toLocaleLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase());
}

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < MOBILE_BREAKPOINT);
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const isLanding = location.pathname === '/';
  const isQuizSurface = location.pathname === '/quiz'
    || location.pathname.startsWith('/quiz/')
    || location.pathname === '/quiz/create'
    || location.pathname === '/quiz/generate';
  const navItems = user ? [...BASE_NAV_ITEMS, { labelKey: 'nav.profile', path: '/profile' }] : BASE_NAV_ITEMS;

  const handleNav = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <>
      <nav style={{ ...styles.navContainer, ...(isLanding ? styles.navContainerLanding : {}), ...(isQuizSurface ? styles.navContainerQuiz : {}) }}>
        <div style={styles.navInner}>

          <div
            className="bop-nav-logo"
            style={styles.logo}
            onClick={(event) => {
              const selection = window.getSelection();
              const isSelectingLogoText = selection
                && !selection.isCollapsed
                && event.currentTarget.contains(selection.anchorNode)
                && event.currentTarget.contains(selection.focusNode);

              if (!isSelectingLogoText) handleNav('/');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleNav('/');
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={t('nav.home')}
          >
            <img
              src="/brand/classbop-logo-purple.png"
              alt=""
              aria-hidden="true"
              draggable="false"
              style={styles.logoImage}
            />
            <span
              aria-hidden="true"
              style={styles.logoCopyText}
            >
              classbop.com
            </span>
          </div>

          {isMobile ? (
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              style={styles.hamburger}
              aria-label={t('nav.toggleMenu')}
            >
              <span style={{ ...styles.bar, transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
              <span style={{ ...styles.bar, opacity: menuOpen ? 0 : 1 }} />
              <span style={{ ...styles.bar, transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
            </button>
          ) : (
            <div style={styles.tabContainer}>
              {navItems.map(({ labelKey, path }) => {
                const isActive = location.pathname === path
                  || (isQuizSurface && path === '/games');
                const label = t(labelKey);
                return (
                  <button
                    key={label}
                    className="bop-nav-tab"
                    onClick={() => handleNav(path)}
                    style={{
                      ...styles.tabButton,
                      ...(isActive ? styles.tabButtonActive : {}),
                    }}
                  >
                    {formatNavLabel(label)}
                  </button>
                );
              })}
              {!loading && !user && (
                  <button
                    type="button"
                    className="bop-nav-login"
                    onClick={() => handleNav('/auth?mode=signup')}
                    style={styles.loginPill}
                  >
                    {formatNavLabel(t('nav.signIn'))}
                  </button>
              )}
              <LanguageSwitcher />
            </div>
          )}

        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div style={styles.mobileMenu}>
          {navItems.map(({ labelKey, path }) => {
            const isActive = location.pathname === path
              || (isQuizSurface && path === '/games');
            const label = t(labelKey);
            return (
              <button
                key={label}
                onClick={() => handleNav(path)}
                style={{
                  ...styles.mobileMenuItem,
                  ...(isActive ? styles.mobileMenuItemActive : {}),
                }}
              >
                {formatNavLabel(label)}
              </button>
            );
          })}
          {!loading && !user && (
            <button onClick={() => handleNav('/auth?mode=signup')} style={styles.mobileMenuItem}>
              {formatNavLabel(t('nav.signIn'))}
            </button>
          )}
          <LanguageSwitcher compact />
        </div>
      )}
    </>
  );
}

function LanguageSwitcher({ compact = false }) {
  const { language, languages, setLanguage, t } = useI18n();
  const currentLanguage = languages.find((item) => item.code === language) ?? languages[0];

  return (
    <label
      className={compact ? undefined : 'bop-nav-language'}
      style={compact ? styles.mobileLanguageSwitcher : styles.languageSwitcher}
      aria-label={t('common.chooseLanguage')}
      title={`${t('common.chooseLanguage')}: ${currentLanguage.label}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" style={compact ? styles.mobileLanguageGlobe : styles.languageGlobe}>
        <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.9" />
        <path d="M3.8 12h16.4M12 3.5c2.1 2.3 3.2 5.1 3.2 8.5s-1.1 6.2-3.2 8.5M12 3.5C9.9 5.8 8.8 8.6 8.8 12s1.1 6.2 3.2 8.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      </svg>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        style={compact ? styles.mobileLanguageSelect : styles.languageSelect}
        aria-label={t('common.chooseLanguage')}
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.shortLabel}
          </option>
        ))}
      </select>
      <span style={compact ? styles.mobileLanguageCaret : styles.languageCaret} aria-hidden="true">
        ▾
      </span>
    </label>
  );
}

const styles = {
  navContainer: {
    height: NAV_HEIGHT,
    backgroundColor: 'transparent',
    display: 'flex',
    justifyContent: 'center',
    borderBottom: 'none',
    position: 'relative',
    zIndex: 100,
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: 'none',
  },
  // Same box as every other route — only layered over the hero art instead of
  // sitting in flow, so the classroom illustration still runs to the page top.
  navContainerLanding: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  navContainerQuiz: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderBottom: '1px solid rgba(226, 232, 240, 0.95)',
    boxShadow: '0 6px 18px rgba(15,23,42,0.035)',
  },
  navInner: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 5%',
    boxSizing: 'border-box',
    overflow: 'visible',
  },
  logo: {
    position: 'relative',
    flexShrink: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  logoImage: {
    display: 'block',
    width: 'clamp(160px, 14vw, 190px)',
    height: 'auto',
  },
  logoCopyText: {
    position: 'absolute',
    top: '50%',
    left: '27.5%',
    width: '72.5%',
    transform: 'translateY(-50%)',
    color: 'transparent',
    caretColor: 'transparent',
    fontFamily: NAV_FONT,
    fontSize: 'clamp(17px, 1.6vw, 21px)',
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: '0.1px',
    whiteSpace: 'nowrap',
    cursor: 'text',
    userSelect: 'text',
    WebkitUserSelect: 'text',
  },
  tabContainer: {
    display: 'flex',
    gap: '10px',
    height: '100%',
    overflow: 'visible',
    scrollbarWidth: 'none',
    alignItems: 'center',
    padding: '0 8px 0 0',
    boxSizing: 'border-box',
  },
  tabButton: {
    // Explicit backgroundColor + appearance reset: Firefox and Safari otherwise
    // paint their own `buttonface` chrome behind the inactive tabs.
    backgroundColor: 'transparent',
    backgroundImage: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    border: 'none',
    borderRadius: '999px',
    color: INK,
    fontFamily: NAV_FONT,
    fontSize: '16px',
    fontWeight: 900,
    height: '34px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    padding: '6px 16px',
    letterSpacing: '0.1px',
    lineHeight: 1,
    boxShadow: 'none',
  },
  tabButtonActive: {
    backgroundColor: PILL_BG,
    // Slightly firmer ring than PILL_SHADOW so the active pill still separates
    // on the near-white quiz bar.
    boxShadow: '0 7px 16px rgba(23, 31, 56, 0.13), inset 0 0 0 1px rgba(15, 23, 42, 0.11)',
  },
  loginPill: {
    minHeight: '34px',
    padding: '0 18px',
    color: '#ffffff',
    backgroundColor: ACCENT_BLUE,
    border: 'none',
    borderRadius: '999px',
    boxShadow: '0 8px 16px rgba(30, 111, 235, 0.26), inset 0 -2px 0 rgba(0, 40, 110, 0.16)',
    cursor: 'pointer',
    fontFamily: NAV_FONT,
    fontSize: '15px',
    fontWeight: 900,
    whiteSpace: 'nowrap',
  },
  // Laid out as a flex row (globe · select · caret) rather than an absolutely
  // positioned globe over a padded <select>: Firefox and Safari largely ignore
  // padding on a native select, which let the label slide under the globe.
  languageSwitcher: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    position: 'relative',
    height: '34px',
    minWidth: '80px',
    padding: '0 24px 0 12px',
    border: 'none',
    borderRadius: '999px',
    backgroundColor: PILL_BG,
    boxShadow: PILL_SHADOW,
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  languageSelect: {
    height: '100%',
    margin: 0,
    padding: 0,
    border: 'none',
    backgroundColor: 'transparent',
    color: INK,
    cursor: 'pointer',
    fontFamily: NAV_FONT,
    fontSize: '14px',
    fontWeight: 900,
    lineHeight: 1,
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    textAlignLast: 'left',
  },
  languageGlobe: {
    width: '16px',
    height: '16px',
    flexShrink: 0,
    color: INK,
    pointerEvents: 'none',
  },
  languageCaret: {
    position: 'absolute',
    right: '9px',
    top: '50%',
    transform: 'translateY(-54%)',
    color: INK,
    fontFamily: NAV_FONT,
    fontWeight: 900,
    fontSize: '12px',
    pointerEvents: 'none',
  },
  hamburger: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    padding: '4px',
  },
  bar: {
    display: 'block',
    width: '26px',
    height: '3px',
    backgroundColor: INK,
    borderRadius: '2px',
    transition: 'all 0.25s ease',
  },
  mobileMenu: {
    position: 'relative',
    zIndex: 99,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 12px 26px rgba(15, 23, 42, 0.12)',
    borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
  },
  mobileMenuItem: {
    background: 'none',
    border: 'none',
    borderRadius: '999px',
    color: INK,
    fontFamily: NAV_FONT,
    fontSize: '20px',
    fontWeight: 900,
    letterSpacing: '0.2px',
    margin: '6px 8%',
    padding: '12px 16px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  mobileMenuItemActive: {
    backgroundColor: PILL_BG,
    boxShadow: PILL_SHADOW,
  },
  mobileLanguageSwitcher: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    position: 'relative',
    alignSelf: 'flex-start',
    margin: '8px 8% 14px',
    minWidth: '100px',
    height: '42px',
    padding: '0 26px 0 14px',
    border: 'none',
    borderRadius: '999px',
    backgroundColor: PILL_BG,
    boxShadow: PILL_SHADOW,
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  mobileLanguageSelect: {
    height: '100%',
    margin: 0,
    padding: 0,
    border: 'none',
    backgroundColor: 'transparent',
    color: INK,
    cursor: 'pointer',
    fontFamily: NAV_FONT,
    fontSize: '15px',
    fontWeight: 900,
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    textAlignLast: 'left',
  },
  mobileLanguageGlobe: {
    width: '17px',
    height: '17px',
    flexShrink: 0,
    color: INK,
    pointerEvents: 'none',
  },
  mobileLanguageCaret: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-54%)',
    color: INK,
    fontFamily: NAV_FONT,
    fontWeight: 900,
    fontSize: '13px',
    pointerEvents: 'none',
  },
};
