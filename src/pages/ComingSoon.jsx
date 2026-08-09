import { useI18n } from '../i18n/useI18n';

const MODERN_FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const TITLE_FONT = '"Lilita One", "Arial Black", Impact, sans-serif';

export default function ComingSoon({ label }) {
  const { t } = useI18n();

  return (
    <section style={styles.page} aria-label={`${label} coming soon`}>
      <p style={styles.label}>{label}</p>
      <h1 style={styles.title}>{t('comingSoon.title')}</h1>
    </section>
  );
}

const styles = {
  page: {
    width: '100%',
    minHeight: 'calc(100vh - 62px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px 96px',
    boxSizing: 'border-box',
    fontFamily: MODERN_FONT,
    textAlign: 'center',
  },
  label: {
    margin: '0 0 10px',
    color: '#111827',
    fontSize: '18px',
    fontWeight: 900,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  title: {
    margin: 0,
    color: '#FFEB00',
    fontFamily: TITLE_FONT,
    fontSize: '64px',
    lineHeight: 0.9,
    letterSpacing: '2px',
    maxWidth: '720px',
    textShadow: '5px 5px 0 #111, -2px -2px 0 #111, 2px -2px 0 #111, -2px 2px 0 #111, 8px 8px 18px rgba(0,0,0,0.35)',
  },
};
