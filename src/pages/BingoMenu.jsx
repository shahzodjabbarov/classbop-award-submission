import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DeckCard from '../components/DeckCard';
import MasonryDeckGrid from '../components/MasonryDeckGrid';
import GameHowToPanel from '../components/GameHowToPanel';
import GameSearchBar from '../components/GameSearchBar';
import { matchesSearch } from '../components/gameSearch';
import MediaSearchPicker, { SearchIcon } from '../components/MediaSearchPicker';
import {
  BINGO_GAMES,
  CUSTOM_BINGO_GAME_ID,
  createCustomBingoGame,
  normalizeCustomBingoItems,
} from '../games/bingo/bingoGames';
import { useI18n } from '../i18n/useI18n';
import './Bingo.css';
import './CreatorTheme.css';

const MIN_CUSTOM_ITEMS = 4;
const MAX_CUSTOM_ITEMS = 40;
const MAX_IMAGE_DIMENSION = 900;

function makeCustomRow() {
  const id = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `bingo-row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return { id, label: '', image: '' };
}

async function fileToResizedDataUrl(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const image = await new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = dataUrl;
  });

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  if (scale >= 1 && file.size < 220 * 1024) return dataUrl;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86);
}

export default function BingoMenu() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [howToOpen, setHowToOpen] = useState(false);
  const [isCustomBuilderOpen, setIsCustomBuilderOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customRows, setCustomRows] = useState(() => Array.from({ length: 9 }, makeCustomRow));
  const [customError, setCustomError] = useState('');
  const [mediaSearchTarget, setMediaSearchTarget] = useState(null);
  const fileInputRefs = useRef({});
  const parsedCustomItems = useMemo(() => normalizeCustomBingoItems(customRows), [customRows]);

  const openCustomBuilder = () => {
    setIsCustomBuilderOpen(true);
    setCustomError('');
    window.setTimeout(() => {
      document.getElementById('custom-bingo-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const closeCustomBuilder = () => {
    setIsCustomBuilderOpen(false);
    setCustomError('');
  };

  const updateCustomRow = (id, patch) => {
    setCustomRows((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row));
    setCustomError('');
  };

  const addCustomRow = () => {
    setCustomRows((rows) => rows.length >= MAX_CUSTOM_ITEMS ? rows : [...rows, makeCustomRow()]);
  };

  const removeCustomRow = (id) => {
    setCustomRows((rows) => rows.length <= 1 ? rows : rows.filter((row) => row.id !== id));
    setCustomError('');
  };

  const handleImagePick = async (id, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type?.startsWith('image/')) return;

    try {
      updateCustomRow(id, { image: await fileToResizedDataUrl(file) });
    } catch {
      setCustomError(t('bingo.custom.imageError'));
    }
  };

  const openMediaSearch = (row) => {
    setMediaSearchTarget({ id: row.id, query: row.label });
  };

  const handleMediaSelect = (item) => {
    if (!mediaSearchTarget?.id) return;
    setCustomRows((rows) => rows.map((row) => {
      if (row.id !== mediaSearchTarget.id) return row;
      return {
        ...row,
        image: item.url,
        label: row.label.trim() ? row.label : item.title.slice(0, 42),
      };
    }));
    setCustomError('');
    setMediaSearchTarget(null);
  };

  const createCustomSet = (event) => {
    event.preventDefault();

    if (parsedCustomItems.length < MIN_CUSTOM_ITEMS) {
      setCustomError(t('bingo.custom.error'));
      return;
    }

    const customGame = createCustomBingoGame({
      title: customTitle || t('bingo.custom.title'),
      items: parsedCustomItems,
      pickerHint: t('bingo.custom.pickerHint'),
    });

    navigate(`/bingo/${CUSTOM_BINGO_GAME_ID}`, { state: { customGame } });
  };

  const filteredGames = BINGO_GAMES.filter((game) =>
    matchesSearch(searchTerm, [
      t(`bingo.games.${game.id}.title`),
      t(`bingo.games.${game.id}.description`),
      game.shortTitle,
    ])
  );

  return (
    <div className="bingo-page bingo-menu-page">
      <div className="bingo-catalog-shell">
        <header className="bingo-page-header">
          <button type="button" className="bingo-brutal-button bingo-white-button" onClick={() => navigate('/activities')}>
            {t('bingo.menu.back')}
          </button>
          <div className="bingo-heading-copy">
            <p className="bingo-kicker">{t('bingo.menu.kicker')}</p>
            <h1>{t('bingo.menu.title')}</h1>
            <p>{t('bingo.menu.description')}</p>
          </div>
          <div className="bingo-header-spacer" aria-hidden="true" />
        </header>

        <div className="bingo-menu-tools">
          <div className="bingo-menu-search">
            <GameSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={t('bingo.menu.searchPlaceholder')}
              resultCount={filteredGames.length}
              maxWidth="100%"
            />
          </div>
          <button type="button" className="bingo-menu-create" onClick={openCustomBuilder}>
            <span aria-hidden="true">＋</span>
            <strong>{t('bingo.custom.title')}</strong>
          </button>
          <GameHowToPanel
            render="toggle"
            isOpen={howToOpen}
            onToggle={() => setHowToOpen((open) => !open)}
          />
        </div>

        <div className="bingo-menu-how">
          <GameHowToPanel
            render="panel"
            isOpen={howToOpen}
            imageSrc="/thumbnails/bingo.jpg"
            imageAlt={t('bingo.menu.title')}
            paragraphs={t('bingo.menu.howTo')}
            tags={t('bingo.menu.tags')}
          />
        </div>

      {!isCustomBuilderOpen && (
        <MasonryDeckGrid
          as="main"
          className="bingo-game-grid"
          columnCount={Math.max(1, Math.min(4, filteredGames.length))}
        >
          {filteredGames.map((game) => (
            <DeckCard
              key={game.id}
              onClick={() => navigate(`/bingo/${game.id}`)}
              title={t(`bingo.games.${game.id}.title`)}
              description={t(`bingo.games.${game.id}.description`)}
              image={game.thumbnail}
              mediaRatio={1.6}
              meta={[
                { id: 'author', tone: 'author', icon: '●', label: t('common.classBop') },
                { id: 'items', tone: 'count', icon: '#', label: game.items.length, title: t('common.items', { count: game.items.length }) },
              ]}
            />
          ))}
        </MasonryDeckGrid>
      )}

      {!isCustomBuilderOpen && searchTerm && filteredGames.length === 0 && (
        <p style={{ textAlign: 'center', margin: '8px auto 40px', fontWeight: 700, color: '#0F172A' }}>
          {t('bingo.menu.noResults')}
        </p>
      )}

      {isCustomBuilderOpen && (
        <section className="bingo-custom-builder" aria-labelledby="custom-bingo-title">
          <form onSubmit={createCustomSet}>
            <div className="bingo-custom-builder-copy">
              <p className="bingo-kicker">{t('bingo.custom.ready')}</p>
              <h2 id="custom-bingo-title">{t('bingo.custom.builderTitle')}</h2>
              <p>{t('bingo.custom.builderBody')}</p>
            </div>

            <label className="bingo-custom-field">
              <span>{t('bingo.custom.nameLabel')}</span>
              <input
                value={customTitle}
                onChange={(event) => setCustomTitle(event.target.value)}
                placeholder={t('bingo.custom.namePlaceholder')}
              />
            </label>

            <div className="bingo-custom-items-field">
              <span>{t('bingo.custom.wordsLabel')}</span>
              <div className="bingo-custom-items">
                {customRows.map((row, index) => (
                  <div className="bingo-custom-item-row" key={row.id}>
                    <span className="bingo-custom-item-index">{index + 1}</span>
                    <input
                      value={row.label}
                      maxLength={42}
                      placeholder={t('bingo.custom.itemPlaceholder')}
                      onChange={(event) => updateCustomRow(row.id, { label: event.target.value })}
                    />
                    <input
                      ref={(element) => { fileInputRefs.current[row.id] = element; }}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(event) => handleImagePick(row.id, event)}
                    />
                    <div className="bingo-custom-media-actions">
                      {row.image ? (
                        <div className="bingo-custom-image-control">
                          <button
                            type="button"
                            className="bingo-custom-image-thumb"
                            onClick={() => updateCustomRow(row.id, { image: '' })}
                            title={t('bingo.custom.removeImage')}
                          >
                            <img src={row.image} alt="" />
                            <i>×</i>
                          </button>
                          <button
                            type="button"
                            className="bingo-custom-search-popover"
                            onClick={() => openMediaSearch(row)}
                          >
                            <SearchIcon />
                            <span>Search</span>
                          </button>
                        </div>
                      ) : (
                        <div className="bingo-custom-image-control">
                          <button
                            type="button"
                            className="bingo-custom-image-button"
                            onClick={() => fileInputRefs.current[row.id]?.click()}
                          >
                            {t('bingo.custom.addImage')}
                          </button>
                          <button
                            type="button"
                            className="bingo-custom-search-popover"
                            onClick={() => openMediaSearch(row)}
                          >
                            <SearchIcon />
                            <span>Search</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="bingo-custom-remove-row"
                      onClick={() => removeCustomRow(row.id)}
                      disabled={customRows.length <= 1}
                      aria-label={t('bingo.custom.removeItem')}
                    >
                      −
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="bingo-custom-add-row"
                onClick={addCustomRow}
                disabled={customRows.length >= MAX_CUSTOM_ITEMS}
              >
                + {t('bingo.custom.addItem')}
              </button>
            </div>

            <div className="bingo-custom-meta">
              <span>{t('bingo.custom.wordCount', { count: parsedCustomItems.length })}</span>
              <span>{t('bingo.custom.helper')}</span>
            </div>

            {customError && <p className="bingo-error" role="alert">{customError}</p>}

            <div className="bingo-custom-actions">
              <button type="button" className="bingo-brutal-button bingo-white-button" onClick={closeCustomBuilder}>
                {t('bingo.custom.cancel')}
              </button>
              <button type="submit" className="bingo-brutal-button">
                {t('bingo.custom.createButton')}
              </button>
            </div>
          </form>
        </section>
      )}

      {mediaSearchTarget && (
        <MediaSearchPicker
          title="Search Bingo Images"
          initialQuery={mediaSearchTarget.query}
          allowedModes={['image']}
          onClose={() => setMediaSearchTarget(null)}
          onSelect={handleMediaSelect}
        />
      )}
      </div>
    </div>
  );
}
