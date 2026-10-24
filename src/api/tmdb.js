const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export const imageUrl = (path, size = 'w342') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

async function request(path, params = {}, signal) {
  if (!API_KEY) throw new Error('MISSING_KEY');

  const url = new URL(BASE_URL + path);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, { signal });
  if (response.status === 401) throw new Error('INVALID_KEY');
  if (!response.ok) throw new Error(`TMDB_${response.status}`);
  return response.json();
}

export async function fetchGenres(signal) {
  const data = await request('/genre/movie/list', {}, signal);
  return data.genres;
}

/**
 * Pulls a pool of candidate films (3 pages, up to 60 titles) that pass the
 * hard filters: genre, release years, minimum rating, language and length.
 * Ranking happens client-side in lib/scoring.js.
 */
export async function discoverMovies(prefs, durationOption, signal) {
  const params = {
    sort_by: 'popularity.desc',
    include_adult: 'false',
    'vote_count.gte': 300,
    'vote_average.gte': prefs.minRating,
    with_genres: prefs.genres.join('|'), // "|" = any of the selected genres
    'primary_release_date.gte': `${prefs.yearFrom}-01-01`,
    'primary_release_date.lte': `${prefs.yearTo}-12-31`,
    with_original_language: prefs.language,
    'with_runtime.gte': durationOption?.min ?? '',
    'with_runtime.lte': durationOption?.max ?? '',
  };

  const pages = await Promise.all(
    [1, 2, 3].map((page) => request('/discover/movie', { ...params, page }, signal)),
  );

  const seen = new Set();
  return pages
    .flatMap((page) => page.results)
    .filter((movie) => (seen.has(movie.id) ? false : seen.add(movie.id)));
}

export function fetchMovieDetails(id, signal) {
  return request(`/movie/${id}`, { append_to_response: 'videos' }, signal);
}

export function describeError(error) {
  switch (error?.message) {
    case 'MISSING_KEY':
      return 'No API key found. Add VITE_TMDB_API_KEY to your .env file and restart the dev server.';
    case 'INVALID_KEY':
      return 'TMDB rejected the API key. Check that it was copied correctly.';
    default:
      return error instanceof TypeError
        ? 'Could not reach TMDB. Check your connection and try again.'
        : 'Something went wrong while loading films. Try again.';
  }
}
