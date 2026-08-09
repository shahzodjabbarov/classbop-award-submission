import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validatePassword } from '../auth/authUtils';
import { useAuth } from '../auth/useAuth';
import { useI18n } from '../i18n/useI18n';
import { supabase } from '../supabaseClient';

const BUBBLY_FONT = '"Lilita One", cursive';
const MODERN_FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    const passwordError = validatePassword(password, {
      email: user?.email,
      displayName: user?.user_metadata?.display_name || user?.user_metadata?.full_name,
    });
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('resetPassword.mismatch'));
      return;
    }

    setIsSaving(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setStatus(t('resetPassword.success'));
      setPassword('');
      setConfirmPassword('');
    } catch (updateError) {
      setError(updateError.message || t('resetPassword.failed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>{t('resetPassword.loading')}</div>;
  }

  if (!user) {
    return (
      <section style={styles.pageShell}>
        <div style={styles.card}>
          <p style={styles.kicker}>{t('resetPassword.kicker')}</p>
          <h1 style={styles.title}>{t('resetPassword.linkNeeded')}</h1>
          <p style={styles.text}>{t('resetPassword.linkNeededText')}</p>
          <button type="button" onClick={() => navigate('/auth?mode=forgot')} style={styles.submitButton}>
            {t('resetPassword.requestLink')}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.pageShell}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <p style={styles.kicker}>{t('resetPassword.kicker')}</p>
        <h1 style={styles.title}>{t('resetPassword.title')}</h1>
        <p style={styles.text}>{t('resetPassword.text')}</p>

        <label style={styles.label}>{t('resetPassword.newPassword')}</label>
        <input
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError('');
            setStatus('');
          }}
          placeholder={t('auth.passwordPlaceholder')}
          required
          style={styles.input}
        />

        <label style={styles.label}>{t('resetPassword.confirmPassword')}</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setError('');
            setStatus('');
          }}
          placeholder={t('auth.confirmPasswordPlaceholder')}
          required
          style={styles.input}
        />

        {error && <div style={styles.errorBox}>{error}</div>}
        {status && <div style={styles.successBox}>{status}</div>}

        <button type="submit" disabled={isSaving} style={{ ...styles.submitButton, opacity: isSaving ? 0.65 : 1 }}>
          {isSaving ? t('common.saving') : t('resetPassword.updatePassword')}
        </button>

        {status && (
          <button type="button" onClick={() => navigate('/games', { replace: true })} style={styles.textButton}>
            {t('resetPassword.goToGames')}
          </button>
        )}
      </form>
    </section>
  );
}

const styles = {
  pageShell: {
    width: '100%',
    minHeight: 'calc(100vh - 62px)',
    padding: '54px 20px',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    fontFamily: MODERN_FONT,
  },
  loading: {
    marginTop: '100px',
    fontFamily: BUBBLY_FONT,
    fontSize: '28px',
    color: '#111',
    textAlign: 'center',
  },
  card: {
    width: 'min(560px, 100%)',
    background: '#FFFDE7',
    border: '4px solid #111',
    borderRadius: '26px',
    padding: '28px',
    boxSizing: 'border-box',
    boxShadow: '7px 7px 0 #E8D000, 0 18px 38px rgba(15,23,42,0.16)',
  },
  kicker: {
    margin: 0,
    fontFamily: BUBBLY_FONT,
    color: '#0F766E',
    fontSize: '20px',
    textTransform: 'uppercase',
  },
  title: {
    margin: '8px 0 8px',
    fontFamily: BUBBLY_FONT,
    color: '#111827',
    fontSize: '42px',
    lineHeight: 0.95,
  },
  text: {
    margin: '0 0 20px',
    color: '#4B5563',
    fontWeight: 850,
    lineHeight: 1.45,
  },
  label: {
    display: 'block',
    marginTop: '12px',
    marginBottom: '6px',
    fontSize: '12px',
    fontWeight: 950,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  },
  input: {
    width: '100%',
    minHeight: '48px',
    border: '2px solid #111',
    borderRadius: '12px',
    padding: '10px 12px',
    fontSize: '16px',
    fontWeight: 850,
    color: '#111827',
    boxSizing: 'border-box',
    outline: 'none',
    background: '#fff',
  },
  errorBox: {
    marginTop: '14px',
    padding: '10px 12px',
    borderRadius: '12px',
    background: '#FEE2E2',
    border: '2px solid #991B1B',
    color: '#991B1B',
    fontWeight: 900,
  },
  successBox: {
    marginTop: '14px',
    padding: '10px 12px',
    borderRadius: '12px',
    background: '#DCFCE7',
    border: '2px solid #166534',
    color: '#166534',
    fontWeight: 900,
  },
  submitButton: {
    marginTop: '18px',
    width: '100%',
    minHeight: '54px',
    border: '3px solid #111',
    borderRadius: '14px',
    background: '#FFEB00',
    color: '#111',
    fontFamily: BUBBLY_FONT,
    fontSize: '22px',
    cursor: 'pointer',
    boxShadow: '4px 4px 0 #111',
  },
  textButton: {
    width: '100%',
    marginTop: '12px',
    border: 'none',
    background: 'transparent',
    color: '#0F766E',
    fontFamily: BUBBLY_FONT,
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 0',
  },
};
