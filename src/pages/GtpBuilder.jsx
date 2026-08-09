import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useI18n } from '../i18n/useI18n';
import { supabase } from '../supabaseClient';
import './CreatorTheme.css';

// 🌍 SUPPORTED CURRENCIES
const CURRENCIES = [
  { label: "🇰🇷 South Korea (KRW)", symbol: "₩", value: "KRW" },
  { label: "🇺🇿 Uzbekistan (UZS)", symbol: "UZS", value: "UZS" },
  { label: "🇺🇸 United States (USD)", symbol: "$", value: "USD" },
  { label: "🇯🇵 Japan (JPY)", symbol: "¥", value: "JPY" },
  { label: "🇪🇺 Europe (EUR)", symbol: "€", value: "EUR" },
  { label: "🇬🇧 United Kingdom (GBP)", symbol: "£", value: "GBP" },
  { label: "🇵🇭 Philippines (PHP)", symbol: "₱", value: "PHP" },
  { label: "🇻🇳 Vietnam (VND)", symbol: "₫", value: "VND" }
];

const DEFAULT_CURRENCY = CURRENCIES[0];
const DRAFT_STORAGE_KEY = 'classbop:gtp-builder-draft';

const MAX_ITEM_IMAGE_BYTES = 1.5 * 1024 * 1024;

const isValidImageFile = (file) => {
  return Boolean(file) && file.type.startsWith('image/') && file.size <= MAX_ITEM_IMAGE_BYTES;
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const createItemId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createEmptyItem = () => ({
  id: createItemId(),
  image_url: null,
  title: "",
  desc: "",
  price: "",
  range: ""
});

const getCurrencyByValue = (value) => CURRENCIES.find((currency) => currency.value === value) || DEFAULT_CURRENCY;

const getDefaultDraft = () => ({
  gameTitle: "",
  thumbnail: null,
  activeCurrency: DEFAULT_CURRENCY,
  items: [createEmptyItem()],
});

const normalizeItems = (savedItems) => {
  if (!Array.isArray(savedItems) || savedItems.length === 0) {
    return [createEmptyItem()];
  }

  return savedItems.map((item) => ({
    id: item?.id || createItemId(),
    image_url: item?.image_url || null,
    title: item?.title || "",
    desc: item?.desc || "",
    price: item?.price || "",
    range: item?.range || "",
  }));
};

const loadBuilderDraft = () => {
  if (typeof window === 'undefined') return getDefaultDraft();

  try {
    const savedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!savedDraft) return getDefaultDraft();

    const parsed = JSON.parse(savedDraft);
    return {
      gameTitle: parsed?.gameTitle || "",
      thumbnail: parsed?.thumbnail || null,
      activeCurrency: getCurrencyByValue(parsed?.currency),
      items: normalizeItems(parsed?.items),
    };
  } catch (error) {
    console.warn('Could not restore Guess The Price draft:', error);
    return getDefaultDraft();
  }
};

const hasDraftContent = ({ gameTitle, thumbnail, activeCurrency, items }) => {
  const hasItemContent = items.some((item) => (
    item.image_url ||
    item.title.trim() ||
    item.desc.trim() ||
    item.price.trim() ||
    item.range.trim()
  ));

  return Boolean(
    gameTitle.trim() ||
    thumbnail ||
    activeCurrency.value !== DEFAULT_CURRENCY.value ||
    hasItemContent
  );
};

const saveBuilderDraft = (draft) => {
  if (typeof window === 'undefined') return;

  try {
    if (!hasDraftContent(draft)) {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
      gameTitle: draft.gameTitle,
      thumbnail: draft.thumbnail,
      currency: draft.activeCurrency.value,
      items: draft.items,
    }));
  } catch (error) {
    console.warn('Could not save Guess The Price draft:', error);
  }
};

const clearBuilderDraft = () => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (error) {
    console.warn('Could not clear Guess The Price draft:', error);
  }
};

