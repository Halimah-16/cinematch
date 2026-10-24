# CineMatch

Movie recommendations scored against your taste. Pick genres, length, release years, rating and language, and CineMatch ranks films from [TMDB](https://www.themoviedb.org/) and shows **why** each one made the list.

**Live demo:** (https://github.com/Halimah-16/cinematch)

## Features

- Multi-genre selection with hard filters for length, release years, minimum rating and original language
- Transparent 0 to 100 match score, with plain-language reasons on every result
- Film details with synopsis, runtime and a trailer link
- Watchlist saved in the browser (`localStorage`)
- Light and dark themes, responsive layout, keyboard-friendly
- Unit tests for the scoring logic, and CI that deploys to GitHub Pages

## How the match score works

Candidates come from TMDB's `discover` endpoint, which applies the hard filters. The app then ranks them in three steps:

1. **First pass.** Up to 60 candidates are scored on genre, rating and popularity.
2. **Shortlist.** The top 15 get a detail lookup to fetch their runtime.
3. **Final score.** All four signals are combined and the top 10 are shown.

| Signal | Weight | How it is measured |
| --- | --- | --- |
| Genre fit | 40 | Share of your selected genres the film covers |
| Rating | 25 | TMDB average, where 5/10 scores 0 and 9/10 scores 1 |
| Length fit | 20 | 1 at the centre of your chosen range, 0.5 at its edges |
| Popularity | 15 | Log-scaled against the most popular candidate |

The scoring code is in [`src/lib/scoring.js`](src/lib/scoring.js) and is covered by tests in `scoring.test.js`.

## Tech stack

React 18, Vite, plain CSS, Vitest, TMDB API v3, GitHub Actions.

## Getting started

```bash
git clone https://github.com/Halimah-16/cinematch.git
cd cinematch
npm install
cp .env.example .env     # then paste your TMDB API key into .env
npm run dev
```

Get a free API key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) (use the **API Key (v3 auth)** value).

Other scripts: `npm test`, `npm run build`, `npm run preview`.

> **About the key.** This is a client-side app, so the key is included in the built JavaScript. TMDB keys are read-only and free, which makes that acceptable for a portfolio project. Never commit `.env`; it is already in `.gitignore`.

## Deploy to GitHub Pages

1. Push the repo to GitHub.
2. Go to **Settings → Secrets and variables → Actions** and add a secret named `VITE_TMDB_API_KEY`.
3. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
4. Push to `main`. The workflow in `.github/workflows/deploy.yml` tests, builds and publishes the site.

## Project structure

```
src/
  api/tmdb.js            TMDB requests and error messages
  lib/scoring.js         Filters, weights, scoring and reasons
  lib/scoring.test.js    Unit tests
  hooks/useWatchlist.js  Watchlist state saved to localStorage
  components/            Form, ticket, detail modal, watchlist drawer
  App.jsx                Search flow and page layout
  styles.css             Theme tokens and layout
```

## Ideas for next steps

- Exclude films already on the watchlist from results
- Add TV series using the same scoring pipeline
- Let users adjust the signal weights with sliders

## Attribution and license

This product uses the TMDB API but is not endorsed or certified by TMDB. Film data and images are provided by TMDB.

Code released under the [MIT License](LICENSE).
