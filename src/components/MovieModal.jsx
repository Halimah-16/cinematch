import { useEffect, useRef, useState } from 'react';
import { fetchMovieDetails, imageUrl } from '../api/tmdb.js';
import { formatRuntime, formatYear } from '../lib/format.js';

export default function MovieModal({ movie, saved, onToggle, onClose }) {
  // Watchlist entries are stored slim, so fetch the full record when needed.
  const [detail, setDetail] = useState(movie.overview !== undefined ? movie : null);
  const [failed, setFailed] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (detail) return undefined;
    const controller = new AbortController();
    fetchMovieDetails(movie.id, controller.signal)
      .then(setDetail)
      .catch((e) => e.name !== 'AbortError' && setFailed(true));
    return () => controller.abort();
  }, [detail, movie.id]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const data = detail || movie;
  const backdrop = imageUrl(data.backdrop_path, 'w780');
  const trailer = data.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer');

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={data.title}>
        <button ref={closeRef} type="button" className="close-btn" onClick={onClose} aria-label="Close details">
          ×
        </button>
        {backdrop && <img className="dialog-hero" src={backdrop} alt="" />}
        <div className="dialog-body">
          <h2>{data.title}</h2>
          {data.tagline && <p className="tagline">{data.tagline}</p>}
          <p className="meta">
            <span>{formatYear(data.release_date)}</span>
            {data.runtime > 0 && <span>{formatRuntime(data.runtime)}</span>}
            <span>{data.vote_average?.toFixed(1)} / 10</span>
          </p>

          {data.genres && (
            <ul className="tags" aria-label="Genres">
              {data.genres.map((g) => (
                <li key={g.id} className="tag">
                  {g.name}
                </li>
              ))}
            </ul>
          )}

          {failed && <p className="note note-error">Could not load the full details for this film.</p>}
          {!detail && !failed && <p className="note">Loading details…</p>}
          {data.overview && <p className="overview">{data.overview}</p>}

          <div className="dialog-actions">
            <button type="button" className="btn-primary" onClick={() => onToggle(data)}>
              {saved ? 'Remove from watchlist' : 'Save to watchlist'}
            </button>
            {trailer && (
              <a
                className="btn-secondary"
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noreferrer"
              >
                Watch trailer on YouTube
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
