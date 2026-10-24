import { useEffect } from 'react';
import { imageUrl } from '../api/tmdb.js';
import { formatYear } from '../lib/format.js';

export default function WatchlistPanel({ items, onOpen, onRemove, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay overlay-right" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Your watchlist">
        <div className="drawer-head">
          <h2>Your watchlist</h2>
          <button type="button" className="close-btn static" onClick={onClose} aria-label="Close watchlist">
            ×
          </button>
        </div>

        {!items.length ? (
          <p className="note">Nothing saved yet. Press Save on any film to keep it here.</p>
        ) : (
          <ul className="watch-list">
            {items.map((item) => {
              const poster = imageUrl(item.poster_path, 'w92');
              return (
                <li key={item.id}>
                  {poster ? <img src={poster} alt="" /> : <div className="mini-fallback" />}
                  <button type="button" className="title-link" onClick={() => onOpen(item)}>
                    {item.title}
                    <small>{formatYear(item.release_date)}</small>
                  </button>
                  <button type="button" className="link-btn" onClick={() => onRemove(item)}>
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </div>
  );
}
