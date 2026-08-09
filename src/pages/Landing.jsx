import { Link } from 'react-router-dom';
import './Landing.css';

const games = [
  {
    title: 'QUIZ-BOP',
    subtitle: 'Fast team quiz rounds',
    image: '/thumbnails/quiz_bop_2x1.jpg',
    route: '/quiz',
    color: '#fbbf24',
  },
  {
    title: 'CLASS FEUD',
    subtitle: 'Top answers win',
    image: '/thumbnails/class_fued.jpg',
    route: '/class-feud',
    color: '#6d28d9',
  },
  {
    title: 'LYRICS PLAY',
    subtitle: 'Learn through music',
    image: '/thumbnails/lyrics_play.jpg',
    route: '/lyrics-play',
    color: '#f45b9a',
  },
  {
    title: 'BINGO',
    subtitle: 'Print in seconds',
    image: '/thumbnails/bingo.jpg',
    route: '/bingo',
    color: '#2684ff',
  },
];

const stats = [
  { icon: 'smile', title: 'Loved by teachers', text: 'in 100+ countries' },
  { icon: 'group', title: '10M+', text: 'Games played' },
  { icon: 'check', title: 'Built for classrooms', text: 'Safe & ad-free' },
  { icon: 'heart', title: 'Made with teachers', text: 'for teachers' },
];

function Icon({ name }) {
  const artwork = {
    bolt: <path d="M13.1 1.8 5.8 12.4h5l-1 9.8 8.4-12.6H13l.1-7.8Z" fill="currentColor" />,
    users: (
      <>
        <circle cx="8.7" cy="8" r="3.1" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path d="M3.1 19.6c.3-4 2.2-6 5.6-6s5.3 2 5.6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
        <path d="M15.4 5.3a3.1 3.1 0 0 1 0 5.8M16.2 13.8c2.7.6 4.2 2.5 4.5 5.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" strokeWidth="2.15" />
        <path d="M12 7.1v5l3.5 2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.15" />
        <circle cx="12" cy="12" r="1.15" fill="currentColor" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="7.2" r="4.1" fill="currentColor" />
        <path d="M4.7 21c.4-5.6 3-8.2 7.3-8.2s6.9 2.6 7.3 8.2H4.7Z" fill="currentColor" />
      </>
    ),
    star: <path d="m12 1.7 3.1 6.1 6.8 1-4.9 4.8 1.2 6.7-6.2-3.2-6.1 3.2 1.2-6.7-5-4.8 6.8-1L12 1.7Z" fill="currentColor" />,
    smile: (
      <>
        <circle cx="8.6" cy="9" r="1.35" fill="currentColor" />
        <circle cx="15.4" cy="9" r="1.35" fill="currentColor" />
        <path d="M6.7 13.2c1.2 2.2 3 3.3 5.3 3.3s4.1-1.1 5.3-3.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.1" />
      </>
    ),
    group: (
      <>
        <circle cx="8.2" cy="7.5" r="3" fill="currentColor" />
        <circle cx="16" cy="7.5" r="3" fill="currentColor" opacity=".85" />
        <path d="M2.8 19c.3-4 2.2-6.1 5.4-6.1s5.1 2.1 5.4 6.1H2.8Z" fill="currentColor" />
        <path d="M10.5 19c.3-4 2.2-6.1 5.4-6.1s5.1 2.1 5.4 6.1H10.5Z" fill="currentColor" opacity=".85" />
      </>
    ),
    check: <path d="m5 12.4 4.3 4.3L19.4 6.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />,
    heart: <path d="M12 21.2 3.3 13C-1.9 7.9 1.7 1.7 7 2.8A6.4 6.4 0 0 1 12 6a6.4 6.4 0 0 1 5-3.2c5.3-1.1 8.9 5.1 3.7 10.2L12 21.2Z" fill="currentColor" />,
  };

  return (
    <span className={`landing-icon landing-icon-${name}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">{artwork[name]}</svg>
    </span>
  );
}

export default function Landing() {
  return (
    <div className="landing-page">
      <section className="landing-hero" aria-label="Classbop landing hero">
        <div className="landing-hero-copy">
          <p className="landing-kicker">NO-PREP. ALL FUN. ZERO SETUP.</p>
          <h1>
            Engage your class
            <span>in <em>seconds.</em></span>
          </h1>
          <p className="landing-subtitle">
            Open a game on the classroom screen
            <span>and keep the room moving and smiling.</span>
          </p>
          <div className="landing-actions" aria-label="Landing actions">
            <Link className="landing-button landing-button-primary" to="/games">
              <span className="landing-play-symbol" aria-hidden="true" />
              Play a Game
            </Link>
            <Link className="landing-button landing-button-secondary" to="/auth?mode=signup">
              <Icon name="person" />
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-games" aria-label="Popular games">
        <div className="landing-section-head landing-section-head-overlay">
          <div className="landing-section-title">
            <Icon name="star" />
            <h2>Popular Games</h2>
            <svg className="landing-title-swoosh" viewBox="0 0 160 18" preserveAspectRatio="none" aria-hidden="true">
              <path d="M5 12 C42 7 94 8 155 6" />
            </svg>
          </div>
          <Link className="landing-view-all" to="/games">
            View all games
            <span aria-hidden="true">›</span>
          </Link>
        </div>

        <div className="landing-game-grid">
          {games.map((game) => (
            <Link className="landing-game-card" to={game.route} key={game.title}>
              <img src={game.image} alt="" draggable="false" />
              <div className="landing-game-meta">
                <strong>{game.subtitle}</strong>
                <span style={{ '--game-color': game.color }} aria-hidden="true">›</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="landing-stats" aria-label="Classbop stats">
          {stats.map((item) => (
            <div className="landing-stat" key={item.title}>
              <Icon name={item.icon} />
              <div>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="landing-corner-decoration landing-corner-left" aria-hidden="true">
        <span className="landing-corner-mark landing-corner-mark-one" />
        <span className="landing-corner-mark landing-corner-mark-two" />
        <span className="landing-corner-mark landing-corner-mark-three" />
      </div>

      <div className="landing-corner-decoration landing-corner-right" aria-hidden="true">
        <svg className="landing-corner-pink" viewBox="0 0 160 330" focusable="false">
          <path d="M150 317 28 46c-5-11 7-21 17-15l111 62" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="28" />
        </svg>
        <svg className="landing-corner-squiggle" viewBox="0 0 92 58" focusable="false">
          <path d="M4 39c10 0 7-25 17-25s5 32 16 32 11-32 22-32 8 25 17 25 7-15 12-15" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="9" />
        </svg>
        <span className="landing-corner-star" />
        <span className="landing-corner-dot" />
      </div>
    </div>
  );
}
