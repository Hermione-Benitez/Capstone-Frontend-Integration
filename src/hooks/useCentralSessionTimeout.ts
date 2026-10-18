import { useEffect, useRef, useCallback } from 'react';
import { clearAuthSession } from '../utils/auth';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_EVENTS = [
  'mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'
];

export function useCentralSessionTimeout(isAuthenticated: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleTimeout = useCallback(() => {
    clearAuthSession();
    window.location.href = '/login?action=logout&reason=inactivity';
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isAuthenticated) return;
    timerRef.current = setTimeout(handleTimeout, INACTIVITY_TIMEOUT_MS);
  }, [isAuthenticated, handleTimeout]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const onActivity = () => resetTimer();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [isAuthenticated, resetTimer]);
}
