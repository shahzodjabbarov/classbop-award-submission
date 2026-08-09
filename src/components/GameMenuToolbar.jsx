import './GameMenuToolbar.css';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4.8A2.8 2.8 0 0 1 8.8 2h6.4A2.8 2.8 0 0 1 18 4.8V21l-6-3.7L6 21Z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 5.7a5.4 5.4 0 0 0-7.7 0L12 6.8l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7L12 22l8.8-8.6a5.4 5.4 0 0 0 0-7.7Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function GenerateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5 14 8.8a2 2 0 0 0 1.2 1.2l5.3 2-5.3 2a2 2 0 0 0-1.2 1.2l-2 5.3-2-5.3A2 2 0 0 0 8.8 14l-5.3-2 5.3-2A2 2 0 0 0 10 8.8l2-5.3Z" />
    </svg>
  );
}

export default function GameMenuToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  mineLabel,
  mineActive = false,
  onMineClick,
  favoritesActive = false,
  onFavoritesClick,
  onCreateClick,
  onGenerateClick,
  createAriaLabel = 'Create',
  generateAriaLabel = 'Generate',
}) {
  return (
    <div className="game-menu-toolbar">
      <label className="game-menu-toolbar__search">
        <SearchIcon />
        <input
          type="search"
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
      </label>

      <button
        type="button"
        className={`game-menu-toolbar__pill ${mineActive ? 'is-active' : ''}`}
        onClick={onMineClick}
      >
        <BookmarkIcon />
        <span>{mineLabel}</span>
      </button>

      <button
        type="button"
        className={`game-menu-toolbar__pill ${favoritesActive ? 'is-active' : ''}`}
        onClick={onFavoritesClick}
      >
        <HeartIcon />
        <span>Favorites</span>
      </button>

      <button
        type="button"
        className="game-menu-toolbar__action game-menu-toolbar__action--create"
        aria-label={createAriaLabel}
        onClick={onCreateClick}
      >
        <span className="game-menu-toolbar__action-icon"><PlusIcon /></span>
        <span className="game-menu-toolbar__action-copy">
          <strong>Create</strong>
          <em>Build from scratch</em>
        </span>
      </button>

      <button
        type="button"
        className="game-menu-toolbar__action game-menu-toolbar__action--generate"
        aria-label={generateAriaLabel}
        onClick={onGenerateClick}
      >
        <span className="game-menu-toolbar__action-icon"><GenerateIcon /></span>
        <span className="game-menu-toolbar__action-copy">
          <strong>Generate</strong>
          <em>From lesson files</em>
        </span>
      </button>
    </div>
  );
}
