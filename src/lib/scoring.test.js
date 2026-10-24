import { describe, expect, it } from 'vitest';
import {
  DURATIONS,
  durationFit,
  genreFit,
  popularityFit,
  rankMovies,
  ratingFit,
} from './scoring.js';

const prefs = { genres: [28, 53], duration: 'standard', minRating: 6.5 };
const genreMap = { 28: 'Action', 53: 'Thriller', 35: 'Comedy' };
const standard = DURATIONS.find((d) => d.id === 'standard');

describe('genreFit', () => {
  it('is 1 when every selected genre is covered', () => {
    expect(genreFit([28, 53, 12], [28, 53])).toBe(1);
  });
  it('is the share of covered genres', () => {
    expect(genreFit([28], [28, 53])).toBe(0.5);
  });
  it('is neutral when nothing is selected', () => {
    expect(genreFit([35], [])).toBe(1);
  });
});

describe('ratingFit', () => {
  it('maps 5 to 0 and 9 to 1, and clamps outside that range', () => {
    expect(ratingFit(5)).toBe(0);
    expect(ratingFit(9)).toBe(1);
    expect(ratingFit(3)).toBe(0);
    expect(ratingFit(10)).toBe(1);
  });
});

describe('popularityFit', () => {
  it('is 1 for the most popular candidate and 0 without a maximum', () => {
    expect(popularityFit(500, 500)).toBe(1);
    expect(popularityFit(10, 0)).toBe(0);
  });
});

describe('durationFit', () => {
  it('peaks at the centre of the range and falls to 0.5 at the edges', () => {
    expect(durationFit(105, standard)).toBe(1);
    expect(durationFit(120, standard)).toBe(0.5);
  });
  it('ignores length when "any" is chosen', () => {
    expect(durationFit(200, DURATIONS[0])).toBe(1);
  });
});

describe('rankMovies', () => {
  const base = { vote_count: 5000, popularity: 100 };
  const movies = [
    { id: 1, ...base, genre_ids: [28], vote_average: 8.5, runtime: 105 },
    { id: 2, ...base, genre_ids: [28, 53], vote_average: 7.4, runtime: 110 },
    { id: 3, ...base, genre_ids: [35], vote_average: 8.9, runtime: 105 },
  ];

  it('puts the film covering both genres first, even with a lower rating', () => {
    const ranked = rankMovies(movies, prefs, { genreMap, withRuntime: true });
    expect(ranked.map((m) => m.id)).toEqual([2, 1, 3]);
  });

  it('explains the pick with the matched genre names', () => {
    const [top] = rankMovies(movies, prefs, { genreMap, withRuntime: true });
    expect(top.reasons[0]).toBe('Matches 2 of 2 genres: Action, Thriller');
  });

  it('keeps scores within 0-100', () => {
    rankMovies(movies, prefs, { genreMap, withRuntime: true }).forEach((m) => {
      expect(m.score).toBeGreaterThanOrEqual(0);
      expect(m.score).toBeLessThanOrEqual(100);
    });
  });
});
