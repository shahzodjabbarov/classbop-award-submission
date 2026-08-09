import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import {
  createPictionarySession,
  getSessionStorageKey,
  loadPictionarySession,
  savePictionarySession,
} from './pictionaryUtils';

function makeClientId() {
  const values = new Uint32Array(2);
  window.crypto.getRandomValues(values);
  return `client-${values[0].toString(36)}-${values[1].toString(36)}`;
}

function shouldAcceptIncomingSession(currentSession, incomingSession) {
  if (!incomingSession?.id) return false;
  if (!currentSession) return true;
  if (incomingSession.id !== currentSession.id) return false;

  const incomingVersion = incomingSession.version || 0;
  const currentVersion = currentSession.version || 0;
  if (incomingVersion !== currentVersion) return incomingVersion > currentVersion;

  return (incomingSession.updatedAt || 0) > (currentSession.updatedAt || 0);
}

export function usePictionarySession({ sessionId, categoryId, initialSession } = {}) {
  const clientIdRef = useRef(makeClientId());
  const sessionRef = useRef(null);
  const channelRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('offline');
  const [session, setSession] = useState(() => {
    if (!sessionId && !initialSession) return null;
    const loaded = sessionId ? loadPictionarySession(sessionId) : null;
    return loaded || initialSession || createPictionarySession({ sessionId, categoryId });
  });

  useEffect(() => {
    sessionRef.current = session;
    if (session) savePictionarySession(session);
  }, [session]);

  useEffect(() => {
    const activeSessionId = session?.id || sessionId;
    if (!activeSessionId) return undefined;

    const storageKey = getSessionStorageKey(activeSessionId);
    const handleStorage = (event) => {
      if (event.key !== storageKey || !event.newValue) return;

      try {
        const incomingSession = JSON.parse(event.newValue);
        setSession((currentSession) => (
          shouldAcceptIncomingSession(currentSession, incomingSession)
            ? incomingSession
            : currentSession
        ));
      } catch {
        // Ignore malformed local storage from older/dev sessions.
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [session?.id, sessionId]);

  const broadcastSession = useCallback((nextSession) => {
    const channel = channelRef.current;
    if (!channel || !nextSession) return;

    channel.send({
      type: 'broadcast',
      event: 'state',
      payload: {
        senderId: clientIdRef.current,
        session: nextSession,
      },
    });
  }, []);

  const requestState = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;

    channel.send({
      type: 'broadcast',
      event: 'request_state',
      payload: { senderId: clientIdRef.current },
    });
  }, []);

  const applySessionUpdate = useCallback((updater) => {
    setSession((currentSession) => {
      const nextSession = typeof updater === 'function' ? updater(currentSession) : updater;
      if (!nextSession) return currentSession;
      savePictionarySession(nextSession);
      broadcastSession(nextSession);
      return nextSession;
    });
  }, [broadcastSession]);

  useEffect(() => {
    const activeSessionId = session?.id || sessionId;
    if (!activeSessionId) return undefined;

    const channel = supabase.channel(`pictionary-session-${activeSessionId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'state' }, ({ payload }) => {
        if (payload?.senderId === clientIdRef.current) return;
        const incomingSession = payload?.session;
        setSession((currentSession) => {
          if (!shouldAcceptIncomingSession(currentSession, incomingSession)) return currentSession;
          savePictionarySession(incomingSession);
          return incomingSession;
        });
      })
      .on('broadcast', { event: 'request_state' }, ({ payload }) => {
        if (payload?.senderId === clientIdRef.current) return;
        const currentSession = sessionRef.current;
        if (currentSession) broadcastSession(currentSession);
      })
      .subscribe((status) => {
        setConnectionStatus(status);
        if (status === 'SUBSCRIBED') {
          requestState();
          if (sessionRef.current) broadcastSession(sessionRef.current);
        }
      });

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [broadcastSession, requestState, session?.id, sessionId]);

  const isConnected = connectionStatus === 'SUBSCRIBED';

  return useMemo(() => ({
    session,
    setSession: applySessionUpdate,
    isConnected,
    connectionStatus,
    requestState,
  }), [applySessionUpdate, connectionStatus, isConnected, requestState, session]);
}
