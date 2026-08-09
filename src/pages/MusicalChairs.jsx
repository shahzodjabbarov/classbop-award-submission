import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MusicalChairs.css';

const MIN_STUDENTS = 2;
const MAX_STUDENTS = 20;
const MIN_STOP_MS = 5000;
const MAX_STOP_MS = 20000;
const MUSIC_SRC = '/quiz_media/tunetank-kids-logo-483655.mp3';
const STOP_SOUND_SRC = '/quiz_media/incorrect-answer.mp3';
const WIN_SOUND_SRC = '/gtp_media/winner.mp3';
const STUDENT_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];
const CHAIR_COLORS = ['#f97316', '#22c55e', '#a78bfa', '#f43f5e', '#06b6d4', '#eab308'];

function clampStudentCount(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return MIN_STUDENTS;
  return Math.min(MAX_STUDENTS, Math.max(MIN_STUDENTS, Math.round(numberValue)));
}

function makeStudents(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `student-${index + 1}`,
    number: index + 1,
    color: STUDENT_COLORS[index % STUDENT_COLORS.length],
  }));
}

function randomStopDelay() {
  return Math.floor(MIN_STOP_MS + Math.random() * (MAX_STOP_MS - MIN_STOP_MS + 1));
}

function pickRandomStudent(students) {
  return students[Math.floor(Math.random() * students.length)];
}

