import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { getProfileName } from '../auth/authUtils';
import { getAvatarForSeed, getEmojiFromAvatar, isEmojiAvatar } from '../auth/avatarUtils';
import MenuHeading from '../components/MenuHeading';
import { useI18n } from '../i18n/useI18n';
import { supabase } from '../supabaseClient';
import './Profile.css';

const TYPE_CONFIG = {
  gtp: {
    labelKey: 'dashboard.games.gtp.title',
    accent: '#f5b400',
    softAccent: '#fff4c7',
    fallbackThumb: '/thumbnails/guess_the_price.jpg',
  },
  quiz: {
    labelKey: 'dashboard.games.quiz.title',
    accent: '#2f80ed',
    softAccent: '#dbeafe',
    fallbackThumb: '/thumbnails/quiz_bop.jpg',
  },
  pictionary: {
    labelKey: 'dashboard.games.pictionary.title',
    accent: '#7c3aed',
    softAccent: '#ede9fe',
    fallbackThumb: '/thumbnails/pictionary.jpg',
  },
};

function groupItemRows(rows) {
  const groups = new Map();
  for (const row of rows || []) {
    const group = groups.get(row.match_number) || {
      matchNumber: row.match_number,
      title: row.title,
      isPublic: row.is_public !== false,
      thumbnail: '',
      createdAt: row.created_at,
      count: 0,
    };
    group.count += 1;
    group.thumbnail = group.thumbnail || row.thumbnail || '';
    groups.set(row.match_number, group);
  }
  return [...groups.values()];
}

async function fetchGtpCreations(userId) {
  const { data, error } = await supabase
    .from('game_matches')
    .select('id, title, thumbnail_url, created_at, is_public')
    .eq('author_id', userId)
    .eq('format_id', 'GUESS_THE_PRICE')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((deck) => ({
    key: `gtp-${deck.id}`,
    type: 'gtp',
    title: deck.title,
    thumbnail: deck.thumbnail_url || '',
    isPublic: deck.is_public !== false,
    createdAt: deck.created_at,
    count: null,
    route: `/gtp-play/${deck.id}`,
  }));
}

async function fetchQuizCreations(userId) {
  const { data, error } = await supabase
    .from('quiz_items')
    .select('match_number, title, created_at, is_public, thumbnail')
    .eq('author_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return groupItemRows(data).map((group) => ({
    key: `quiz-${group.matchNumber}`,
    type: 'quiz',
    title: group.title,
    thumbnail: group.thumbnail,
    isPublic: group.isPublic,
    createdAt: group.createdAt,
    count: group.count,
    route: `/quiz/custom-${group.matchNumber}`,
  }));
}

