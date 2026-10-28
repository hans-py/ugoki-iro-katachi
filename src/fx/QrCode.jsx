import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

// Renders a QR code for `value` onto a canvas. Used instead of a pre-made
// PNG because the URL now needs to carry a fresh room code each time the
// display hosts a new pairing session.
export default function QrCode({ value, size = 220 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!value || !canvas) return;
    QRCode.toCanvas(canvas, value, {
      width: size,
      // 4 modules of quiet zone: the standard minimum, which camera apps need
      // to lock on quickly (1 was marginal on glossy or off-angle monitors).
      margin: 4,
      color: { dark: '#17102b', light: '#fff6e9' },
    })
      .then(() => {
        // toCanvas sets its own inline width/height (matching `size` in
        // pixels), which outranks the stylesheet's responsive sizing and
        // makes the canvas ignore its container — reset it so the CSS
        // width/height/object-fit rules on .qr-frame canvas take over again.
        canvas.style.removeProperty('width');
        canvas.style.removeProperty('height');
      })
      .catch(() => {});
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} />;
}