export default function GtpBuilder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [isSaving, setIsSaving] = useState(false);
  const [initialDraft] = useState(loadBuilderDraft);

  const [gameTitle, setGameTitle] = useState(initialDraft.gameTitle);
  const [thumbnail, setThumbnail] = useState(initialDraft.thumbnail);

  // 🌍 CURRENCY STATE (Defaults to KRW)
  const [activeCurrency, setActiveCurrency] = useState(initialDraft.activeCurrency);

  const [items, setItems] = useState(initialDraft.items);
  const latestDraftRef = useRef({ gameTitle, thumbnail, activeCurrency, items });

  useEffect(() => {
    const draft = { gameTitle, thumbnail, activeCurrency, items };
    latestDraftRef.current = draft;
    saveBuilderDraft(draft);
  }, [gameTitle, thumbnail, activeCurrency, items]);

  useEffect(() => {
    const persistLatestDraft = () => saveBuilderDraft(latestDraftRef.current);
    const persistWhenHidden = () => {
      if (document.visibilityState === 'hidden') persistLatestDraft();
    };

    window.addEventListener('pagehide', persistLatestDraft);
    document.addEventListener('visibilitychange', persistWhenHidden);

    return () => {
      persistLatestDraft();
      window.removeEventListener('pagehide', persistLatestDraft);
      document.removeEventListener('visibilitychange', persistWhenHidden);
    };
  }, []);

  useEffect(() => {
    const handleGlobalPaste = async (e) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      let imageFile = null;
      for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.startsWith('image/')) {
          imageFile = clipboardItems[i].getAsFile();
          break;
        }
      }

      if (imageFile && !isValidImageFile(imageFile)) {
        alert(t('gtp.builder.imageTooLarge'));
        return;
      }

      if (imageFile) {
        const base64 = await fileToBase64(imageFile);

        setItems(prevItems => {
          const emptyIndex = prevItems.findIndex(item => !item.image_url);

          if (emptyIndex !== -1) {
            const newItems = [...prevItems];
            newItems[emptyIndex] = { ...newItems[emptyIndex], image_url: base64 };
            return newItems;
          }

          if (!thumbnail) {
            setThumbnail(base64);
          }

          return prevItems;
        });
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [thumbnail, t]);

  const handleDrop = async (e, targetId = null) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/') && !isValidImageFile(file)) {
      alert(t('gtp.builder.imageTooLarge'));
      return;
    }
    if (file && file.type.startsWith('image/')) {
      const base64 = await fileToBase64(file);
      if (targetId === 'THUMBNAIL') {
        setThumbnail(base64);
      } else {
        updateItem(targetId, 'image_url', base64);
      }
    }
  };

  const handleClickUpload = async (event, targetId = null) => {
    const file = event.target.files[0];
    if (file && !isValidImageFile(file)) {
      alert(t('gtp.builder.imageTooLarge'));
      return;
    }
    if (file) {
      const base64 = await fileToBase64(file);
      if (targetId === 'THUMBNAIL') {
        setThumbnail(base64);
      } else {
        updateItem(targetId, 'image_url', base64);
      }
    }
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const deleteItem = (id) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter(item => item.id !== id));
  };

  const handleCurrencyChange = (e) => {
    const selected = CURRENCIES.find(c => c.value === e.target.value);
    if (selected) setActiveCurrency(selected);
  };

  const handleSaveGame = async () => {
    if (!user) {
      navigate('/auth?mode=login&next=/gtp-build');
      return;
    }

    if (!gameTitle.trim() || items.some(item => !item.title || !item.price)) {
      alert(t('gtp.builder.validation'));
      return;
    }

    setIsSaving(true);
    try {
      const { data: matchData, error: matchError } = await supabase
        .from('game_matches')
        .insert([{
          author_id: user.id,
          format_id: 'GUESS_THE_PRICE',
          title: gameTitle,
          thumbnail_url: thumbnail || 'https://picsum.photos/seed/hag1/640/480',
          is_public: true,
          is_official: false
        }])
        .select()
        .single();

      if (matchError) throw matchError;

      const itemsToInsert = items.map((item, index) => ({
        match_id: matchData.id,
        game_type: 'GUESS_THE_PRICE',
        order_index: index + 1,
        payload: {
          title: item.title,
          desc: item.desc,
          price: item.price,
          range: item.range,
          currency: activeCurrency.value,         // 🌍 Saves 'KRW'
          currency_symbol: activeCurrency.symbol, // 🌍 Saves '₩'
          image_url: item.image_url || 'https://picsum.photos/seed/placeholder/640/480',
          stars: "★★★★★",
          reviews: Math.floor(Math.random() * 500) + 50
        }
      }));

      const { error: itemsError } = await supabase
        .from('game_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      clearBuilderDraft();
      alert(t('gtp.builder.published'));
      navigate('/gtp-menu');

    } catch (error) {
      console.error("Save failed:", error.message);
      alert(t('gtp.builder.saveFailed', { message: error.message }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="gtp-builder-page creator-page">
      <main className="gtp-builder-shell">
        <header className="creator-header gtp-builder-header">
          <button type="button" className="creator-back" onClick={() => navigate('/gtp-menu')}>
            ← {t('common.back')}
          </button>
          <div className="creator-header-copy">
            <p>{t('gtp.setup.eyebrow')} Studio</p>
            <h1>{t('gtp.builder.buildDeck')}</h1>
          </div>
          <button type="button" className="creator-save creator-save--compact" onClick={handleSaveGame} disabled={isSaving}>
            {isSaving ? t('gtp.builder.saving') : t('gtp.builder.publish')}
          </button>
        </header>

        <section className="creator-panel gtp-builder-settings">
          <label
            className="gtp-builder-thumbnail"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, 'THUMBNAIL')}
          >
            {thumbnail ? (
              <img src={thumbnail} alt={t('gtp.builder.thumbnailAlt')} />
            ) : (
              <span aria-hidden="true">📷</span>
            )}
            <input type="file" accept="image/*" onChange={(event) => handleClickUpload(event, 'THUMBNAIL')} />
          </label>

          <div className="gtp-builder-settings-fields">
            <label className="creator-field">
              <span>{t('gtp.builder.deckTitle')}</span>
              <input
                value={gameTitle}
                onChange={(event) => setGameTitle(event.target.value)}
                placeholder={t('gtp.builder.deckTitlePlaceholder')}
              />
            </label>

            <label className="creator-field">
              <span>{t('gtp.builder.gameCurrency')}</span>
              <select value={activeCurrency.value} onChange={handleCurrencyChange}>
                {CURRENCIES.map((currency) => (
                  <option key={currency.value} value={currency.value}>{currency.label}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="gtp-builder-items-section">
          <div className="creator-section-heading">
            <div>
              <p>{t('gtp.setup.itemsReady', { count: items.length })}</p>
              <h2>{t('gtp.builder.productName')}</h2>
            </div>
            <span>{items.length}</span>
          </div>

          <div className="gtp-builder-grid">
            {items.map((item, index) => (
              <article key={item.id} className="creator-card gtp-builder-card">
                <button
                  type="button"
                  className="creator-remove"
                  onClick={() => deleteItem(item.id)}
                  disabled={items.length === 1}
                  aria-label={`Remove item ${index + 1}`}
                >
                  ×
                </button>
                <span className="creator-card-number">{index + 1}</span>

                <label
                  className={`gtp-builder-media${item.image_url ? ' has-image' : ''}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, item.id)}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={t('gtp.builder.uploadAlt')} />
                  ) : (
                    <span><b aria-hidden="true">📷</b>{t('gtp.builder.dragOrClick')}</span>
                  )}
                  <input type="file" accept="image/*" onChange={(event) => handleClickUpload(event, item.id)} />
                </label>

                <div className="gtp-builder-card-fields">
                  <label className="creator-field">
                    <span>{t('gtp.builder.productName')}</span>
                    <input
                      type="text"
                      placeholder={t('gtp.builder.productNamePlaceholder')}
                      value={item.title}
                      onChange={(event) => updateItem(item.id, 'title', event.target.value)}
                    />
                  </label>

                  <label className="creator-field">
                    <span>{t('gtp.builder.description')}</span>
                    <input
                      type="text"
                      placeholder={t('gtp.builder.descriptionPlaceholder')}
                      value={item.desc}
                      onChange={(event) => updateItem(item.id, 'desc', event.target.value)}
                    />
                  </label>

                  <div className="gtp-builder-price-row">
                    <label className="creator-field creator-field--price">
                      <span>{t('gtp.builder.price', { symbol: activeCurrency.symbol })}</span>
                      <input
                        type="text"
                        placeholder={t('gtp.builder.pricePlaceholder')}
                        value={item.price}
                        onChange={(event) => updateItem(item.id, 'price', event.target.value)}
                      />
                    </label>
                    <label className="creator-field">
                      <span>{t('gtp.builder.hintRange')}</span>
                      <input
                        type="text"
                        placeholder={t('gtp.builder.rangePlaceholder')}
                        value={item.range}
                        onChange={(event) => updateItem(item.id, 'range', event.target.value)}
                      />
                    </label>
                  </div>
                </div>
              </article>
            ))}

            <button type="button" className="creator-add-card gtp-builder-add" onClick={addItem}>
              <span aria-hidden="true">＋</span>
              <strong>{t('gtp.builder.addItem')}</strong>
            </button>
          </div>
        </section>

        <footer className="creator-footer">
          <p>{t('gtp.setup.itemsReady', { count: items.length })}</p>
          <button type="button" className="creator-save" onClick={handleSaveGame} disabled={isSaving}>
            {isSaving ? t('gtp.builder.saving') : t('gtp.builder.publish')}
          </button>
        </footer>
      </main>
    </div>
  );
}