export default function MusicalChairs() {
  const navigate = useNavigate();
  const [studentCount, setStudentCount] = useState(8);
  const [students, setStudents] = useState(() => makeStudents(8));
  const [round, setRound] = useState(1);
  const [status, setStatus] = useState('setup');
  const [eliminatedStudent, setEliminatedStudent] = useState(null);
  const [message, setMessage] = useState('Choose the number of students.');
  const timerRef = useRef(null);
  const musicRef = useRef(null);
  const stopAudioRef = useRef(null);
  const winAudioRef = useRef(null);

  const chairCount = Math.max(0, students.length - 1);
  const isRunning = status === 'running';
  const isStopped = status === 'stopped';
  const isFinished = status === 'finished';

  const chairs = useMemo(() => (
    Array.from({ length: chairCount }, (_, index) => ({
      id: `chair-${round}-${index + 1}`,
      color: CHAIR_COLORS[index % CHAIR_COLORS.length],
    }))
  ), [chairCount, round]);

  const clearRoundTimer = () => {
    if (!timerRef.current) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const playSound = (audioRef) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  const stopMusic = () => {
    const music = musicRef.current;
    if (!music) return;
    music.pause();
    music.currentTime = 0;
  };

  const startRound = (nextStudents = students, nextRound = round) => {
    if (nextStudents.length <= 1) {
      setStatus('finished');
      setMessage(`Student ${nextStudents[0]?.number || 1} wins!`);
      playSound(winAudioRef);
      return;
    }

    clearRoundTimer();
    setStudents(nextStudents);
    setRound(nextRound);
    setEliminatedStudent(null);
    setStatus('running');
    setMessage(`Round ${nextRound}: music is playing.`);

    const music = musicRef.current;
    if (music) {
      music.currentTime = 0;
      music.loop = true;
      music.play().catch(() => {});
    }
  };

  const handleStartGame = () => {
    const count = clampStudentCount(studentCount);
    const nextStudents = makeStudents(count);
    setStudentCount(count);
    startRound(nextStudents, 1);
  };

  const handleContinue = () => {
    if (!eliminatedStudent) return;
    const nextStudents = students.filter((student) => student.id !== eliminatedStudent.id);
    const nextRound = round + 1;

    if (nextStudents.length === 1) {
      setStudents(nextStudents);
      setEliminatedStudent(null);
      setRound(nextRound);
      setStatus('finished');
      setMessage(`Student ${nextStudents[0].number} wins!`);
      playSound(winAudioRef);
      return;
    }

    startRound(nextStudents, nextRound);
  };

  const handleReset = () => {
    clearRoundTimer();
    stopMusic();
    setStudents(makeStudents(studentCount));
    setRound(1);
    setEliminatedStudent(null);
    setStatus('setup');
    setMessage('Choose the number of students.');
  };

  useEffect(() => {
    if (!isRunning) return undefined;

    clearRoundTimer();
    timerRef.current = window.setTimeout(() => {
      const chosenStudent = pickRandomStudent(students);
      const music = musicRef.current;
      const stopAudio = stopAudioRef.current;

      if (music) {
        music.pause();
        music.currentTime = 0;
      }

      if (stopAudio) {
        stopAudio.currentTime = 0;
        stopAudio.play().catch(() => {});
      }

      setEliminatedStudent(chosenStudent);
      setStatus('stopped');
      setMessage(`Music stopped. Student ${chosenStudent.number} is out.`);
      timerRef.current = null;
    }, randomStopDelay());

    return clearRoundTimer;
  }, [isRunning, students]);

  useEffect(() => () => {
    clearRoundTimer();
    stopMusic();
  }, []);

  return (
    <div className="musical-page">
      <audio ref={musicRef} src={MUSIC_SRC} preload="auto" />
      <audio ref={stopAudioRef} src={STOP_SOUND_SRC} preload="auto" />
      <audio ref={winAudioRef} src={WIN_SOUND_SRC} preload="auto" />

      <header className="musical-topbar">
        <button type="button" className="musical-button musical-button-light" onClick={() => navigate('/games')}>
          Games
        </button>
        <div className="musical-title-lockup">
          <p>Classroom movement</p>
          <h1>Musical Chairs</h1>
        </div>
        <button type="button" className="musical-button musical-button-light" onClick={handleReset}>
          Setup
        </button>
      </header>

      {status === 'setup' ? (
        <main className="musical-setup" aria-label="Musical Chairs setup">
          <section className="musical-setup-panel">
            <label htmlFor="musical-student-count">Students</label>
            <div className="musical-count-row">
              <button type="button" onClick={() => setStudentCount((count) => clampStudentCount(count - 1))}>-</button>
              <input
                id="musical-student-count"
                type="number"
                min={MIN_STUDENTS}
                max={MAX_STUDENTS}
                value={studentCount}
                onChange={(event) => setStudentCount(clampStudentCount(event.target.value))}
              />
              <button type="button" onClick={() => setStudentCount((count) => clampStudentCount(count + 1))}>+</button>
            </div>
            <p className="musical-setup-note">{studentCount - 1} chairs will appear for the first round.</p>
            <button type="button" className="musical-start-button" onClick={handleStartGame}>
              Start Music
            </button>
          </section>
        </main>
      ) : (
        <main className={`musical-game musical-game-${status}`} aria-label="Musical Chairs game">
          <section className={`musical-stage ${isRunning ? 'is-running' : ''}`}>
            <div className="musical-stage-labels">
              <span>{students.length} students</span>
              <span>{chairCount} chairs</span>
              <span>Round {round}</span>
            </div>

            <div className="musical-arena">
              <div className="musical-center-disc">
                <strong>{isRunning ? 'Music' : isStopped ? 'Stop' : 'Winner'}</strong>
                <span>{isRunning ? '5-20s' : isStopped ? 'Sit down' : 'Done'}</span>
              </div>

              {chairs.map((chair, index) => {
                const angle = (360 / Math.max(chairCount, 1)) * index;
                return (
                  <div
                    key={chair.id}
                    className="musical-chair-position"
                    style={{ '--angle': `${angle}deg`, '--chair-color': chair.color }}
                  >
                    <div className="musical-chair" />
                  </div>
                );
              })}

              {students.map((student, index) => {
                const angle = (360 / students.length) * index;
                const isEliminated = eliminatedStudent?.id === student.id;
                const isWinner = isFinished;
                return (
                  <div
                    key={student.id}
                    className={[
                      'musical-student-position',
                      isEliminated ? 'is-eliminated' : '',
                      isStopped && !isEliminated ? 'is-seated' : '',
                      isWinner ? 'is-winner' : '',
                    ].filter(Boolean).join(' ')}
                    style={{ '--angle': `${angle}deg`, '--student-color': student.color }}
                  >
                    <div className="musical-student">
                      <span className="musical-student-head" />
                      <span className="musical-student-body">{student.number}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="musical-control-panel">
            <p className="musical-status">{message}</p>
            <div className="musical-action-stack">
              {isStopped && (
                <button type="button" className="musical-start-button" onClick={handleContinue}>
                  Continue
                </button>
              )}
              {isFinished && (
                <button type="button" className="musical-start-button" onClick={handleReset}>
                  New Game
                </button>
              )}
              {isRunning && (
                <button
                  type="button"
                  className="musical-button musical-button-yellow"
                  onClick={() => {
                    const chosenStudent = pickRandomStudent(students);
                    clearRoundTimer();
                    stopMusic();
                    playSound(stopAudioRef);
                    setEliminatedStudent(chosenStudent);
                    setStatus('stopped');
                    setMessage(`Music stopped. Student ${chosenStudent.number} is out.`);
                  }}
                >
                  Stop Now
                </button>
              )}
              <button type="button" className="musical-button musical-button-light" onClick={handleReset}>
                Reset
              </button>
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}
