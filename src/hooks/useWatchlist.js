import { useEffect, useState } from 'react';

const STORAGE_KEY = 'cinematch.watchlist';

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const slim = ({ id, title, release_date, poster_path, vote_average }) => ({
  id,
  title,
  release_date,
  poster_path,
  vote_average,
});

export function useWatchlist() {
  const [items, setItems] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable: the list just won't persist */
    }
  }, [items]);

  const has = (id) => items.some((item) => item.id === id);
  const toggle = (movie) =>
    setItems((prev) =>
      prev.some((item) => item.id === movie.id)
        ? prev.filter((item) => item.id !== movie.id)
        : [...prev, slim(movie)],
    );

  return { items, has, toggle };
}
