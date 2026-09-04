import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// iOS 13+ gates devicemotion behind the same kind of user-gesture permission
// prompt as deviceorientation (see useTilt.jsx).
const needsIOSPermission =
  typeof window !== 'undefined' &&
  typeof window.DeviceMotionEvent !== 'undefined' &&
  typeof window.DeviceMotionEvent.requestPermission === 'function';

const SHAKE_ACCEL_THRESHOLD = 16; // m/s^2 of combined acceleration to count as one shake
const SHAKE_COOLDOWN_MS = 180; // minimum time between two counted shakes
const FALLBACK_TIMEOUT_MS = 1200;

function useShakeState() {
  const [shakeCount, setShakeCount] = useState(0);
  const [permission, setPermission] = useState(needsIOSPermission ? 'pending' : 'granted');
  const [isFallback, setIsFallback] = useState(false);
  const receivedMotionRef = useRef(false);
  const lastShakeAtRef = useRef(0);

  const handleMotion = useCallback((event) => {
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc || acc.x === null) return;
    receivedMotionRef.current = true;
    const magnitude = Math.hypot(acc.x ?? 0, acc.y ?? 0, acc.z ?? 0);
    const now = performance.now();
    if (magnitude > SHAKE_ACCEL_THRESHOLD && now - lastShakeAtRef.current > SHAKE_COOLDOWN_MS) {
      lastShakeAtRef.current = now;
      setShakeCount((c) => c + 1);
    }
  }, []);

  const handleTapFallback = useCallback(() => {
    setShakeCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (permission === 'pending') return undefined;

    let fallbackTimer;
    if (permission === 'granted') {
      window.addEventListener('devicemotion', handleMotion);
      fallbackTimer = setTimeout(() => {
        if (!receivedMotionRef.current) {
          setIsFallback(true);
          window.addEventListener('pointerdown', handleTapFallback);
        }
      }, FALLBACK_TIMEOUT_MS);
    } else {
      setIsFallback(true);
      window.addEventListener('pointerdown', handleTapFallback);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      window.removeEventListener('pointerdown', handleTapFallback);
      clearTimeout(fallbackTimer);
    };
  }, [permission, handleMotion, handleTapFallback]);

  const requestPermission = useCallback(async () => {
    if (!needsIOSPermission) {
      setPermission('granted');
      return true;
    }
    try {
      const result = await window.DeviceMotionEvent.requestPermission();
      setPermission(result === 'granted' ? 'granted' : 'denied');
      return result === 'granted';
    } catch {
      setPermission('denied');
      return false;
    }
  }, []);

  const resetShakeCount = useCallback(() => setShakeCount(0), []);

  return { shakeCount, resetShakeCount, needsPermission: needsIOSPermission, permission, requestPermission, isFallback };
}

const ShakeContext = createContext(null);

export function ShakeProvider({ children }) {
  const value = useShakeState();
  return <ShakeContext.Provider value={value}>{children}</ShakeContext.Provider>;
}

export function useShake() {
  const ctx = useContext(ShakeContext);
  if (!ctx) throw new Error('useShake must be used within a <ShakeProvider>');
  return ctx;
}
