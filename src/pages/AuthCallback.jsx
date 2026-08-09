import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { generateCuteUsernameCandidates, getProfileName, sanitizeNextPath } from '../auth/authUtils';
import { getAvatarForSeed, isEmojiAvatar } from '../auth/avatarUtils';
import { useAuth } from '../auth/useAuth';
import { useI18n } from '../i18n/useI18n';
import { supabase } from '../supabaseClient';

const BUBBLY_FONT = '"Lilita One", cursive';
const MODERN_FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

async function usernameIsAvailable(username) {
  const { data, error } = await supabase
    .from('profiles_public')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return !data;
}

function getGoogleName(user, profile) {
  return getProfileName(
    profile,
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Teacher'
  );
}

async function createGoogleProfileDefaults(user, profile, usernameFailedMessage) {
  const displayName = getGoogleName(user, profile);
  const seed = displayName || user.email;
  const candidates = generateCuteUsernameCandidates(seed);

  for (const candidate of candidates) {
    if (await usernameIsAvailable(candidate)) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          // No `email`: clients can't touch profiles.email (column privilege
          // revoked); the handle_new_user trigger fills it server-side.
          id: user.id,
          display_name: displayName,
          username: candidate,
          avatar_url: isEmojiAvatar(profile?.avatar_url) ? profile.avatar_url : getAvatarForSeed(user.id || user.email),
        });

      if (error) throw error;
      return candidate;
    }
  }

  throw new Error(usernameFailedMessage);
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading, refreshProfile } = useAuth();
  const { t } = useI18n();
  const [error, setError] = useState('');
  const didRunRef = useRef(false);
  const nextPath = sanitizeNextPath(searchParams.get('next'));

  useEffect(() => {
    if (loading || didRunRef.current) return;

    if (!user) {
      navigate(`/auth?mode=login&next=${encodeURIComponent(nextPath)}`, { replace: true });
      return;
    }

    if (profile?.username) {
      navigate(nextPath, { replace: true });
      return;
    }

    didRunRef.current = true;

    const finishGoogleProfile = async () => {
      try {
        await createGoogleProfileDefaults(user, profile, t('authCallback.usernameFailed'));
        await refreshProfile();
        navigate(nextPath, { replace: true });
      } catch (profileError) {
        console.error('Google profile setup failed:', profileError.message);
        setError(profileError.message || t('authCallback.setupFailed'));
      }
    };

    finishGoogleProfile();
  }, [loading, user, profile, refreshProfile, navigate, nextPath, t]);

  if (!loading && !user) {
    return <Navigate to={`/auth?mode=login&next=${encodeURIComponent(nextPath)}`} replace />;
  }

  return (
    <section style={styles.pageShell}>
      <div style={styles.card}>
        <p style={styles.kicker}>{t('authCallback.kicker')}</p>
        <h1 style={styles.title}>{t('authCallback.title')}</h1>
        <p style={styles.text}>{t('authCallback.text')}</p>

        {error && (
          <>
            <div style={styles.errorBox}>{error}</div>
            <button
              type="button"
              onClick={() => navigate(`/complete-profile?next=${encodeURIComponent(nextPath)}`, { replace: true })}
              style={styles.button}
            >
              {t('authCallback.finishManually')}
            </button>
          </>
        )}
      </div>
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
  card: {
    width: 'min(580px, 100%)',
    background: '#FFFDE7',
    border: '4px solid #111',
    borderRadius: '26px',
    padding: '28px',
    boxSizing: 'border-box',
    boxShadow: '7px 7px 0 #E8D000, 0 18px 38px rgba(15,23,42,0.16)',
    textAlign: 'center',
  },
  kicker: {
    margin: 0,
    fontFamily: BUBBLY_FONT,
    color: '#0F766E',
    fontSize: '20px',
    textTransform: 'uppercase',
  },
  title: {
    margin: '10px 0',
    fontFamily: BUBBLY_FONT,
    color: '#111827',
    fontSize: '42px',
    lineHeight: 0.95,
  },
  text: {
    margin: 0,
    color: '#4B5563',
    fontWeight: 850,
    lineHeight: 1.45,
  },
  errorBox: {
    marginTop: '18px',
    padding: '10px 12px',
    borderRadius: '12px',
    background: '#FEE2E2',
    border: '2px solid #991B1B',
    color: '#991B1B',
    fontWeight: 900,
  },
  button: {
    marginTop: '16px',
    minHeight: '48px',
    border: '3px solid #111',
    borderRadius: '14px',
    background: '#FFEB00',
    color: '#111',
    fontFamily: BUBBLY_FONT,
    fontSize: '20px',
    cursor: 'pointer',
    boxShadow: '4px 4px 0 #111',
    padding: '0 20px',
  },
};
