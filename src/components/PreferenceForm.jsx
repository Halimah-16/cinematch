import { DURATIONS } from '../lib/scoring.js';

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1949 }, (_, i) => THIS_YEAR - i);

const LANGUAGES = [
  ['', 'Any language'],
  ['en', 'English'],
  ['id', 'Indonesian'],
  ['ja', 'Japanese'],
  ['ko', 'Korean'],
  ['fr', 'French'],
  ['es', 'Spanish'],
  ['hi', 'Hindi'],
  ['th', 'Thai'],
  ['zh', 'Chinese'],
];

export default function PreferenceForm({ genres, genreError, prefs, onChange, onSubmit, loading }) {
  const set = (patch) => onChange({ ...prefs, ...patch });
  const toggleGenre = (id) =>
    set({
      genres: prefs.genres.includes(id)
        ? prefs.genres.filter((g) => g !== id)
        : [...prefs.genres, id],
    });

  const yearsInvalid = prefs.yearFrom > prefs.yearTo;
  const canSubmit = prefs.genres.length > 0 && !yearsInvalid && !loading;

  return (
    <form
      className="panel"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      <h2 className="panel-title">Your taste</h2>

      <fieldset>
        <legend>Genres</legend>
        {genreError && <p className="note note-error">{genreError}</p>}
        {!genreError && !genres.length && <p className="note">Loading genres…</p>}
        <div className="chips">
          {genres.map((genre) => (
            <button
              key={genre.id}
              type="button"
              className="chip"
              aria-pressed={prefs.genres.includes(genre.id)}
              onClick={() => toggleGenre(genre.id)}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Length</legend>
        <div className="options">
          {DURATIONS.map((option) => (
            <label key={option.id} className="option">
              <input
                type="radio"
                name="duration"
                checked={prefs.duration === option.id}
                onChange={() => set({ duration: option.id })}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Release years</legend>
        <div className="year-row">
          <select
            aria-label="From year"
            value={prefs.yearFrom}
            onChange={(e) => set({ yearFrom: Number(e.target.value) })}
          >
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <span aria-hidden="true">to</span>
          <select
            aria-label="To year"
            value={prefs.yearTo}
            onChange={(e) => set({ yearTo: Number(e.target.value) })}
          >
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>
        {yearsInvalid && <p className="note note-error">The first year must not be after the second.</p>}
      </fieldset>

      <fieldset>
        <legend>
          Minimum rating <output className="range-value">{prefs.minRating.toFixed(1)}</output>
        </legend>
        <input
          type="range"
          min="5"
          max="9"
          step="0.5"
          value={prefs.minRating}
          aria-label="Minimum rating"
          onChange={(e) => set({ minRating: Number(e.target.value) })}
        />
      </fieldset>

      <fieldset>
        <legend>Original language</legend>
        <select
          aria-label="Original language"
          value={prefs.language}
          onChange={(e) => set({ language: e.target.value })}
        >
          {LANGUAGES.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </fieldset>

      <button type="submit" className="btn-primary" disabled={!canSubmit}>
        {loading ? 'Scoring films…' : 'Find films'}
      </button>
      {!prefs.genres.length && <p className="note">Pick at least one genre to start.</p>}
    </form>
  );
}