async function fetchPictionaryCreations(userId) {
  const { data, error } = await supabase
    .from('pictionary_items')
    .select('match_number, title, created_at, is_public, thumbnail')
    .eq('author_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return groupItemRows(data).map((group) => ({
    key: `pictionary-${group.matchNumber}`,
    type: 'pictionary',
    title: group.title,
    thumbnail: group.thumbnail,
    isPublic: group.isPublic,
    createdAt: group.createdAt,
    count: group.count,
    route: `/pictionary/custom-${group.matchNumber}`,
  }));
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { t, language } = useI18n();
  const [creations, setCreations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const profileName = getProfileName(profile, user?.email || t('common.teacher'));
  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const savedAvatar = profile?.avatar_url && profile.avatar_url !== googleAvatar ? profile.avatar_url : '';
  const avatarValue = savedAvatar || getAvatarForSeed(user?.id || user?.email);
  const avatarEmoji = getEmojiFromAvatar(avatarValue);
  const joinedAt = profile?.created_at || user?.created_at;

  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const joinedLabel = joinedAt
    ? new Date(joinedAt).toLocaleDateString(locale, { year: 'numeric', month: 'long' })
    : '';

  useEffect(() => {
    if (!user) return;
    let isActive = true;

    const fetchCreations = async () => {
      setIsLoading(true);
      const results = await Promise.allSettled([
        fetchGtpCreations(user.id),
        fetchQuizCreations(user.id),
        fetchPictionaryCreations(user.id),
      ]);

      if (!isActive) return;

      const loaded = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          loaded.push(...result.value);
        } else {
          console.error('Failed to load creations:', result.reason?.message || result.reason);
        }
      }

      loaded.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCreations(loaded);
      setIsLoading(false);
    };

    fetchCreations();
    return () => { isActive = false; };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/games', { replace: true });
  };

  const counts = useMemo(() => {
    const byType = { all: creations.length, gtp: 0, quiz: 0, pictionary: 0 };
    for (const creation of creations) byType[creation.type] += 1;
    return byType;
  }, [creations]);

  const publicCount = useMemo(
    () => creations.filter((creation) => creation.isPublic).length,
    [creations],
  );

  const visibleCreations = activeTab === 'all'
    ? creations
    : creations.filter((creation) => creation.type === activeTab);

  const tabs = [
    { id: 'all', label: t('profile.allTab') },
    { id: 'gtp', label: t(TYPE_CONFIG.gtp.labelKey) },
    { id: 'quiz', label: t(TYPE_CONFIG.quiz.labelKey) },
    { id: 'pictionary', label: t(TYPE_CONFIG.pictionary.labelKey) },
  ];

  return (
    <section className="profile-page" aria-labelledby="profile-title">
      <MenuHeading id="profile-title" title={t('profile.pageTitle')} />

      <article className="profile-hero-card">
        <div className="profile-hero-banner" aria-hidden="true">
          <span className="profile-banner-orb profile-banner-orb-one" />
          <span className="profile-banner-orb profile-banner-orb-two" />
          <span className="profile-banner-spark">✦</span>
        </div>

        <div className="profile-hero-body">
          <div className="profile-identity">
            <div className="profile-avatar-ring">
              <div className="profile-avatar">
                {isEmojiAvatar(avatarValue) ? (
                  <span className="profile-avatar-emoji">{avatarEmoji}</span>
                ) : avatarValue ? (
                  <img src={avatarValue} alt="" className="profile-avatar-image" />
                ) : (
                  <MelonAvatar />
                )}
              </div>
            </div>

            <div className="profile-identity-copy">
              <h2>{profileName}</h2>
              <div className="profile-identity-meta">
                {profile?.username && <span className="profile-username">@{profile.username}</span>}
                {joinedLabel && (
                  <span className="profile-joined">
                    <CalendarIcon />
                    {t('profile.joined', { date: joinedLabel })}
                  </span>
                )}
              </div>
            </div>

            <div className="profile-actions">
              <button
                className="profile-button profile-button-primary"
                type="button"
                onClick={() => navigate('/complete-profile?edit=1&next=/profile')}
              >
                <EditIcon />
                {t('profile.editProfile')}
              </button>
              <button className="profile-button profile-button-secondary" type="button" onClick={handleSignOut}>
                <LogoutIcon />
                {t('profile.logout')}
              </button>
            </div>
          </div>

          <div className="profile-stats" aria-label={t('profile.creations')}>
            <Stat value={isLoading ? '—' : counts.all} label={t('profile.creations')} tone="purple" />
            <Stat value={isLoading ? '—' : publicCount} label={t('common.public')} tone="mint" />
            <Stat value={isLoading ? '—' : counts.all - publicCount} label={t('common.private')} tone="yellow" />
          </div>
        </div>
      </article>

      <section className="profile-creations" aria-labelledby="profile-creations-title">
        <div className="profile-section-heading">
          <div>
            <p>{t('profile.savedWork')}</p>
            <h2 id="profile-creations-title">{t('profile.recentCreations')}</h2>
          </div>
          <span className="profile-section-doodle" aria-hidden="true">✦</span>
        </div>

        <div className="profile-tabs" role="tablist" aria-label={t('profile.recentCreations')}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`profile-tab${isActive ? ' is-active' : ''}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span>{isLoading ? '·' : counts[tab.id]}</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="profile-deck-grid">
            {[0, 1, 2].map((index) => <SkeletonCard key={index} />)}
          </div>
        ) : visibleCreations.length === 0 ? (
          <EmptyState
            message={t('profile.emptyCreations')}
            actionLabel={t('profile.createNew')}
            onAction={() => navigate('/games')}
          />
        ) : (
          <div className="profile-deck-grid">
            {visibleCreations.map((creation) => (
              <CreationCard
                key={creation.key}
                creation={creation}
                locale={locale}
                t={t}
                onOpen={() => navigate(creation.route)}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function Stat({ value, label, tone }) {
  return (
    <div className={`profile-stat profile-stat-${tone}`}>
      <span className="profile-stat-value">{value}</span>
      <span className="profile-stat-label">{label}</span>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h18M8 3v4M16 3v4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m14.7 5.3 4 4M4 20l4.2-.9L19 8.3a2.1 2.1 0 0 0-3-3L5.2 16.1 4 20Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CreationCard({ creation, locale, t, onOpen }) {
  const config = TYPE_CONFIG[creation.type];
  const thumbnail = creation.thumbnail || config.fallbackThumb;
  const dateLabel = creation.createdAt
    ? new Date(creation.createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="profile-deck-card"
      style={{ '--profile-card-accent': config.accent, '--profile-card-soft': config.softAccent }}
    >
      <div className="profile-deck-thumb-wrap">
        <img src={thumbnail} alt="" className="profile-deck-thumb" />
        <span className="profile-type-pill">{t(config.labelKey)}</span>
        <span className={`profile-visibility-pill${creation.isPublic ? '' : ' is-private'}`}>
          {creation.isPublic ? t('common.public') : t('common.private')}
        </span>
      </div>
      <div className="profile-deck-body">
        <div className="profile-deck-title">{creation.title}</div>
        <div className="profile-deck-meta">
          {creation.count != null && (
            <>
              <span>{t('gtp.deckCard.items', { count: creation.count })}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>{dateLabel}</span>
        </div>
        <span className="profile-deck-arrow" aria-hidden="true">→</span>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="profile-skeleton-card" aria-hidden="true">
      <div className="profile-skeleton-thumb" />
      <div className="profile-skeleton-body">
        <div className="profile-skeleton-line is-title" />
        <div className="profile-skeleton-line is-meta" />
      </div>
    </div>
  );
}

function EmptyState({ message, actionLabel, onAction }) {
  return (
    <button type="button" onClick={onAction} className="profile-empty-state">
      <span className="profile-empty-icon" aria-hidden="true">+</span>
      <strong>{actionLabel}</strong>
      <span>{message}</span>
    </button>
  );
}

function MelonAvatar() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="profile-avatar-icon">
      <path d="M7 28c12 24 37 31 51 7L51 12Z" fill="#39B8A8" stroke="#111827" strokeWidth="5" strokeLinejoin="round" />
      <path d="M14 29c10 17 30 22 43 6L50 14Z" fill="#FFC83D" stroke="#111827" strokeWidth="4" strokeLinejoin="round" />
      <path d="M22 28c7 10 19 12 28 2" fill="none" stroke="#FFA927" strokeWidth="4" strokeLinecap="round" />
      <circle cx="34" cy="29" r="2.4" fill="#111827" />
      <circle cx="42" cy="25" r="2.4" fill="#111827" />
      <circle cx="43" cy="33" r="2.4" fill="#111827" />
    </svg>
  );
}
