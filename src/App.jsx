import { useEffect, useMemo, useRef, useState } from 'react';
import {
  describeError,
  discoverMovies,
  fetchGenres,
  fetchMovieDetails,
} from './api/tmdb.js';
import MovieModal from './components/MovieModal.jsx';
import MovieTicket from './components/MovieTicket.jsx';
import PreferenceForm from './components/PreferenceForm.jsx';
import WatchlistPanel from './components/WatchlistPanel.jsx';
import { useWatchlist } from './hooks/useWatchlist.js';
import { DURATIONS, rankMovies } from './lib/scoring.js';

const DEFAULT_PREFS = {
  genres: [],
  duration: 'any',
  yearFrom: 1990,
  yearTo: new Date().getFullYear(),
  minRating: 6.5,
  language: '',
};

const SHORTLIST_SIZE = 15; // films that get a detail lookup (runtime etc.)
const RESULT_SIZE = 10;

export default function App() {
  const [genres, setGenres] = useState([]);
  const [genreError, setGenreError] = useState('');
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [activeMovie, setActiveMovie] = useState(null);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  const abortRef = useRef(null);
  const watchlist = useWatchlist();

  const genreMap = useMemo(() => Object.fromEntries(genres.map((g) => [g.id, g.name])), [genres]);

  useEffect(() => {
    const controller = new AbortController();
    fetchGenres(controller.signal)
      .then(setGenres)
      .catch((e) => e.name !== 'AbortError' && setGenreError(describeError(e)));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('cinematch.theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  async function search() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    setError('');

    try {
      const option = DURATIONS.find((d) => d.id === prefs.duration);

      // 1. Hard filters on TMDB's side give a pool of candidates.
      const candidates = await discoverMovies(prefs, option, controller.signal);

      // 2. A first score (no runtime yet) picks a shortlist.
      const shortlist = rankMovies(candidates, prefs, { genreMap }).slice(0, SHORTLIST_SIZE);

      // 3. Only the shortlist gets a detail lookup, to keep requests low.
      const detailed = await Promise.all(
        shortlist.map((movie) =>
          fetchMovieDetails(movie.id, controller.signal)
            .then((d) => ({ ...d, genre_ids: d.genres.map((g) => g.id) }))
            .catch(() => movie),
        ),
      );

      // 4. Final score includes how well the runtime fits.
      setResults(rankMovies(detailed, prefs, { genreMap, withRuntime: true }).slice(0, RESULT_SIZE));
      setStatus('done');
    } catch (e) {
      if (e.name === 'AbortError') return;
      setError(describeError(e));
      setStatus('error');
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="./" aria-label="CineMatch home">
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <path
              fill="currentColor"
              d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.2a2.8 2.8 0 0 0 0 5.6V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.2a2.8 2.8 0 0 0 0-5.6z"
            />
          </svg>
          CineMatch
        </a>
        <nav className="header-actions">
          <button type="button" className="link-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button type="button" className="link-btn" onClick={() => setShowWatchlist(true)}>
            Watchlist ({watchlist.items.length})
          </button>
        </nav>
      </header>

      <main>
        <section className="intro">
          <h1>Ten films that fit your evening.</h1>
          <p>
            Choose your genres and limits. CineMatch scores every candidate on genre fit, rating,
            length and popularity, then shows why each one made the list.
          </p>
        </section>

        <div className="layout">
          <PreferenceForm
            genres={genres}
            genreError={genreError}
            prefs={prefs}
            onChange={setPrefs}
            onSubmit={search}
            loading={status === 'loading'}
          />

          <section className="results" aria-live="polite" aria-busy={status === 'loading'}>
            {status === 'idle' && (
              <div className="state">
                <h2>Your picks will show up here</h2>
                <p>Choose at least one genre, set your limits, then press Find films.</p>
              </div>
            )}

            {status === 'loading' && (
              <div className="state">
                <h2>Scoring films for you</h2>
                <p>Checking ratings and runtimes. This takes a few seconds.</p>
              </div>
            )}

            {status === 'error' && (
              <div className="state state-error">
                <h2>Could not load films</h2>
                <p>{error}</p>
                <button type="button" className="btn-secondary" onClick={search}>
                  Try again
                </button>
              </div>
            )}

            {status === 'done' && !results.length && (
              <div className="state">
                <h2>No films fit all of that</h2>
                <p>Lower the minimum rating or widen the release years, then search again.</p>
              </div>
            )}

            {status === 'done' && results.length > 0 && (
              <>
                <h2 className="results-title">Top {results.length} for you</h2>
                <ol className="tickets">
                  {results.map((movie) => (
                    <MovieTicket
                      key={movie.id}
                      movie={movie}
                      selectedGenres={prefs.genres}
                      saved={watchlist.has(movie.id)}
                      onOpen={setActiveMovie}
                      onToggle={watchlist.toggle}
                    />
                  ))}
                </ol>
              </>
            )}
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <p>
          This product uses the TMDB API but is not endorsed or certified by{' '}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
            TMDB
          </a>
          .
        </p>
      </footer>

      {showWatchlist && (
        <WatchlistPanel
          items={watchlist.items}
          onOpen={(movie) => {
            setShowWatchlist(false);
            setActiveMovie(movie);
          }}
          onRemove={watchlist.toggle}
          onClose={() => setShowWatchlist(false)}
        />
      )}

      {activeMovie && (
        <MovieModal
          movie={activeMovie}
          saved={watchlist.has(activeMovie.id)}
          onToggle={watchlist.toggle}
          onClose={() => setActiveMovie(null)}
        />
      )}
    </>
  );
}
