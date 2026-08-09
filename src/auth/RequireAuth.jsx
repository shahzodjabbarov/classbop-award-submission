import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

const BUBBLY_FONT = '"Lilita One", cursive';

export default function RequireAuth({ children, requireProfile = true }) {
  const location = useLocation();
  const { user, profile, loading } = useAuth();
  const next = `${location.pathname}${location.search}`;

  if (loading && !user) {
    return <div style={styles.loading}>CHECKING YOUR CLASSBOP LOGIN...</div>;
  }

  if (!user) {
    return <Navigate to={`/auth?mode=login&next=${encodeURIComponent(next)}`} replace />;
  }

  if (requireProfile && !loading && !profile?.username && location.pathname !== '/complete-profile') {
    return <Navigate to={`/complete-profile?next=${encodeURIComponent(next)}`} replace />;
  }

  return children;
}

const styles = {
  loading: {
    marginTop: '100px',
    fontFamily: BUBBLY_FONT,
    fontSize: '28px',
    color: '#111',
    textAlign: 'center',
  },
};
