import { useEffect, useRef, useState } from 'react';

const MODERN_FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function SearchGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: '20px', height: '20px', display: 'block' }}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

function ClearGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      aria-hidden="true"
      style={{ width: '15px', height: '15px', display: 'block' }}
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * A clean, modern search field for game menus.
 * Self-contained (inline styles) so it drops into any menu without CSS coupling.
 *
 * Props:
 *  - value, onChange(value): controlled input
 *  - placeholder: input placeholder
 *  - resultCount: optional number; when the query is non-empty, shows "N results"
 *  - maxWidth: container max width (default 520px)
 *  - shortcut: enable "/" to focus (default true)
 */
export default function GameSearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  resultCount = null,
  maxWidth = 520,
  shortcut = true,
}) {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(value);

  useEffect(() => {
    if (!shortcut) return undefined;
    const handler = (event) => {
      if (event.key !== '/') return;
      const active = document.activeElement;
      const typing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (typing) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcut]);

  const showCount = hasValue && typeof resultCount === 'number';

  return (
    <div style={{ ...styles.container, maxWidth }}>
      <div
        style={{
          ...styles.field,
          boxShadow: isFocused
            ? '0 0 0 4px rgba(255,213,0,0.35), 0 8px 24px rgba(15,23,42,0.14)'
            : styles.field.boxShadow,
          background: isFocused ? '#FFFFFF' : styles.field.background,
        }}
        onClick={() => inputRef.current?.focus()}
      >
        <span style={{ ...styles.icon, color: isFocused ? '#F59E0B' : '#94A3B8' }}>
          <SearchGlyph />
        </span>

        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && hasValue) {
              event.preventDefault();
              onChange('');
            }
          }}
          style={styles.input}
          aria-label={placeholder}
        />

        {hasValue ? (
          <button
            type="button"
            aria-label="Clear search"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            style={styles.clearButton}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = '#E2E8F0';
              event.currentTarget.style.color = '#0F172A';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = '#F1F5F9';
              event.currentTarget.style.color = '#64748B';
            }}
          >
            <ClearGlyph />
          </button>
        ) : (
          shortcut && (
            <span style={styles.kbd} aria-hidden="true">/</span>
          )
        )}
      </div>

      {showCount && (
        <div style={styles.count}>
          {resultCount === 0
            ? 'No matches'
            : `${resultCount} ${resultCount === 1 ? 'result' : 'results'}`}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    margin: '0 auto 24px',
    boxSizing: 'border-box',
  },
  field: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 14px 0 18px',
    height: '54px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    boxShadow: '0 2px 4px rgba(15,23,42,0.04), 0 10px 26px rgba(15,23,42,0.10)',
    cursor: 'text',
    transition: 'box-shadow 0.2s ease, background 0.2s ease',
  },
  icon: {
    flexShrink: 0,
    display: 'flex',
    transition: 'color 0.2s ease',
  },
  input: {
    flex: 1,
    minWidth: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontFamily: MODERN_FONT,
    fontSize: '16px',
    fontWeight: 500,
    color: '#0F172A',
    padding: 0,
  },
  clearButton: {
    flexShrink: 0,
    width: '28px',
    height: '28px',
    display: 'grid',
    placeItems: 'center',
    padding: 0,
    border: 'none',
    borderRadius: '50%',
    background: '#F1F5F9',
    color: '#64748B',
    cursor: 'pointer',
    transition: 'background 0.14s, color 0.14s',
  },
  kbd: {
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    minWidth: '24px',
    height: '24px',
    padding: '0 6px',
    borderRadius: '7px',
    background: '#F1F5F9',
    color: '#94A3B8',
    fontFamily: MODERN_FONT,
    fontSize: '13px',
    fontWeight: 700,
    lineHeight: 1,
  },
  count: {
    margin: '10px 4px 0',
    fontFamily: MODERN_FONT,
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748B',
  },
};
