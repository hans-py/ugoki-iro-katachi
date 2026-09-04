import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// iOS 13+ gates deviceorientation/devicemotion behind an explicit,
// user-gesture-triggered permission prompt. Other platforms expose no such
// API and fire events immediately once listened for.
const needsIOSPermission =
  typeof window !== 'undefined' &&
  typeof window.DeviceOrientationEvent !== 'undefined' &&
  typeof window.DeviceOrientationEvent.requestPermission === 'function';

// How long we wait for a real deviceorientation event before assuming the
// platform doesn't support it (desktop browsers, permission silently denied)
// and switching to the pointermove fallback.
const FALLBACK_TIMEOUT_MS = 1200;

function useTiltState() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  // Compass heading in degrees [0, 360), from the device's alpha axis — used
  // by コンパス合わせ, which rotates the phone flat rather than tilting it.
  const [heading, setHeading] = useState(0);
  const [permission, setPermission] = useState(needsIOSPermission ? 'pending' : 'granted');
  const [isFallback, setIsFallback] = useState(false);
  const receivedOrientationRef = useRef(false);

  const handleOrientation = useCallback((event) => {
    if (event.beta === null || event.gamma === null) return;
    receivedOrientationRef.current = true;
    setTilt({
      x: clamp(event.gamma / 45, -1, 1),
      y: clamp(event.beta / 45, -1, 1),
    });
    if (event.alpha !== null) setHeading(event.alpha);
  }, []);

  const handlePointerMove = useCallback((event) => {
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;
    setTilt({
      x: clamp((event.clientX - halfW) / halfW, -1, 1),
      y: clamp((event.clientY - halfH) / halfH, -1, 1),
    });
    // Fallback heading: angle from screen center to the pointer, so dragging
    // in a circle around the middle of the screen mimics turning the phone.
    const angle = (Math.atan2(event.clientY - halfH, event.clientX - halfW) * 180) / Math.PI;
    setHeading((angle + 360) % 360);
  }, []);

  useEffect(() => {
    // Still waiting on the iOS permission prompt (triggered from the Start
    // screen button) — attach nothing yet.
    if (permission === 'pending') return undefined;

    let fallbackTimer;
    if (permission === 'granted') {
      window.addEventListener('deviceorientation', handleOrientation);
      fallbackTimer = setTimeout(() => {
        if (!receivedOrientationRef.current) {
          setIsFallback(true);
          window.addEventListener('pointermove', handlePointerMove);
        }
      }, FALLBACK_TIMEOUT_MS);
    } else {
      // Permission denied on iOS — go straight to the pointer fallback so
      // the game is still playable.
      setIsFallback(true);
      window.addEventListener('pointermove', handlePointerMove);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('pointermove', handlePointerMove);
      clearTimeout(fallbackTimer);
    };
  }, [permission, handleOrientation, handlePointerMove]);

  const requestPermission = useCallback(async () => {
    if (!needsIOSPermission) {
      setPermission('granted');
      return true;
    }
    try {
      const result = await window.DeviceOrientationEvent.requestPermission();
      setPermission(result === 'granted' ? 'granted' : 'denied');
      return result === 'granted';
    } catch {
      setPermission('denied');
      return false;
    }
  }, []);

  return { tilt, heading, needsPermission: needsIOSPermission, permission, requestPermission, isFallback };
}

// The permission grant and active listeners must survive navigation between
// the Start screen and a game screen, so one useTiltState() instance is
// created here and shared via context rather than re-created (and reset to
// 'pending') on every mount.
const TiltContext = createContext(null);

export function TiltProvider({ children }) {
  const value = useTiltState();
  return <TiltContext.Provider value={value}>{children}</TiltContext.Provider>;
}

export function useTilt() {
  const ctx = useContext(TiltContext);
  if (!ctx) throw new Error('useTilt must be used within a <TiltProvider>');
  return ctx;
}
