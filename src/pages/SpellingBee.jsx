import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SpellingBee.css';

const WORD_BANK = [
  'apple', 'banana', 'camera', 'doctor', 'elephant', 'flower', 'guitar', 'holiday',
  'island', 'jacket', 'kitchen', 'library', 'monster', 'notebook', 'orange', 'penguin',
  'question', 'rainbow', 'sandwich', 'teacher', 'umbrella', 'volcano', 'window', 'yellow',
  'zebra', 'basketball', 'chocolate', 'dinosaur', 'favorite', 'homework', 'language',
  'mountain', 'popcorn', 'restaurant', 'sunshine', 'telephone', 'watermelon',
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const CORRECT_SOUND = '/quiz_media/correct-answer.mp3';
const WRONG_SOUND = '/quiz_media/incorrect-answer.mp3';
const WIN_SOUND = '/gtp_media/winner.mp3';

const SPOKEN_LETTERS = {
  a: 'a',
  ay: 'a',
  b: 'b',
  be: 'b',
  bee: 'b',
  c: 'c',
  sea: 'c',
  see: 'c',
  d: 'd',
  dee: 'd',
  e: 'e',
  ee: 'e',
  f: 'f',
  ef: 'f',
  eff: 'f',
  g: 'g',
  gee: 'g',
  h: 'h',
  aitch: 'h',
  i: 'i',
  eye: 'i',
  j: 'j',
  jay: 'j',
  k: 'k',
  kay: 'k',
  l: 'l',
  el: 'l',
  ell: 'l',
  m: 'm',
  em: 'm',
  n: 'n',
  en: 'n',
  o: 'o',
  oh: 'o',
  p: 'p',
  pea: 'p',
  pee: 'p',
  q: 'q',
  cue: 'q',
  queue: 'q',
  r: 'r',
  are: 'r',
  s: 's',
  ess: 's',
  t: 't',
  tea: 't',
  tee: 't',
  u: 'u',
  you: 'u',
  v: 'v',
  vee: 'v',
  w: 'w',
  doubleu: 'w',
  x: 'x',
  ex: 'x',
  y: 'y',
  why: 'y',
  z: 'z',
  zed: 'z',
  zee: 'z',
};

function getRandomWord() {
  const index = Math.floor(Math.random() * WORD_BANK.length);
  return WORD_BANK[index];
}

function normalizeWord(value) {
  return value.replace(/[^a-z]/gi, '').toLowerCase();
}

function buildLetters(word) {
  return normalizeWord(word).split('');
}

function parseSpokenLetters(value) {
  const compact = normalizeWord(value);
  const tokens = String(value)
    .toLowerCase()
    .replace(/double\s+you/g, 'doubleu')
    .replace(/[^a-z]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const mapped = tokens.map((token) => SPOKEN_LETTERS[token]).join('');
  return Array.from(new Set([compact, mapped].filter(Boolean)));
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3.5M8.5 21.5h7" />
    </svg>
  );
}

function useSpeechSpelling({ onInterim, onFinalResult }) {
  const recognitionRef = useRef(null);
  const callbacksRef = useRef({ onInterim, onFinalResult });
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState('');

  useEffect(() => {
    callbacksRef.current = { onInterim, onFinalResult };
  });

  const isSupported = typeof window !== 'undefined'
    && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    if (!isSupported) {
      setMicError('This browser cannot listen. Chrome works best, or use the letter buttons.');
      return;
    }

    if (recognitionRef.current) {
      stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 5;

    recognition.onresult = (event) => {
      let interim = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) {
          const alternatives = Array.from(result).map((option) => option.transcript);
          callbacksRef.current.onFinalResult?.(transcript, alternatives);
        } else {
          interim += transcript;
        }
      }
      if (interim) callbacksRef.current.onInterim?.(interim);
    };

    recognition.onerror = (event) => {
      setMicError(event.error === 'not-allowed'
        ? 'Microphone blocked. Allow mic access in the browser, or use the letter buttons.'
        : 'The microphone did not catch that. Try again or use the letter buttons.');
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setMicError('');
    setIsListening(true);
    recognition.start();
  }, [isSupported, stop]);

  useEffect(() => () => {
    recognitionRef.current?.abort?.();
    recognitionRef.current = null;
  }, []);

  return { isSupported, isListening, micError, start, stop };
}

