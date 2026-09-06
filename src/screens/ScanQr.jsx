import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import jsQR from 'jsqr';
import { usePeerLink } from '../engines/usePeerLink.jsx';

// Reads the room code straight out of the join URL — accepts either a full
// URL (?room=xxxxx) or someone just typing the bare code in the manual
// fallback below.
function extractRoomCode(text) {
  try {
    const url = new URL(text);
    const fromQuery = url.searchParams.get('room');
    if (fromQuery) return fromQuery;
  } catch {
    // not a URL — fall through to treating it as a bare code
  }
  const trimmed = text.trim();
  return /^[a-z0-9]{4,8}$/i.test(trimmed) ? trimmed : null;
}

// The phone's camera, pointed at the QR currently showing on the exhibit
// monitor. This is the "一人で遊ぶ" entry point — the app itself is reached
// via a fixed link, but which display session to join can only come from
// scanning whatever room code is live right now.
export default function ScanQr() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const duoMode = searchParams.get('duo'); // 'battle' | 'match' | null (solo)
  const { connected, joinRoom } = usePeerLink();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('starting'); // 'starting' | 'scanning' | 'denied' | 'found'
  const [manualCode, setManualCode] = useState('');
  const joinedRef = useRef(false);

  const tryJoin = (code) => {
    if (joinedRef.current || !code) return;
    joinedRef.current = true;
    setStatus('found');
    joinRoom(code);
  };

  useEffect(() => {
    let raf;
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus('scanning');

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const tick = () => {
          if (cancelled) return;
          const video = videoRef.current;
          if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(frame.data, frame.width, frame.height);
            if (code?.data) {
              const room = extractRoomCode(code.data);
              if (room) tryJoin(room);
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        if (!cancelled) setStatus('denied');
      }
    }
    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (connected) navigate(duoMode ? `/duo-play?mode=${duoMode}` : '/play');
  }, [connected, navigate, duoMode]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const code = extractRoomCode(manualCode);
    if (code) tryJoin(code);
  };

  return (
    <div className="screen scan-screen scene-coral">
      <p className="eyebrow">ディスプレイのQRを読み取ってください</p>
      <div className="scan-viewport">
        <video ref={videoRef} className="scan-video" playsInline muted />
        <div className="scan-frame" />
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {status === 'starting' && <p className="hint">カメラを準備中…</p>}
      {status === 'found' && <p className="hint">接続しています…</p>}
      {status === 'denied' && (
        <p className="hint">カメラを使えませんでした。下に表示されているコードを直接入力してください。</p>
      )}

      <form className="scan-manual" onSubmit={handleManualSubmit}>
        <input
          type="text"
          inputMode="text"
          placeholder="コードを直接入力 (例: g6xmh)"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
        />
        <button className="primary-button" type="submit">
          接続
        </button>
      </form>
    </div>
  );
}
