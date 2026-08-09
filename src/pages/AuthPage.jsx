import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { normalizeUsername, sanitizeNextPath, validatePassword, validateUsername } from '../auth/authUtils';
import { getAvatarForSeed } from '../auth/avatarUtils';
import { useI18n } from '../i18n/useI18n';
import './AuthPage.css';

const DEFAULT_FORM = {
  email: '',
  password: '',
  confirmPassword: '',
  displayName: '',
  username: '',
};

async function usernameIsAvailable(username) {
  const { data, error } = await supabase.rpc('is_username_available', { candidate: username });

  if (!error) return Boolean(data);

  const { data: existingProfile, error: lookupError } = await supabase
    .from('profiles_public')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (lookupError) throw lookupError;
  return !existingProfile;
}

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { t } = useI18n();
  const initialMode = searchParams.get('mode');
  const [mode, setMode] = useState(initialMode === 'signup' || initialMode === 'forgot' ? initialMode : 'login');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [status, setStatus] = useState(() => (
    searchParams.get('reset') === 'success'
      ? t('auth.resetSuccess')
      : ''
  ));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = sanitizeNextPath(searchParams.get('next'));
  const cleanUsername = useMemo(() => normalizeUsername(form.username), [form.username]);

  useEffect(() => {
    if (mode === 'forgot') return;
    if (loading || !user) return;

    if (profile?.username) {
      navigate(nextPath, { replace: true });
      return;
    }

    navigate(`/complete-profile?next=${encodeURIComponent(nextPath)}`, { replace: true });
  }, [loading, user, profile, navigate, nextPath, mode]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: field === 'username' ? normalizeUsername(value) : value }));
    setError('');
    setStatus('');
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setStatus('');
  };

  const handleGoogle = async () => {
    setError('');
    setStatus('');
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (googleError) setError(googleError.message);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setIsSubmitting(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      if (loginError) throw loginError;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .maybeSingle();

      navigate(profileData?.username ? nextPath : `/complete-profile?next=${encodeURIComponent(nextPath)}`, { replace: true });
    } catch (loginError) {
      setError(loginError.message || t('auth.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    const email = form.email.trim();
    if (!email) {
      setError(t('auth.forgotEmailRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setStatus(t('auth.resetEmailSent'));
    } catch (resetError) {
      setError(resetError.message || t('auth.resetEmailFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!form.displayName.trim()) {
      setError(t('auth.displayNameRequired'));
      return;
    }

    const usernameError = validateUsername(cleanUsername);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    const passwordError = validatePassword(form.password, {
      email: form.email,
      username: cleanUsername,
      displayName: form.displayName,
    });
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setIsSubmitting(true);

    try {
      const available = await usernameIsAvailable(cleanUsername);
      if (!available) {
        setError(t('auth.usernameTaken'));
        return;
      }

      const { data, error: signupError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            display_name: form.displayName.trim(),
            username: cleanUsername,
          },
        },
      });

      if (signupError) throw signupError;

      if (data.session && data.user) {
        await supabase.from('profiles').upsert({
          // No `email`: clients can't touch profiles.email (column privilege
          // revoked); the handle_new_user trigger fills it server-side.
          id: data.user.id,
          display_name: form.displayName.trim(),
          username: cleanUsername,
          avatar_url: getAvatarForSeed(data.user.id || data.user.email),
        });
        navigate(nextPath, { replace: true });
        return;
      }

      setStatus(t('auth.signupCreated'));
      setMode('login');
      setForm((prev) => ({ ...DEFAULT_FORM, email: prev.email }));
    } catch (signupError) {
      setError(signupError.message || t('auth.signupFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // `forgot` has no headline strings of its own, so it borrows the two it does
  // have: the link label as the title and the "enter your email" line below it.
  const title = mode === 'signup'
    ? t('auth.signupTitle')
    : mode === 'forgot' ? t('auth.forgotPassword') : t('auth.loginTitle');
  const subtitle = mode === 'signup'
    ? t('auth.signupKicker')
    : mode === 'forgot' ? t('auth.forgotEmailRequired') : t('auth.loginKicker');

  return (
    <section className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
        </header>

        <div className="auth-switch">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`auth-switch-button${mode === 'signup' ? '' : ' is-active'}`}
          >
            {t('auth.login')}
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`auth-switch-button${mode === 'signup' ? ' is-active' : ''}`}
          >
            {t('auth.signUp')}
          </button>
        </div>

        {mode !== 'forgot' && (
          <>
            <button type="button" onClick={handleGoogle} className="auth-google">
              <GoogleMark />
              {mode === 'signup' ? t('auth.signUpWithGoogle') : t('auth.continueWithGoogle')}
            </button>

            <div className="auth-divider">{t('auth.orEmail')}</div>
          </>
        )}

        <form
          className="auth-form"
          onSubmit={mode === 'forgot' ? handleForgotPassword : mode === 'login' ? handleLogin : handleSignup}
        >
          {mode === 'signup' && (
            <>
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-display-name">{t('auth.displayName')}</label>
                <input
                  id="auth-display-name"
                  className="auth-input"
                  value={form.displayName}
                  onChange={(event) => updateField('displayName', event.target.value)}
                  placeholder={t('auth.displayNamePlaceholder')}
                  autoComplete="name"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-username">{t('auth.username')}</label>
                <div className="auth-username">
                  <span className="auth-at">@</span>
                  <input
                    id="auth-username"
                    className="auth-input"
                    value={form.username}
                    onChange={(event) => updateField('username', event.target.value)}
                    placeholder={t('auth.usernamePlaceholder')}
                    autoComplete="username"
                  />
                </div>
                <p className="auth-help">{t('auth.usernameHelp')}</p>
              </div>
            </>
          )}

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">{t('auth.email')}</label>
            <input
              id="auth-email"
              className="auth-input"
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-password">{t('auth.password')}</label>
              <input
                id="auth-password"
                className="auth-input"
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
              />
            </div>
          )}

          {mode === 'signup' && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-confirm-password">{t('auth.confirmPassword')}</label>
              <input
                id="auth-confirm-password"
                className="auth-input"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {error && <div className="auth-message is-error" role="alert">{error}</div>}
          {status && <div className="auth-message is-success" role="status">{status}</div>}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? t('auth.working') : mode === 'forgot' ? t('auth.sendReset') : mode === 'login' ? t('auth.login') : t('auth.createAccount')}
          </button>

          {mode === 'login' && (
            <button type="button" onClick={() => switchMode('forgot')} className="auth-text-button">
              {t('auth.forgotPassword')}
            </button>
          )}

          {mode === 'forgot' && (
            <button type="button" onClick={() => switchMode('login')} className="auth-text-button">
              {t('auth.backToLogin')}
            </button>
          )}
        </form>
      </div>
    </section>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.2 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2C29.3 35.1 26.8 36 24 36c-5.4 0-9.9-3.5-11.4-8.3l-6.5 5C9.4 39.3 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.5-.4-3.5z" />
    </svg>
  );
}
