# YouTube Music Movie Recs

A small Chrome extension that scans the currently active YouTube Music tab for soundtrack-like tracks ("From the Movie", "From the Soundtrack", "Movie Track", etc.), extracts probable movie names, queries OMDb for movie metadata (poster, year, genre, imdb link) and displays them in a polished popup.

## Features

- Scans the active tab for YouTube Music queue titles
- Filters for soundtrack phrases and extracts movie names
- Calls OMDb by title to fetch poster and basic metadata
- Displays animated cards with poster, title, year/genre, and action buttons
- "Open on IMDb" and "Copy" buttons per card
- Badge showing number of matched movies

## Files

- `manifest.json` - extension manifest (MV3). Includes `scripting` and `activeTab` permissions and host permission for OMDb.
- `background.js` - notes and planning (no runtime logic currently).
- `popup.html` - popup UI with styles and badge.
- `popup.js` - main popup logic: collects titles by injecting `collectTitles()` into the active tab, filters for soundtrack phrases, calls OMDb, renders cards.
- `logo.jpg` - icon used in popup header.

## Installation / testing

1. Open chrome://extensions (or edge://extensions) in your Chromium-based browser.
2. Enable "Developer mode" in the top-right.
3. Click "Load unpacked" and select this project folder (`ytm_movie_recs`).
4. Open https://music.youtube.com and make sure a queue/player is visible (so the extension can find the track titles).
5. Click the extension icon to open the popup. It will scan the active tab and (if matches are found) query OMDb and display results.

## OMDb API Key

This project includes a placeholder API key in `popup.js`:

```js
const OMDB_KEY = '67f8031d'; // replace with your own key
```

You should replace that with your OMDb API key. To get a key, sign up at http://www.omdbapi.com/apikey.aspx.

Alternatively I can wire a small settings UI to save your key into extension storage.

## Selector notes & Shadow DOM

YouTube Music may render song titles inside web components or shadow roots. The current collector uses the selector:

- `.song-title.style-scope.ytmusic-player-queue-item`
- fallback: `yt-formatted-string.song-title, yt-formatted-string`

If the extension finds no titles but you can see them in the page, inspect the element in DevTools to check whether:

- The class names changed (update the selector in `popup.js`).
- Titles live inside a closed shadow root (not accessible). If they are inside open shadow roots we can add a recursive walker to search shadow DOM roots.

## Next steps / ideas

- Add a small Settings UI to store your OMDb key in extension storage.
- Use TMDb (The Movie Database) for richer metadata and reliable poster URLs.
- Add background updates or a content script to auto-detect when the queue changes.
- Improve extraction heuristics for more varied soundtrack title formats.

## Troubleshooting

- If network requests to OMDb fail, check `manifest.json` includes host permissions for `https://www.omdbapi.com/*`.
- If the popup shows "No soundtrack titles found", verify the active tab is YouTube Music and the queue is visible.
- Open the popup and right-click -> Inspect to see console logs from `popup.js` for debugging.
