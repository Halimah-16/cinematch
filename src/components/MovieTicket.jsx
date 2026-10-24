import { imageUrl } from '../api/tmdb.js';
import { formatRuntime, formatYear } from '../lib/format.js';

export default function MovieTicket({ movie, selectedGenres, saved, onOpen, onToggle }) {
  const poster = imageUrl(movie.poster_path);
  const selected = new Set(selectedGenres);

  return (
    <li className="ticket">
      {poster ? (
        <img className="ticket-poster" src={poster} alt={`Poster for ${movie.title}`} loading="lazy" />
      ) : (
        <div className="ticket-poster poster-fallback">No poster</div>
      )}

      <div className="ticket-body">
        <h3>
          <button type="button" className="title-link" onClick={() => onOpen(movie)}>
            {movie.title}
          </button>
        </h3>
        <p className="meta">
          <span>{formatYear(movie.release_date)}</span>
          {movie.runtime > 0 && <span>{formatRuntime(movie.runtime)}</span>}
          <span>{movie.vote_average.toFixed(1)} / 10</span>
        </p>
        <ul className="reasons">
          {movie.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <ul className="tags" aria-label="Genres">
          {movie.genres?.map((genre) => (
            <li key={genre.id} className={selected.has(genre.id) ? 'tag is-match' : 'tag'}>
              {genre.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="stub">
        <p className="score">
          <strong>{movie.score}</strong>
          <span>% match</span>
        </p>
        <button type="button" className="stub-btn" aria-pressed={saved} onClick={() => onToggle(movie)}>
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </li>
  );
}
