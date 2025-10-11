// Ensure the title ends with " - YouTube Music"
// Use a regular expression that matches the suffix ' - YouTube Music' (case-insensitive).
// This will match titles like: "Song Name - YouTube Music"
// Go through the DOM
// Look for tags with "yt-formatted-string" and extract their main text
// Check against the regex above. If a title matches and contains phrases like
// "From the Soundtrack", "Main Theme", or "From the *", strip the
// trailing " - YouTube Music" and add the extracted movie/title to a list.
// Next steps (future): call an external movie API (e.g., IMDb) with the
// extracted titles and render results in `popup.js`.