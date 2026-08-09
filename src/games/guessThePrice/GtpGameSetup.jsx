import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/useI18n';

const BUBBLY_FONT = '"Lilita One", cursive';
const MODERN_FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const teamOptions = [1, 2, 3, 4];
const timerOptions = [
  { labelKey: 'off', value: 0 },
  { labelKey: '30s', value: 30 },
  { labelKey: '60s', value: 60 },
  { labelKey: '90s', value: 90 },
];

function useIsNarrow() {
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 720);

  useEffect(() => {
    const handler = () => setIsNarrow(window.innerWidth < 720);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isNarrow;
}

const focusInput = (event) => {
  event.currentTarget.style.borderColor = '#111827';
  event.currentTarget.style.backgroundColor = '#FFFFFF';
};

const blurInput = (event) => {
  event.currentTarget.style.borderColor = '#E2E8F0';
  event.currentTarget.style.backgroundColor = '#F8FAFC';
};

export default function GtpGameSetup({ deckTitle, itemCount, thumbnailUrl, onBack, onStart }) {
  const { t } = useI18n();
  const isNarrow = useIsNarrow();
  const [teamCount, setTeamCount] = useState(2);
  const [lengthMode, setLengthMode] = useState('ALL');
  const [customLength, setCustomLength] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [customTimer, setCustomTimer] = useState('');
  const [shuffle, setShuffle] = useState(false);
  const [teamNames, setTeamNames] = useState([
    t('gtp.setup.teamName', { number: 1 }).toUpperCase(),
    t('gtp.setup.teamName', { number: 2 }).toUpperCase(),
  ]);

  const parsedCustomLength = Number(customLength);
  const customLengthIsActive = lengthMode === 'CUSTOM';
  const customLengthIsEmpty = customLengthIsActive && customLength.trim() === '';
  const customLengthIsInvalid = customLengthIsActive && (
    customLengthIsEmpty ||
    !Number.isInteger(parsedCustomLength) ||
    parsedCustomLength < 1 ||
    parsedCustomLength > itemCount
  );
  const selectedLength = customLengthIsActive ? parsedCustomLength : 'ALL';
  const customTimerIsActive = timerSeconds === 'CUSTOM';
  const parsedCustomTimer = Number(customTimer);
  const customTimerIsInvalid = customTimerIsActive && (
    customTimer.trim() === '' ||
    !Number.isInteger(parsedCustomTimer) ||
    parsedCustomTimer < 10 ||
    parsedCustomTimer > 300
  );
  const selectedTimer = customTimerIsActive ? parsedCustomTimer : timerSeconds;
  const canStart = itemCount > 0 && !customLengthIsInvalid && !customTimerIsInvalid;

  const handleTeamCountChange = (count) => {
    setTeamCount(count);
    setTeamNames((prev) => Array.from({ length: count }, (_, i) => prev[i] || t('gtp.setup.teamName', { number: i + 1 }).toUpperCase()));
  };

  const updateTeamName = (index, value) => {
    setTeamNames((prev) => {
      const next = [...prev];
      next[index] = value.toUpperCase();
      return next;
    });
  };

  const handleStart = () => {
    if (!canStart) return;

    onStart({
      teams: teamCount,
      teamNames,
      length: selectedLength,
      timerSeconds: selectedTimer,
      shuffle,
    });
  };

  return (
    <div style={styles.page}>
      <section style={styles.shell}>
        <div style={styles.header}>
          <div style={styles.thumbnailWrap}>
            <img src={thumbnailUrl || '/gtp_media/cover-guess.jpg'} alt={deckTitle} style={styles.thumbnail} />
          </div>
          <div style={styles.headerCopy}>
            <h1 style={styles.title}>{deckTitle || t('gtp.setup.fallbackTitle')}</h1>
            <span style={styles.itemChip}>{t('gtp.setup.itemsReady', { count: itemCount })}</span>
          </div>
          <button
            onClick={onBack}
            style={styles.backButton}
            onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = '#E2E8F0'; }}
            onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = '#F1F5F9'; }}
          >
            {t('gtp.setup.back')}
          </button>
        </div>

        <div style={{ ...styles.contentGrid, gridTemplateColumns: isNarrow ? '1fr' : styles.contentGrid.gridTemplateColumns }}>
          <div>
            <span style={styles.optionLabel}>{t('gtp.setup.teams')}</span>
            <div style={styles.segmentTrack}>
              {teamOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => handleTeamCountChange(count)}
                  style={{
                    ...styles.segment,
                    ...(teamCount === count ? styles.segmentActive : null),
                  }}
                >
                  {count}
                </button>
              ))}
            </div>

            <div style={styles.teamList}>
              {teamNames.map((name, index) => (
                <label key={index} style={styles.teamLabel}>
                  <span style={styles.teamDot}>{index + 1}</span>
                  <input
                    value={name}
                    maxLength={10}
                    onChange={(event) => updateTeamName(index, event.target.value)}
                    onFocus={focusInput}
                    onBlur={blurInput}
                    style={styles.teamInput}
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <div style={styles.optionGroup}>
              <span style={styles.optionLabel}>{t('gtp.setup.gameLength')}</span>
              <div style={styles.segmentTrack}>
                <button
                  onClick={() => setLengthMode('ALL')}
                  style={{
                    ...styles.segment,
                    ...(lengthMode === 'ALL' ? styles.segmentActive : null),
                  }}
                >
                  {t('gtp.setup.all')}
                </button>
                <button
                  onClick={() => setLengthMode('CUSTOM')}
                  style={{
                    ...styles.segment,
                    ...(lengthMode === 'CUSTOM' ? styles.segmentActive : null),
                  }}
                >
                  {t('gtp.setup.number')}
                </button>
              </div>

              {customLengthIsActive && (
                <div style={styles.customInputWrap}>
                  <input
                    type="number"
                    min="1"
                    max={itemCount}
                    value={customLength}
                    onChange={(event) => setCustomLength(event.target.value)}
                    onFocus={focusInput}
                    onBlur={blurInput}
                    placeholder={`1-${itemCount}`}
                    style={{
                      ...styles.customInput,
                      ...(customLengthIsInvalid ? styles.customInputError : null),
                    }}
                  />
                  <span style={customLengthIsInvalid ? styles.hintError : styles.hint}>
                    {customLengthIsInvalid
                      ? customLengthIsEmpty
                        ? t('gtp.setup.enterNumber')
                        : t('gtp.setup.onlyAvailable', { count: itemCount })
                      : t('gtp.setup.maxItems', { count: itemCount })}
                  </span>
                </div>
              )}
            </div>

            <div style={styles.optionGroup}>
              <span style={styles.optionLabel}>{t('gtp.setup.timerPerQuestion')}</span>
              <div style={styles.segmentTrack}>
                {timerOptions.map((option) => (
                  <button
                    key={option.labelKey}
                    onClick={() => setTimerSeconds(option.value)}
                    style={{
                      ...styles.segment,
                      ...(timerSeconds === option.value ? styles.segmentActive : null),
                    }}
                  >
                    {option.value === 0 ? t('gtp.setup.timerOff') : option.labelKey}
                  </button>
                ))}
                <button
                  onClick={() => setTimerSeconds('CUSTOM')}
                  style={{
                    ...styles.segment,
                    ...(customTimerIsActive ? styles.segmentActive : null),
                  }}
                >
                  {t('gtp.setup.custom')}
                </button>
              </div>
              {customTimerIsActive && (
                <div style={styles.customInputWrap}>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={customTimer}
                    onChange={(event) => setCustomTimer(event.target.value)}
                    onFocus={focusInput}
                    onBlur={blurInput}
                    placeholder="10-300"
                    style={{
                      ...styles.customInput,
                      ...(customTimerIsInvalid ? styles.customInputError : null),
                    }}
                  />
                  <span style={customTimerIsInvalid ? styles.hintError : styles.hint}>
                    {customTimerIsInvalid ? t('gtp.setup.timerError') : t('gtp.setup.secondsPerItem')}
                  </span>
                </div>
              )}
            </div>

            <button onClick={() => setShuffle((prev) => !prev)} style={styles.shuffleRow}>
              <span style={styles.shuffleText}>{shuffle ? t('gtp.setup.shuffleOn') : t('gtp.setup.shuffleOff')}</span>
              <span
                style={{
                  ...styles.switchTrack,
                  backgroundColor: shuffle ? '#FFEB00' : '#E2E8F0',
                  boxShadow: shuffle ? 'inset 0 0 0 1.5px #111827' : 'none',
                }}
              >
                <span style={{ ...styles.switchKnob, transform: shuffle ? 'translateX(18px)' : 'translateX(0)' }} />
              </span>
            </button>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!canStart}
          style={{
            ...styles.startButton,
            opacity: !canStart ? 0.5 : 1,
            cursor: !canStart ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(event) => {
            if (!canStart) return;
            event.currentTarget.style.transform = 'translateY(-1px)';
            event.currentTarget.style.boxShadow = 'inset 0 0 0 2px #111827, 0 8px 20px rgba(15,23,42,0.24)';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.transform = 'translateY(0)';
            event.currentTarget.style.boxShadow = styles.startButton.boxShadow;
          }}
        >
          {itemCount === 0 ? t('gtp.setup.noItems') : customLengthIsInvalid ? t('gtp.setup.checkLength') : customTimerIsInvalid ? t('gtp.setup.checkTimer') : t('gtp.setup.startGame')}
        </button>
      </section>
    </div>
  );
}

const styles = {
  page: {
    width: '100%',
    minHeight: 'calc(100vh - 62px)',
    padding: '32px 16px 56px',
    boxSizing: 'border-box',
    fontFamily: MODERN_FONT,
  },
  shell: {
    width: '100%',
    maxWidth: '720px',
    margin: '0 auto',
    borderRadius: '24px',
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(15,23,42,0.06)',
    boxShadow: '0 2px 6px rgba(15,23,42,0.06), 0 16px 40px rgba(15,23,42,0.12)',
    padding: '24px',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    paddingBottom: '18px',
    marginBottom: '20px',
    borderBottom: '1px solid #F1F5F9',
    minWidth: 0,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '5px',
  },
  backButton: {
    flexShrink: 0,
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#F1F5F9',
    color: '#334155',
    fontFamily: MODERN_FONT,
    fontSize: '13px',
    fontWeight: 700,
    padding: '9px 14px',
    cursor: 'pointer',
    transition: 'background-color 0.12s',
  },
  thumbnailWrap: {
    width: '56px',
    height: '56px',
    flexShrink: 0,
    borderRadius: '14px',
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.06)',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  title: {
    margin: 0,
    color: '#0F172A',
    fontFamily: BUBBLY_FONT,
    fontSize: '26px',
    fontWeight: 400,
    lineHeight: 1.1,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemChip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: '999px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  optionGroup: {
    marginBottom: '18px',
  },
  optionLabel: {
    display: 'block',
    marginBottom: '8px',
    color: '#64748B',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
  },
  segmentTrack: {
    display: 'flex',
    gap: '3px',
    padding: '3px',
    borderRadius: '12px',
    backgroundColor: '#F1F5F9',
  },
  segment: {
    flex: 1,
    minWidth: 0,
    border: 'none',
    borderRadius: '9px',
    backgroundColor: 'transparent',
    color: '#64748B',
    fontFamily: MODERN_FONT,
    fontSize: '13px',
    fontWeight: 700,
    padding: '8px 2px',
    cursor: 'pointer',
    transition: 'background-color 0.14s, color 0.14s, box-shadow 0.14s',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  segmentActive: {
    backgroundColor: '#FFEB00',
    color: '#111827',
    fontWeight: 800,
    boxShadow: 'inset 0 0 0 1.5px #111827, 0 2px 5px rgba(15,23,42,0.22)',
  },
  teamList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '14px',
  },
  teamLabel: {
    display: 'grid',
    gridTemplateColumns: '26px minmax(0, 1fr)',
    alignItems: 'center',
    gap: '10px',
  },
  teamDot: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: '#FFEB00',
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 800,
    boxSizing: 'border-box',
    boxShadow: 'inset 0 0 0 1.5px #111827',
  },
  teamInput: {
    width: '100%',
    border: '1.5px solid #E2E8F0',
    borderRadius: '10px',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    boxSizing: 'border-box',
    fontFamily: MODERN_FONT,
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.3px',
    padding: '9px 12px',
    outline: 'none',
    transition: 'border-color 0.12s, background-color 0.12s',
  },
  customInputWrap: {
    display: 'grid',
    gridTemplateColumns: '86px minmax(0, 1fr)',
    alignItems: 'center',
    gap: '10px',
    marginTop: '10px',
  },
  customInput: {
    width: '100%',
    border: '1.5px solid #E2E8F0',
    borderRadius: '10px',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    boxSizing: 'border-box',
    fontFamily: MODERN_FONT,
    fontSize: '15px',
    fontWeight: 700,
    padding: '8px 10px',
    outline: 'none',
    transition: 'border-color 0.12s, background-color 0.12s',
  },
  customInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  hint: {
    color: '#94A3B8',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.35,
  },
  hintError: {
    color: '#DC2626',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.35,
  },
  shuffleRow: {
    width: '100%',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 14px',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  shuffleText: {
    fontFamily: MODERN_FONT,
    fontSize: '14px',
    fontWeight: 700,
    color: '#334155',
  },
  switchTrack: {
    width: '42px',
    height: '24px',
    borderRadius: '999px',
    padding: '3px',
    boxSizing: 'border-box',
    flexShrink: 0,
    transition: 'background-color 0.16s',
  },
  switchKnob: {
    display: 'block',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(15,23,42,0.3)',
    transition: 'transform 0.16s ease',
  },
  startButton: {
    display: 'block',
    margin: '22px auto 0',
    minWidth: '240px',
    border: 'none',
    borderRadius: '999px',
    backgroundColor: '#FFEB00',
    color: '#111827',
    boxShadow: 'inset 0 0 0 2px #111827, 0 4px 12px rgba(15,23,42,0.18)',
    fontFamily: BUBBLY_FONT,
    fontSize: '20px',
    letterSpacing: '0.5px',
    padding: '13px 44px',
    cursor: 'pointer',
    transition: 'transform 0.12s, box-shadow 0.12s',
  },
};
