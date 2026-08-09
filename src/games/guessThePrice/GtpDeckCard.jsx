import { useState } from 'react';
import { Banknote } from 'lucide-react';
import DeckCard from '../../components/DeckCard';
import { useI18n } from '../../i18n/useI18n';

export default function GtpDeckCard({ match, onSelect, isFavorite = false, onToggleFavorite }) {
  const { t } = useI18n();
  const [savedNote, setSavedNote] = useState(false);
  const {
    id,
    title,
    questionCount = 0,
    creatorName,
    currencyInfo = { flag: '🌍', name: 'KRW' },
  } = match;

  const creator = creatorName || (match.is_official ? t('common.classBop') : t('common.teacher'));
  const itemsLabel = t('gtp.deckCard.items', { count: questionCount });

  const handleFavorite = () => {
    onToggleFavorite?.(id);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 1400);
  };

  return (
    <DeckCard
      className="gtp-money-card"
      onClick={() => onSelect(id)}
      title={title}
      description={`${currencyInfo.flag} ${currencyInfo.name}`}
      image={match.thumbnail_url}
      emoji={match.cover_emoji || '🏷️'}
      isFavorite={isFavorite}
      onToggleFavorite={handleFavorite}
      meta={[
        { id: 'author', tone: 'author', icon: '●', label: creator, title: `Created by ${creator}` },
        { id: 'items', tone: 'count', icon: '?', label: questionCount, title: itemsLabel },
      ]}
    >
      <span className="gtp-money-mark" aria-hidden="true">
        <Banknote />
      </span>
      {savedNote && <div style={styles.savedBubble}>{isFavorite ? 'Saved' : 'Removed'}</div>}
    </DeckCard>
  );
}

const styles = {
  savedBubble: {
    position: 'absolute',
    left: '11px',
    top: '47px',
    whiteSpace: 'nowrap',
    backgroundColor: '#111827',
    color: '#FFFFFF',
    borderRadius: '10px',
    padding: '6px 11px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '12px',
    fontWeight: 600,
    boxShadow: '0 6px 16px rgba(15,23,42,0.28)',
    zIndex: 4,
  },
};
