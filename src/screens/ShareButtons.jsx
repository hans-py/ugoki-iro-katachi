import { useEffect, useState } from 'react';
import { SHARE_TEXTS } from '../data/titles.js';
import { renderShareCard, shareCaption } from '../fx/shareCard.js';

// Builds the card as soon as the result appears (so a tap can hand it to the
// share sheet immediately — some browsers only allow sharing synchronously
// inside the tap), then offers "share" and "save image".
export default function ShareButtons({ info }) {
  const [file, setFile] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    let cancelled = false;
    renderShareCard(info).then((blob) => {
      if (!cancelled && blob) setFile(new File([blob], 'ugoki-iro-katachi.png', { type: 'image/png' }));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const caption = shareCaption(info);

  const save = async () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    try {
      await navigator.clipboard.writeText(caption);
      setNote(SHARE_TEXTS.savedNote);
    } catch {
      setNote('');
    }
  };

  const share = async () => {
    if (!file) return;
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: caption });
      } catch {
        // dismissed the share sheet — nothing to do
      }
      return;
    }
    // No file sharing here (e.g. desktop): save the image and copy the text.
    await save();
  };

  return (
    <div className="share-row">
      <button className="primary-button share-button" onClick={share} disabled={!file}>
        {SHARE_TEXTS.shareButton}
      </button>
      <button className="secondary-button share-button" onClick={save} disabled={!file}>
        {SHARE_TEXTS.saveButton}
      </button>
      {note && <p className="share-note">{note}</p>}
    </div>
  );
}
