import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

// Renders a QR code for `value` onto a canvas. Used instead of a pre-made
// PNG because the URL now needs to carry a fresh room code each time the
// display hosts a new pairing session.
export default function QrCode({ value, size = 220 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: '#17102b', light: '#fff6e9' },
    }).catch(() => {});
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} />;
}
