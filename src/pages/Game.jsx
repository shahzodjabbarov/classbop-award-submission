import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ClassBopLoader from '../components/ClassBopLoader';
import GtpGameSetup from '../games/guessThePrice/GtpGameSetup';
import GuessThePriceGame from '../games/guessThePrice/GuessThePriceGame';
import { useI18n } from '../i18n/useI18n';
import { supabase } from '../supabaseClient';

const BUBBLY_FONT = '"Lilita One", cursive';
const gameItemsCache = new Map();

function formatPrice(payload) {
  const symbol = payload.currency_symbol || '';
  const price = payload.price || '';
  const separator = /[A-Za-z]$/.test(symbol) ? ' ' : '';
  return `${symbol}${separator}${price}`;
}

function mapGameItem(row, t) {
  const payload = row.payload || {};
  const priceLabel = formatPrice(payload);

  return {
    id: row.id,
    title: payload.title || t('gtp.game.untitledItem'),
    desc: payload.desc || t('gtp.game.defaultDesc'),
    price: priceLabel,
    priceLabel,
    exactPrice: priceLabel,
    range: payload.range || t('gtp.game.defaultRange'),
    image: payload.image_url || 'https://picsum.photos/seed/placeholder/640/480',
    stars: payload.stars || '★★★★★',
    reviews: payload.reviews || Math.floor(Math.random() * 500) + 50,
    currency: payload.currency || 'KRW',
    currencySymbol: payload.currency_symbol || '',
  };
}

function shuffleItems(items) {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomValue = new Uint32Array(1);
    window.crypto.getRandomValues(randomValue);
    const j = randomValue[0] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export default function Game() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const cacheKey = `${language}:${matchId}`;
  const cachedGame = gameItemsCache.get(cacheKey);
  const [gameState, setGameState] = useState(() => ({
    cacheKey,
    match: cachedGame?.match || null,
    items: cachedGame?.items || [],
    isLoading: !cachedGame,
    error: '',
  }));
  const [activeItems, setActiveItems] = useState([]);
  const [settings, setSettings] = useState(null);

  const activeGameState = gameState.cacheKey === cacheKey
    ? gameState
    : {
        cacheKey,
        match: cachedGame?.match || null,
        items: cachedGame?.items || [],
        isLoading: !cachedGame,
        error: '',
      };
  const { match, items, isLoading, error } = activeGameState;

  useEffect(() => {
    if (gameItemsCache.has(cacheKey)) return undefined;

    let isMounted = true;

    const fetchGameItems = async () => {
      setGameState({
        cacheKey,
        match: null,
        items: [],
        isLoading: true,
        error: '',
      });

      try {
        const [{ data: matchData, error: matchError }, { data, error: itemError }] = await Promise.all([
          supabase
            .from('game_matches')
            .select('*')
            .eq('id', matchId)
            .single(),
          supabase
            .from('game_items')
            .select('*')
            .eq('match_id', matchId)
            .order('order_index', { ascending: true }),
        ]);

        if (matchError) throw matchError;
        if (itemError) throw itemError;

        const nextItems = (data || []).map((row) => mapGameItem(row, t));
        gameItemsCache.set(cacheKey, {
          match: matchData,
          items: nextItems,
        });

        if (!isMounted) return;
        setGameState({
          cacheKey,
          match: matchData,
          items: nextItems,
          isLoading: false,
          error: '',
        });
      } catch (err) {
        console.error('Failed to load Guess The Price items:', err.message);
        if (isMounted) {
          setGameState({
            cacheKey,
            match: null,
            items: [],
            isLoading: false,
            error: t('gtp.game.loadFailed'),
          });
        }
      } finally {
        if (isMounted) {
          setGameState((current) => (
            current.cacheKey === cacheKey
              ? { ...current, isLoading: false }
              : current
          ));
        }
      }
    };

    fetchGameItems();
    return () => {
      isMounted = false;
    };
  }, [cacheKey, matchId, t]);

  const handleStart = (nextSettings) => {
    setSettings(nextSettings);
    setActiveItems(nextSettings.shuffle ? shuffleItems(items) : items);
  };

  if (isLoading) {
    return (
      <ClassBopLoader
        variant="game"
        label={t('gtp.game.loading')}
        sublabel={t('gtp.game.loadingSublabel')}
      />
    );
  }

  if (error) {
    return (
      <div style={styles.stateScreen}>
        <div style={styles.stateCard}>{error}</div>
        <button onClick={() => navigate('/gtp-menu')} style={styles.stateButton}>{t('gtp.game.goBack')}</button>
      </div>
    );
  }

  if (!settings) {
    return (
      <GtpGameSetup
        deckTitle={match?.title || t('gtp.setup.eyebrow')}
        itemCount={items.length}
        thumbnailUrl={match?.thumbnail_url}
        onBack={() => navigate('/gtp-menu')}
        onStart={handleStart}
      />
    );
  }

  return (
    <GuessThePriceGame
      items={activeItems}
      settings={settings}
      onBack={() => navigate('/gtp-menu')}
    />
  );
}

const styles = {
  stateScreen: {
    position: 'fixed',
    inset: 0,
    zIndex: 5000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    backgroundColor: '#87CEEB',
  },
  stateCard: {
    padding: '24px 34px',
    border: '4px solid #111',
    borderRadius: '20px',
    backgroundColor: '#fff',
    color: '#111',
    fontFamily: BUBBLY_FONT,
    fontSize: '34px',
    boxShadow: '6px 6px 0 rgba(0,0,0,0.35)',
    textAlign: 'center',
  },
  stateButton: {
    border: '4px solid #111',
    borderRadius: '16px',
    backgroundColor: '#FFEB00',
    color: '#111',
    fontFamily: BUBBLY_FONT,
    fontSize: '24px',
    padding: '12px 24px',
    cursor: 'pointer',
    boxShadow: '4px 4px 0 rgba(0,0,0,0.35)',
  },
};