export default function SpellingBee() {
  const navigate = useNavigate();
  const [setupWord, setSetupWord] = useState(getRandomWord);
  const [lifeCount, setLifeCount] = useState(3);
  const [gameWord, setGameWord] = useState(() => normalizeWord(setupWord));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [status, setStatus] = useState('setup');
  const [message, setMessage] = useState('Choose a word and lives.');
  const [heardSpelling, setHeardSpelling] = useState('');
  const correctAudioRef = useRef(null);
  const wrongAudioRef = useRef(null);
  const winAudioRef = useRef(null);

  const letters = useMemo(() => buildLetters(gameWord), [gameWord]);
  const heartsLeft = Math.max(0, lifeCount - mistakes);
  const canPlay = status === 'playing';

  const playSound = (audioRef) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  const startGame = () => {
    const nextWord = normalizeWord(setupWord) || getRandomWord();
    setGameWord(nextWord);
    setSetupWord(nextWord);
    setCurrentIndex(0);
    setMistakes(0);
    setStatus('playing');
    setHeardSpelling('');
    setMessage('Listen, press letters, or use the microphone.');
  };

  const randomizeSetupWord = () => {
    const nextWord = getRandomWord();
    setSetupWord(nextWord);
    setMessage('New word ready.');
  };

  const resetRound = () => {
    setCurrentIndex(0);
    setMistakes(0);
    setStatus('playing');
    setHeardSpelling('');
    setMessage('Try the same word again.');
  };

  const goToSetup = () => {
    setStatus('setup');
    setHeardSpelling('');
    setMessage('Choose a word and lives.');
  };

  const handleGuess = (letter) => {
    if (!canPlay || !letter || !/^[a-z]$/i.test(letter)) return;

    const guess = letter.toLowerCase();
    const expected = letters[currentIndex];

    if (guess === expected) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      playSound(nextIndex === letters.length ? winAudioRef : correctAudioRef);

      if (nextIndex === letters.length) {
        setStatus('won');
        setMessage('Perfect spelling!');
      } else {
        setMessage(`${guess.toUpperCase()} is correct.`);
      }
      return;
    }

    const nextMistakes = mistakes + 1;
    setMistakes(nextMistakes);
    playSound(wrongAudioRef);

    if (nextMistakes >= lifeCount) {
      setStatus('lost');
      setMessage(`Game over. The word was ${gameWord.toUpperCase()}.`);
    } else {
      setMessage(`${guess.toUpperCase()} is not next.`);
    }
  };

  const submitSpokenSpelling = useCallback((transcript, alternatives = []) => {
    if (!canPlay) return;

    const candidates = [transcript, ...alternatives].flatMap(parseSpokenLetters);
    const heard = transcript.trim();
    setHeardSpelling(heard);

    if (candidates.includes(gameWord)) {
      setCurrentIndex(letters.length);
      setStatus('won');
      setMessage(`Correct. ${gameWord.toUpperCase()}!`);
      playSound(winAudioRef);
      return;
    }

    const nextMistakes = mistakes + 1;
    setMistakes(nextMistakes);
    playSound(wrongAudioRef);

    if (nextMistakes >= lifeCount) {
      setStatus('lost');
      setMessage(`Not quite. The word was ${gameWord.toUpperCase()}.`);
    } else {
      setMessage(heard ? `Heard "${heard}". Try spelling it again.` : 'Try spelling it again.');
    }
  }, [canPlay, gameWord, letters.length, lifeCount, mistakes]);

  const speech = useSpeechSpelling({
    onInterim: setHeardSpelling,
    onFinalResult: submitSpokenSpelling,
  });

  useEffect(() => {
    if (!canPlay && speech.isListening) speech.stop();
  }, [canPlay, speech]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Enter' && status === 'setup') {
        startGame();
        return;
      }
      if (event.key === 'Escape') {
        goToSetup();
        return;
      }
      handleGuess(event.key);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="spelling-page">
      <audio ref={correctAudioRef} src={CORRECT_SOUND} preload="auto" />
      <audio ref={wrongAudioRef} src={WRONG_SOUND} preload="auto" />
      <audio ref={winAudioRef} src={WIN_SOUND} preload="auto" />

      <header className="spelling-topbar">
        <button type="button" className="spelling-button spelling-button-light" onClick={() => navigate('/games')}>
          Games
        </button>
        <div className="spelling-title-lockup">
          <p>Classroom spelling</p>
          <h1>Spelling Bee</h1>
        </div>
        <button type="button" className="spelling-button spelling-button-light" onClick={goToSetup}>
          Setup
        </button>
      </header>

      {status === 'setup' ? (
        <main className="spelling-setup" aria-label="Spelling Bee setup">
          <section className="spelling-setup-panel">
            <label htmlFor="spelling-word">Word</label>
            <div className="spelling-word-row">
              <input
                id="spelling-word"
                value={setupWord}
                onChange={(event) => setSetupWord(event.target.value)}
                placeholder="watermelon"
                spellCheck="false"
              />
              <button type="button" className="spelling-icon-button" onClick={randomizeSetupWord} aria-label="Random word">
                ?
              </button>
            </div>

            <fieldset className="spelling-lives-field">
              <legend>Lives</legend>
              <div className="spelling-life-options">
                {[1, 2, 3, 4, 5, 6].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={value === lifeCount ? 'is-selected' : ''}
                    onClick={() => setLifeCount(value)}
                    aria-pressed={value === lifeCount}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>

            <button type="button" className="spelling-start-button" onClick={startGame}>
              Start
            </button>
          </section>
        </main>
      ) : (
        <main className={`spelling-game spelling-game-${status}`} aria-label="Spelling Bee game">
          <section className="spelling-board">
            <div className="spelling-hearts" aria-label={`${heartsLeft} lives left`}>
              {Array.from({ length: lifeCount }, (_, index) => (
                <span key={index} className={index < heartsLeft ? 'is-alive' : 'is-gone'}>
                  heart
                </span>
              ))}
            </div>

            <div className="spelling-word-display" aria-label={gameWord}>
              {letters.map((letter, index) => {
                let className = 'spelling-letter';
                if (index < currentIndex) className += ' is-correct';
                if (index === currentIndex && status === 'playing') className += ' is-current';
                return (
                  <span key={`${letter}-${index}`} className={className}>
                    {letter}
                  </span>
                );
              })}
            </div>

            <p className="spelling-message">{message}</p>
          </section>

          <section className="spelling-controls" aria-label="Teacher controls">
            <div className="spelling-keyboard">
              {LETTERS.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  disabled={!canPlay}
                  onClick={() => handleGuess(letter)}
                >
                  {letter}
                </button>
              ))}
            </div>

            <div className="spelling-mic-card">
              <button
                type="button"
                className={`spelling-mic-button${speech.isListening ? ' is-listening' : ''}`}
                onClick={speech.isListening ? speech.stop : speech.start}
                disabled={!canPlay}
                aria-label={speech.isListening ? 'Stop listening' : 'Spell with your voice'}
                aria-pressed={speech.isListening}
              >
                <MicIcon />
              </button>
              <div>
                <strong>{speech.isListening ? 'Listening' : 'Voice spell'}</strong>
                <span>{heardSpelling || (speech.isSupported ? 'Say the letters or the word' : 'Chrome works best')}</span>
              </div>
            </div>
            {speech.micError && <p className="spelling-mic-error">{speech.micError}</p>}

            <div className="spelling-action-row">
              <button type="button" className="spelling-button spelling-button-light" onClick={resetRound}>
                Again
              </button>
              <button type="button" className="spelling-button spelling-button-yellow" onClick={goToSetup}>
                New Word
              </button>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
