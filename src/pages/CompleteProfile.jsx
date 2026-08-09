import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { generateCuteUsernameCandidates, normalizeUsername, sanitizeNextPath, validateUsername } from '../auth/authUtils';
import { AVATAR_EMOJIS, getAvatarForSeed, getEmojiFromAvatar, isEmojiAvatar, makeEmojiAvatar } from '../auth/avatarUtils';
import MenuHeading from '../components/MenuHeading';
import { useI18n } from '../i18n/useI18n';
import { supabase } from '../supabaseClient';
import './CompleteProfile.css';

const MAX_AVATAR_IMAGE_BYTES = 750 * 1024;

async function usernameIsAvailable(username, currentUserId) {
  const { data, error } = await supabase
    .from('profiles_public')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return !data || data.id === currentUserId;
}

function getInitialDisplayName(user, profile) {
  return profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.display_name || '';
}

function getInitialUsername(user, profile) {
  if (profile?.username) return profile.username;

  const seed = getInitialDisplayName(user, profile) || user?.email || '';
  return generateCuteUsernameCandidates(seed)[0] || '';
}

function getInitialAvatar(user, profile) {
  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  if (profile?.avatar_url && profile.avatar_url !== googleAvatar) return profile.avatar_url;
  return getAvatarForSeed(user?.id || user?.email);
}

export default function CompleteProfile() {
  const [searchParams] = useSearchParams();
  const { user, profile, loading, refreshProfile } = useAuth();
  const { t } = useI18n();
  const nextPath = sanitizeNextPath(searchParams.get('next'));
  const isEditMode = searchParams.get('edit') === '1';

  if (loading) {
    return <div className="complete-profile-loading">{t('profile.loading')}</div>;
  }

  if (!user) {
    return <Navigate to={`/auth?mode=login&next=${encodeURIComponent(nextPath)}`} replace />;
  }

  if (profile?.username && !isEditMode) {
    return <Navigate to={nextPath} replace />;
  }

  return (
    <CompleteProfileForm
      key={`${user.id}-${profile?.username || 'new'}-${isEditMode ? 'edit' : 'setup'}`}
      user={user}
      profile={profile}
      nextPath={nextPath}
      refreshProfile={refreshProfile}
      isEditMode={isEditMode}
    />
  );
}

