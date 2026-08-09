import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { getAvatarForSeed } from './avatarUtils';
import { supabase } from '../supabaseClient';

// Excludes `email`: the client reads the user's email from the Supabase Auth
// session (user.email), never from the profiles table, and the email column's
// SELECT privilege is revoked for anon/authenticated at the DB level (see
// supabase/profiles_email_privacy_fix.sql) so selecting it here would error.
const PROFILE_COLUMNS = 'id, username, display_name, avatar_url, created_at, updated_at';

const getMetadataName = (user) => {
  return (
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    'Teacher'
  );
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to load profile:', error.message);
      setProfile(null);
      return null;
    }

    if (data) {
      setProfile(data);
      return data;
    }

    // No `email` here: clients have no privilege on profiles.email (see the
    // PROFILE_COLUMNS note above); the handle_new_user trigger fills it.
    const fallbackProfile = {
      id: authUser.id,
      display_name: getMetadataName(authUser),
      avatar_url: getAvatarForSeed(authUser.id || authUser.email),
    };

    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert(fallbackProfile)
      .select(PROFILE_COLUMNS)
      .single();

    if (createError) {
      console.error('Failed to create profile:', createError.message);
      setProfile(null);
      return null;
    }

    setProfile(createdProfile);
    return createdProfile;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    return loadProfile(user);
  }, [loadProfile, user]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Failed to get session:', error.message);
      }

      if (!mounted) return;

      const currentSession = data?.session ?? null;
      const currentUser = currentSession?.user ?? null;

      setSession(currentSession);
      setUser(currentUser);
      await loadProfile(currentUser);

      if (mounted) setLoading(false);
    };

    initAuth();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUser = nextSession?.user ?? null;
      setSession(nextSession);
      setUser(nextUser);
      setLoading(true);

      setTimeout(() => {
        Promise.resolve(loadProfile(nextUser)).finally(() => {
          if (mounted) setLoading(false);
        });
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    isSignedIn: Boolean(user),
    refreshProfile,
    signOut,
  }), [session, user, profile, loading, refreshProfile, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
