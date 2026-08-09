import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import ClassBopLoader from '../components/ClassBopLoader';
import GameMenuToolbar from '../components/GameMenuToolbar';
import MasonryDeckGrid from '../components/MasonryDeckGrid';
import { matchesSearch } from '../components/gameSearch';
import GtpDeckCard from '../games/guessThePrice/GtpDeckCard';
import { useI18n } from '../i18n/useI18n';
import { supabase } from '../supabaseClient';
import './GtpMenu.css';

// =========================================================================
const BUBBLY_FONT = '"Lilita One", cursive';
const GTP_FAVORITES_STORAGE_KEY = 'classbop:gtp-favorites';
// =========================================================================

const menuMatchesCache = new Map();

const CURRENCY_LABELS = {
  KRW: { flag: '🇰🇷', name: 'KRW' },
  UZS: { flag: '🇺🇿', name: 'UZS' },
  USD: { flag: '🇺🇸', name: 'USD' },
  JPY: { flag: '🇯🇵', name: 'JPY' },
  EUR: { flag: '🇪🇺', name: 'EUR' },
  GBP: { flag: '🇬🇧', name: 'GBP' },
  PHP: { flag: '🇵🇭', name: 'PHP' },
  VND: { flag: '🇻🇳', name: 'VND' },
};

function getCurrencyInfo(payload) {
  const currency = payload?.currency || 'KRW';
  const fallback = CURRENCY_LABELS[currency] || { flag: '🌍', name: currency };

  return {
    ...fallback,
    symbol: payload?.currency_symbol || '',
  };
}

function useColumns() {
  const getColumns = () => {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 920) return 2;
    if (window.innerWidth <= 1180) return 3;
    return 5;
  };
  const [columns, setColumns] = useState(getColumns);

  useEffect(() => {
    const handler = () => setColumns(getColumns());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return columns;
}

function getStoredGtpFavorites() {
  try {
    const stored = window.localStorage.getItem(GTP_FAVORITES_STORAGE_KEY);
    const parsed = JSON.parse(stored || '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

export default function GtpMenu() {
  const columns = useColumns();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, t } = useI18n();
  const cachedMatches = menuMatchesCache.get(language);

  const [matchesState, setMatchesState] = useState(() => ({
    language,
    matches: cachedMatches || [],
    isLoading: !cachedMatches,
  }));
  const [searchTerm, setSearchTerm] = useState('');
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(getStoredGtpFavorites);

  const matches = matchesState.language === language
    ? matchesState.matches
    : cachedMatches || [];
  const isLoading = matchesState.language === language
    ? matchesState.isLoading
    : !cachedMatches;

  useEffect(() => {
    if (menuMatchesCache.has(language)) return undefined;

    let isMounted = true;

    const fetchMatches = async () => {
      setMatchesState({
        language,
        matches: [],
        isLoading: true,
      });

      try {
        const { data, error } = await supabase
          .from('game_matches')
          .select('*')
          .eq('format_id', 'GUESS_THE_PRICE')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const authorIds = [...new Set((data || []).map((match) => match.author_id).filter(Boolean))];
        let profilesById = {};

        if (authorIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles_public')
            .select('id, display_name, username')
            .in('id', authorIds);

          if (profilesError) {
            console.warn('Could not load deck creators:', profilesError.message);
          } else {
            profilesById = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]));
          }
        }

        const matchesWithStats = await Promise.all((data || []).map(async (match) => {
          const { data: itemPreview, count, error: countError } = await supabase
            .from('game_items')
            .select('payload', { count: 'exact' })
            .eq('match_id', match.id)
            .order('order_index', { ascending: true })
            .limit(1);

          if (countError) throw countError;

          const currencyInfo = getCurrencyInfo(itemPreview?.[0]?.payload);
          const creatorProfile = profilesById[match.author_id];

          return {
            ...match,
            questionCount: count || 0,
            creatorName: creatorProfile?.display_name ?? creatorProfile?.username ?? match.uploader_name ?? match.creator_name ?? match.author_name ?? match.created_by_name ?? (match.is_official ? t('common.classBop') : t('common.teacher')),
            viewCount: match.views ?? match.view_count ?? match.plays ?? match.play_count ?? 0,
            currencyInfo,
          };
        }));

        menuMatchesCache.set(language, matchesWithStats);
        if (isMounted) {
          setMatchesState({
            language,
            matches: matchesWithStats,
            isLoading: false,
          });
        }
      } catch (err) {
        console.error("❌ Failed to fetch matches:", err.message);
      } finally {
        if (isMounted) {
          setMatchesState((current) => (
            current.language === language
              ? { ...current, isLoading: false }
              : current
          ));
        }
      }
    };

    fetchMatches();
    return () => {
      isMounted = false;
    };
  }, [language, t]);

  const filteredMatches = matches.filter((match) => {
    if (showMineOnly && (!user || match.author_id !== user.id)) return false;
    if (showFavoritesOnly && !favoriteIds.has(match.id)) return false;

    return matchesSearch(searchTerm, [
      match.title,
      match.creatorName,
      match.currencyInfo?.name,
    ]);
  });

  const handleNextClick = (matchId) => {
    navigate(`/gtp-play/${matchId}`);
  };

  const toggleFavorite = (matchId) => {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(matchId)) next.delete(matchId);
      else next.add(matchId);

      try {
        window.localStorage.setItem(GTP_FAVORITES_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Favorites still work in-memory for this visit.
      }

      return next;
    });
  };

  return (
    <div className="gtp-menu-page game-catalog-page">
      <main className="game-catalog-shell">
        {isLoading ? (
          <>
            <ClassBopLoader
              variant="decks"
              label={t('gtp.menu.loading')}
              sublabel={t('gtp.menu.loadingSublabel')}
              columns={columns}
            />
          </>
        ) : (
          <>
            <GameMenuToolbar
              searchValue={searchTerm}
              onSearchChange={(event) => setSearchTerm(event.target.value)}
              searchPlaceholder={t('gtp.menu.searchPlaceholder')}
              mineLabel="My Matches"
              mineActive={showMineOnly}
              onMineClick={() => {
                  if (!user) {
                    navigate('/auth');
                    return;
                  }
                  setShowMineOnly((value) => !value);
              }}
              favoritesActive={showFavoritesOnly}
              onFavoritesClick={() => setShowFavoritesOnly((value) => !value)}
              onCreateClick={() => navigate('/gtp-build')}
              onGenerateClick={() => navigate('/gtp-build')}
              createAriaLabel="Create a Guess The Price deck"
              generateAriaLabel="Generate a Guess The Price deck"
            />

            <MasonryDeckGrid columnCount={columns}>
              {filteredMatches.map((match) => (
                <GtpDeckCard
                  key={match.id}
                  match={match}
                  onSelect={handleNextClick}
                  isFavorite={favoriteIds.has(match.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </MasonryDeckGrid>
            {searchTerm && filteredMatches.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '48px', fontFamily: BUBBLY_FONT, fontSize: '22px', color: '#0F172A' }}>
                {t('gtp.menu.noResults')}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