function CompleteProfileForm({ user, profile, nextPath, refreshProfile, isEditMode }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [displayName, setDisplayName] = useState(() => getInitialDisplayName(user, profile));
  const [username, setUsername] = useState(() => getInitialUsername(user, profile));
  const [avatarMode, setAvatarMode] = useState(() => (isEmojiAvatar(getInitialAvatar(user, profile)) ? 'emoji' : 'image'));
  const [selectedEmoji, setSelectedEmoji] = useState(() => getEmojiFromAvatar(getInitialAvatar(user, profile)) || AVATAR_EMOJIS[0]);
  const [imageUrl, setImageUrl] = useState(() => (isEmojiAvatar(getInitialAvatar(user, profile)) ? '' : getInitialAvatar(user, profile)));
  const [imageFileName, setImageFileName] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const cleanUsername = useMemo(() => normalizeUsername(username), [username]);
  const previewAvatar = avatarMode === 'image' && imageUrl.trim() ? imageUrl.trim() : makeEmojiAvatar(selectedEmoji);

  const suggestUsername = () => {
    const seed = displayName || user.email || '';
    const [candidate] = generateCuteUsernameCandidates(seed);
    if (candidate) setUsername(candidate);
    setError('');
  };

  const handleCancel = () => {
    navigate(nextPath || '/profile', { replace: true });
  };

  const handleImageUpload = (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    setError('');

    if (!file.type.startsWith('image/')) {
      setError(t('profile.imageFile'));
      event.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_IMAGE_BYTES) {
      setError(t('profile.imageTooLarge'));
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(String(reader.result || ''));
      setImageFileName(file.name);
      setAvatarMode('image');
    };
    reader.onerror = () => {
      setError(t('profile.imageReadFailed'));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError(t('profile.displayNameRequired'));
      return;
    }

    const usernameError = validateUsername(cleanUsername);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    setIsSaving(true);

    try {
      const available = await usernameIsAvailable(cleanUsername, user.id);
      if (!available) {
        setError(t('profile.usernameTaken'));
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          // No `email` here: the client has no SELECT grant on profiles.email
          // (see supabase/profiles_email_privacy_fix.sql), and upserts need
          // SELECT on every column they touch. The DB trigger fills email.
          id: user.id,
          display_name: displayName.trim(),
          username: cleanUsername,
          avatar_url: previewAvatar,
        });

      if (updateError) throw updateError;

      await refreshProfile();
      navigate(nextPath, { replace: true });
    } catch (saveError) {
      setError(saveError.message || t('profile.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const pageHeading = isEditMode ? t('profile.profileSettings') : t('profile.almostThere');

  return (
    <section className="complete-profile-page" aria-labelledby="complete-profile-title">
      <MenuHeading id="complete-profile-title" title={pageHeading} />

      <form onSubmit={handleSubmit} className="complete-profile-card">
        <div className="complete-profile-card-banner" aria-hidden="true">
          <span className="complete-profile-banner-orb complete-profile-banner-orb-one" />
          <span className="complete-profile-banner-orb complete-profile-banner-orb-two" />
          <span className="complete-profile-banner-spark">✦</span>
        </div>

        <div className="complete-profile-card-body">
          <header className="complete-profile-intro">
            <p>{isEditMode ? t('profile.profileSettings') : t('profile.almostThere')}</p>
            <h2>{isEditMode ? t('profile.editTitle') : t('profile.finishTitle')}</h2>
            <span>
              {isEditMode
                ? t('profile.editSubtitle')
                : t('profile.finishSubtitle')}
            </span>
          </header>

          <div className="complete-profile-form-layout">
            <div className="complete-profile-fields">
              {isEditMode && user?.email && (
                <div className="complete-profile-field-group">
                  <label>{t('profile.email')}</label>
                  <div className="complete-profile-readonly-field">
                    <span>{user.email}</span>
                    <strong>
                      <LockIcon />
                      {t('profile.emailLocked')}
                    </strong>
                  </div>
                </div>
              )}

              <div className="complete-profile-field-group">
                <label htmlFor="profile-display-name">{t('profile.displayName')}</label>
                <input
                  id="profile-display-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder={t('profile.displayNamePlaceholder')}
                />
              </div>

              <div className="complete-profile-field-group">
                <div className="complete-profile-label-row">
                  <label htmlFor="profile-username">{t('profile.username')}</label>
                  {!profile?.username && (
                    <button type="button" onClick={suggestUsername} className="complete-profile-suggest-button">
                      <SparkIcon />
                      {t('profile.suggest')}
                    </button>
                  )}
                </div>
                <div className="complete-profile-username-wrap">
                  <span aria-hidden="true">@</span>
                  <input
                    id="profile-username"
                    value={username}
                    onChange={(event) => setUsername(normalizeUsername(event.target.value))}
                    placeholder={t('profile.usernamePlaceholder')}
                  />
                </div>
                <p className="complete-profile-helper">{t('profile.usernameHelp')}</p>
              </div>
            </div>

            <fieldset className="complete-profile-avatar-editor">
              <legend>{t('profile.sticker')}</legend>
              <div className="complete-profile-avatar-top">
                <div className="complete-profile-avatar-preview">
                  {avatarMode === 'image' && imageUrl.trim() ? (
                    <img src={imageUrl.trim()} alt="" />
                  ) : (
                    <span>{selectedEmoji}</span>
                  )}
                </div>

                <div className="complete-profile-avatar-modes">
                  <button
                    type="button"
                    onClick={() => setAvatarMode('emoji')}
                    className={avatarMode === 'emoji' ? 'is-active' : ''}
                    aria-pressed={avatarMode === 'emoji'}
                  >
                    {t('profile.emoji')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode('image')}
                    className={avatarMode === 'image' ? 'is-active' : ''}
                    aria-pressed={avatarMode === 'image'}
                  >
                    {t('profile.picture')}
                  </button>
                </div>
              </div>

              {avatarMode === 'emoji' ? (
                <div className="complete-profile-emoji-grid">
                  {AVATAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={t('profile.chooseAvatar', { emoji })}
                      aria-pressed={selectedEmoji === emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={selectedEmoji === emoji ? 'is-active' : ''}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="complete-profile-upload-panel">
                  <label htmlFor="avatar-upload">
                    <UploadIcon />
                    {t('profile.uploadPicture')}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <p>
                    {imageFileName || (imageUrl ? t('profile.pictureSelected') : t('profile.pictureHelp'))}
                  </p>
                </div>
              )}
            </fieldset>
          </div>

          {error && <div className="complete-profile-error" role="alert">{error}</div>}

          <div className="complete-profile-actions">
            {isEditMode && (
              <button type="button" onClick={handleCancel} disabled={isSaving} className="complete-profile-cancel">
                {t('profile.cancel')}
              </button>
            )}
            <button type="submit" disabled={isSaving} className="complete-profile-submit">
              <CheckIcon />
              {isSaving ? t('profile.saving') : t('profile.saveProfile')}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" fill="currentColor" />
      <path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z" fill="currentColor" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12.5 4.2 4L19 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
