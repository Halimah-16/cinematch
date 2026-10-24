import { formatCount } from './format.js';

/** How much each signal contributes to the final 0-100 match score. */
export const WEIGHTS = { genre: 40, rating: 25, duration: 20, popularity: 15 };

/**
 * Length presets. `min`/`max` are hard filters sent to TMDB.
 * `mid`/`span` describe the sweet spot used for scoring.
 */
export const DURATIONS = [
  { id: 'any', label: 'Any length', min: null, max: null, mid: null, span: null },
  { id: 'short', label: 'Under 90 min', min: 60, max: 89, mid: 75, span: 15 },
  { id: 'standard', label: '90 to 120 min', min: 90, max: 120, mid: 105, span: 15 },
  { id: 'long', label: '120 to 150 min', min: 121, max: 150, mid: 135, span: 15 },
  { id: 'epic', label: 'Over 150 min', min: 151, max: null, mid: 165, span: 25 },
];

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/** Share of the selected genres that the film covers (0-1). */
export function genreFit(movieGenreIds = [], selected = []) {
  if (!selected.length) return 1;
  const owned = new Set(movieGenreIds);
  return selected.filter((id) => owned.has(id)).length / selected.length;
}

/** TMDB rating mapped so 5/10 scores 0 and 9/10 scores 1. */
export const ratingFit = (voteAverage = 0) => clamp((voteAverage - 5) / 4);

/** Log-scaled popularity relative to the most popular candidate. */
export function popularityFit(popularity = 0, maxPopularity = 0) {
  if (!maxPopularity) return 0;
  return clamp(Math.log1p(popularity) / Math.log1p(maxPopularity));
}

/** 1 at the centre of the chosen length range, 0.5 at its edges. */
export function durationFit(runtime, option) {
  if (!option || option.mid == null) return 1;
  if (!runtime) return 0.5;
  return clamp(1 - Math.abs(runtime - option.mid) / (option.span * 2));
}

/**
 * Weighted average of the signals, scaled to 0-100.
 * Duration is skipped until runtimes are known (details are fetched later).
 */
export function scoreMovie(movie, prefs, { maxPopularity, withRuntime }) {
  const option = DURATIONS.find((d) => d.id === prefs.duration);
  const parts = {
    genre: genreFit(movie.genre_ids, prefs.genres),
    rating: ratingFit(movie.vote_average),
    popularity: popularityFit(movie.popularity, maxPopularity),
  };
  if (withRuntime) parts.duration = durationFit(movie.runtime, option);

  let total = 0;
  let weight = 0;
  for (const [key, value] of Object.entries(parts)) {
    total += WEIGHTS[key] * value;
    weight += WEIGHTS[key];
  }
  return Math.round((total / weight) * 100);
}

/** Short, human-readable explanations of why a film was picked. */
export function buildReasons(movie, prefs, genreMap = {}) {
  const reasons = [];

  if (prefs.genres.length) {
    const owned = new Set(movie.genre_ids);
    const matched = prefs.genres.filter((id) => owned.has(id));
    const names = matched.map((id) => genreMap[id]).filter(Boolean).join(', ');
    reasons.push(
      `Matches ${matched.length} of ${prefs.genres.length} genres${names ? `: ${names}` : ''}`,
    );
  }

  reasons.push(
    `Rated ${movie.vote_average.toFixed(1)}/10 by ${formatCount(movie.vote_count)} viewers`,
  );

  const option = DURATIONS.find((d) => d.id === prefs.duration);
  if (movie.runtime && option && option.id !== 'any') {
    reasons.push(`${movie.runtime} min fits "${option.label}"`);
  }
  return reasons;
}

/** Scores every movie and returns them best-first. */
export function rankMovies(movies, prefs, { genreMap = {}, withRuntime = false } = {}) {
  const maxPopularity = Math.max(0, ...movies.map((m) => m.popularity || 0));
  return movies
    .map((movie) => ({
      ...movie,
      score: scoreMovie(movie, prefs, { maxPopularity, withRuntime }),
      reasons: buildReasons(movie, prefs, genreMap),
    }))
    .sort((a, b) => b.score - a.score || b.vote_average - a.vote_average);
}
