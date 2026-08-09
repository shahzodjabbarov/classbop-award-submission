import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useI18n } from '../i18n/useI18n';

const BUBBLY_FONT = '"Lilita One", cursive';
const MODERN_FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function MatchSelector({ formatId, formatTitle, columns, onBack, onSelectMatch }) {
  const { t } = useI18n();
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Fetch the matches when this component mounts!
  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('game_matches')
          .select('*')
          .eq('format_id', formatId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMatches(data || []);
      } catch (err) {
        console.error("❌ Failed to fetch matches:", err.message);
        alert(t('matchSelector.loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [formatId, t]);

  return (
    <div style={styles.pageContainer}>
      {/* Header & Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '40px' }}>
        <button
          onClick={onBack}
          style={{ position: 'absolute', left: '20px', padding: '10px 20px', fontSize: '18px', fontFamily: BUBBLY_FONT, backgroundColor: 'white', border: '3px solid #111', borderRadius: '10px', cursor: 'pointer', boxShadow: '3px 3px 0 #111' }}
        >
          {t('matchSelector.back')}
        </button>
        <h1 style={{ fontFamily: '"Lilita One", "Arial Black", Impact, sans-serif', fontSize: columns === 1 ? '30px' : '50px', color: '#FFEB00', textShadow: '4px 4px 0 #111, -2px -2px 0 #111, 2px -2px 0 #111, -2px 2px 0 #111, 6px 6px 15px rgba(0,0,0,0.5)', margin: 0 }}>
          {t('matchSelector.title')}
        </h1>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: BUBBLY_FONT, fontSize: '30px', color: '#111' }}>
          {t('matchSelector.loading')}
        </div>
      ) : matches.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: MODERN_FONT, fontSize: '24px', color: '#111' }}>
          {t('matchSelector.empty', { formatTitle })}
        </div>
      ) : (
        <div style={{ ...styles.grid, gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {matches.map((match) => {
            const isHovered = hoveredCard === match.id;

            return (
              <div
                key={match.id}
                onClick={() => onSelectMatch(match.id)}
                onMouseEnter={() => setHoveredCard(match.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  ...styles.card,
                  maxWidth: columns === 1 ? '480px' : 'none',
                  margin: columns === 1 ? '0 auto' : '0',
                  transform: isHovered ? 'scale(1.05) translateY(-4px)' : 'scale(1) translateY(0)',
                  boxShadow: isHovered ? '8px 10px 0 #111' : '4px 4px 0 #111',
                  borderColor: match.is_official ? '#FFD700' : '#111',
                }}
              >
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

                  {/* Official Badge */}
                  {match.is_official && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#FFD700', padding: '4px 8px', borderRadius: '8px', border: '2px solid #111', fontSize: '12px', fontWeight: 'bold', fontFamily: BUBBLY_FONT, zIndex: 10 }}>
                      {t('matchSelector.original')}
                    </div>
                  )}

                  <div style={styles.imageContainer}>
                    <img
                      src={match.thumbnail_url || 'https://picsum.photos/seed/placeholder/640/480'}
                      alt={match.title}
                      style={{ ...styles.image, transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                    />
                  </div>

                  <h3 style={styles.cardTitle}>{match.title}</h3>

                  <div style={{
                    ...styles.button,
                    backgroundColor: match.is_official ? '#FFD700' : '#E5E7EB',
                    boxShadow: '3px 3px 0px #111',
                  }}>
                    {t('matchSelector.play')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Just copying the necessary styles for the cards so this file is self-contained!
const styles = {
  pageContainer: { width: '100%', maxWidth: '1000px', padding: '40px 0', fontFamily: MODERN_FONT, boxSizing: 'border-box', margin: '0 auto' },
  grid: { display: 'grid', gap: '24px', width: '100%', padding: '0 20px 80px 20px', boxSizing: 'border-box' },
  card: { position: 'relative', overflow: 'hidden', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '3px solid #111', padding: '14px', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease', cursor: 'pointer', boxSizing: 'border-box', width: '100%' },
  imageContainer: { width: '100%', height: '220px', border: '3px solid #111', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', backgroundColor: '#E5E7EB', flexShrink: 0 },
  image: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' },
  cardTitle: { fontFamily: BUBBLY_FONT, fontSize: '22px', fontWeight: '400', color: '#111827', margin: '0 0 6px 0', letterSpacing: '0.5px' },
  button: { marginTop: 'auto', padding: '10px', border: '3px solid #111', borderRadius: '8px', color: '#111', fontFamily: BUBBLY_FONT, fontSize: '18px', textAlign: 'center' },
};
