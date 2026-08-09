import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import RequireAuth from './auth/RequireAuth';
import { I18nProvider } from './i18n/I18nProvider';
import { useI18n } from './i18n/useI18n';
import Navbar from './components/Navbar';
import MenuBackdrop from './components/MenuBackdrop';
import bgImage from './assets/bg.jpg';
import classFeudBackground from './assets/class-feud/class-feud-background.png';

const Activities = lazy(() => import('./pages/Activities'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const BingoGame = lazy(() => import('./pages/BingoGame'));
const BingoMenu = lazy(() => import('./pages/BingoMenu'));
const ClassFeud = lazy(() => import('./pages/ClassFeud'));
const ClassFeudBuilder = lazy(() => import('./pages/ClassFeudBuilder'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const CrosswordMaker = lazy(() => import('./pages/CrosswordMaker'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Game = lazy(() => import('./pages/Game'));
const GtpBuilder = lazy(() => import('./pages/GtpBuilder'));
const GtpMenu = lazy(() => import('./pages/GtpMenu'));
const Landing = lazy(() => import('./pages/Landing'));
const LyricsPlay = lazy(() => import('./pages/LyricsPlay'));
const MusicalChairs = lazy(() => import('./pages/MusicalChairs'));
const PictionaryBuilder = lazy(() => import('./pages/PictionaryBuilder'));
const PictionaryControl = lazy(() => import('./pages/Pictionary').then((module) => ({ default: module.PictionaryControl })));
const PictionaryLanding = lazy(() => import('./pages/Pictionary').then((module) => ({ default: module.PictionaryLanding })));
const PictionaryLive = lazy(() => import('./pages/Pictionary').then((module) => ({ default: module.PictionaryLive })));
const PictionaryModeSelect = lazy(() => import('./pages/Pictionary').then((module) => ({ default: module.PictionaryModeSelect })));
const Profile = lazy(() => import('./pages/Profile'));
const Quiz = lazy(() => import('./pages/Quiz'));
const QuizBuilder = lazy(() => import('./pages/QuizBuilder'));
const QuizGenerator = lazy(() => import('./pages/QuizGenerator'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const SpellingBee = lazy(() => import('./pages/SpellingBee'));
const Tools = lazy(() => import('./pages/Tools'));
const WordSearchMaker = lazy(() => import('./pages/WordSearchMaker'));

// =========================================================================
// 🛠️ THE MASTER TWEAKING ZONE: APP CONTROLLER 🛠️
// =========================================================================
const APP_BG_STYLE = {
  backgroundImage: `url(${bgImage})`,
  backgroundColor: '#7BC8E8',
  backgroundSize: 'cover',          // 👈 fills the full screen, everything visible
  backgroundPosition: 'top center',
  backgroundRepeat: 'no-repeat',    // 👈 no tiling needed since cover fills it
  backgroundAttachment: 'fixed',    // 👈 stays still while you scroll
  minHeight: '100vh',
  width: '100%',
  boxSizing: 'border-box',
  margin: 0,
  padding: 0
};

const LANDING_BG_STYLE = {
  backgroundColor: '#ffffff',
  backgroundImage: 'none',
  minHeight: '100vh',
  width: '100%',
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
};

// Every menu and creator screen sits on the cream <MenuBackdrop /> instead of
// the sky artwork. Live game boards keep their game-specific presentation.
const MENU_ROUTE_PATTERNS = [
  /^\/auth$/,
  /^\/games$/,
  /^\/activities$/,
  /^\/tools$/,
  /^\/profile$/,
  /^\/complete-profile$/,
  /^\/gtp-menu$/,
  /^\/gtp-build$/,
  /^\/bingo$/,
  /^\/class-feud$/,
  /^\/class-feud\/(?:create|edit\/[^/]+)$/,
  /^\/class-feud\/(?!create$|edit\/)[^/]+$/,
  /^\/quiz\/(?:create|generate)$/,
  /^\/quiz\/edit\/[^/]+$/,
  /^\/pictionary$/,
  /^\/pictionary\/(?:create|edit\/[^/]+)$/,
  /^\/pictionary\/(?!create$|edit\/|control\/)[^/]+$/, // category mode select
  /^\/spelling-bee$/,
  /^\/musical-chairs$/,
  /^\/lyrics-play$/,
  /^\/crossword-maker$/,
  /^\/word-search-maker$/,
];

const isMenuPath = (pathname) => MENU_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));

const MENU_BG_STYLE = {
  position: 'relative',
  backgroundColor: '#faf7f0',
  backgroundImage: 'none',
  minHeight: '100vh',
  width: '100%',
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
};

const CLASS_FEUD_BG_STYLE = {
  position: 'relative',
  backgroundColor: '#756de5',
  backgroundImage: `url(${classFeudBackground})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
  minHeight: '100vh',
  width: '100%',
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
};
// =========================================================================

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <link rel="preload" as="image" href={bgImage} />
          <AppFrame />
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

function AppFrame() {
  const location = useLocation();
  const { t } = useI18n();
  const [hideQuizPlayNavbar, setHideQuizPlayNavbar] = useState(false);
  const isMenuRoute = isMenuPath(location.pathname);
  const isClassFeudRoute = location.pathname.startsWith('/class-feud');
  const isClassFeudPlaying = isClassFeudRoute && hideQuizPlayNavbar;
  const appStyle = location.pathname === '/'
    ? LANDING_BG_STYLE
    : isClassFeudPlaying ? CLASS_FEUD_BG_STYLE
      : isMenuRoute ? MENU_BG_STYLE : APP_BG_STYLE;
  // Quiz-Bop and Class Feud both raise `classbop:quiz-play-navbar` once a game
  // is actually running, so the board gets the whole screen.
  const isPlayRoute = location.pathname.startsWith('/quiz') || location.pathname.startsWith('/class-feud');
  const hideNavbar = location.pathname.startsWith('/pictionary/control')
    || (isPlayRoute && hideQuizPlayNavbar);

  useEffect(() => {
    const handleQuizPlayNavbar = (event) => {
      setHideQuizPlayNavbar(Boolean(event.detail?.hidden));
    };

    window.addEventListener('classbop:quiz-play-navbar', handleQuizPlayNavbar);
    return () => window.removeEventListener('classbop:quiz-play-navbar', handleQuizPlayNavbar);
  }, []);

  return (
    <div style={appStyle}>
      {isMenuRoute && !isClassFeudPlaying && <MenuBackdrop />}
      {!hideNavbar && <Navbar />}

      <main style={(isMenuRoute || isClassFeudRoute) ? { ...styles.mainContent, position: 'relative', zIndex: 1 } : styles.mainContent}>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/games" element={<Dashboard />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/classes" element={<Placeholder label={t('routes.classesPlaceholder')} />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="/gtp-menu" element={<GtpMenu />} />
            <Route path="/gtp-build" element={<RequireAuth><GtpBuilder /></RequireAuth>} />
            <Route path="/gtp-play/:matchId" element={<Game />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/quiz/create" element={<RequireAuth><QuizBuilder /></RequireAuth>} />
            <Route path="/quiz/generate" element={<RequireAuth><QuizGenerator /></RequireAuth>} />
            <Route path="/quiz/edit/:matchId" element={<RequireAuth><QuizBuilder /></RequireAuth>} />
            <Route path="/quiz/:matchId" element={<Quiz />} />
            <Route path="/class-feud" element={<ClassFeud />} />
            <Route path="/class-feud/create" element={<RequireAuth><ClassFeudBuilder /></RequireAuth>} />
            <Route path="/class-feud/edit/:boardId" element={<RequireAuth><ClassFeudBuilder /></RequireAuth>} />
            <Route path="/class-feud/:boardId" element={<ClassFeud />} />
            <Route path="/bingo" element={<BingoMenu />} />
            <Route path="/bingo/:gameId" element={<BingoGame />} />
            <Route path="/crossword-maker" element={<CrosswordMaker />} />
            <Route path="/word-search-maker" element={<WordSearchMaker />} />
            <Route path="/lyrics-play" element={<LyricsPlay />} />
            <Route path="/musical-chairs" element={<MusicalChairs />} />
            <Route path="/pictionary" element={<PictionaryLanding />} />
            <Route path="/pictionary/create" element={<RequireAuth><PictionaryBuilder /></RequireAuth>} />
            <Route path="/pictionary/edit/:categoryId" element={<RequireAuth><PictionaryBuilder /></RequireAuth>} />
            <Route path="/pictionary/control/:sessionId" element={<PictionaryControl />} />
            <Route path="/pictionary/:categoryId" element={<PictionaryModeSelect />} />
            <Route path="/pictionary/:categoryId/qr" element={<PictionaryLive />} />
            <Route path="/spelling-bee" element={<SpellingBee />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function Placeholder({ label }) {
  return <div style={styles.placeholder}>{label}</div>;
}

const styles = {
  mainContent: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  placeholder: {
    textAlign: 'center',
    padding: '100px 20px',
    fontSize: '24px',
    fontWeight: '800',
    color: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
  }
};
