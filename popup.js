const messageEl = document.querySelector('.message');
const resultsEl = document.getElementById('results');
const spinnerWrap = document.getElementById('spinnerWrap');
const refreshBtn = document.getElementById('refreshBtn');
const closeBtn = document.getElementById('closeBtn');
const badgeEl = document.getElementById('badge');

function setMessage(msg) {
    messageEl.innerText = msg || '';
}

function showSpinner(show) {
    spinnerWrap.innerHTML = show ? '<span class="spinner" aria-hidden="true"></span>' : '';
}

// Function injected into the page to collect titles (runs in page context)
function collectTitles() {
    try {
        // Try direct selector
        const nodes = document.querySelectorAll('.song-title.style-scope.ytmusic-player-queue-item');
        let titles = Array.from(nodes, el => el.textContent && el.textContent.trim()).filter(Boolean);

        // If nothing found, try yt-formatted-string fallback
        if (titles.length === 0) {
            const nodes2 = document.querySelectorAll('yt-formatted-string.song-title, yt-formatted-string');
            titles = Array.from(nodes2, el => el.textContent && el.textContent.trim()).filter(Boolean);
        }

        return { ok: true, titles };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

function renderTitles(titles) {
    resultsEl.innerHTML = '';
    if (!titles || titles.length === 0) {
        resultsEl.innerHTML = '<div class="empty">No soundtrack titles found.</div>';
        badgeEl.style.display = 'none';
        return;
    }

    // Filter soundtrack-like titles and extract movie names
    const soundtrackPatterns = [
        /From the Movie\s*[:\-]?\s*(.+)$/gi,
        /From the Soundtrack\s*[:\-]?\s*(.+)$/gi,
        /from the series\s*[:\-]?\s*(.+)/gi,
        /From\s+(.+)\s*[:\-]?/gi,
        /Movie Track\s*[:\-]?\s*(.+)$/gi,
        /Main Theme from\s+(.+)$/gi,
    ];

    const candidates = [];
    titles.forEach(raw => {
        const t = raw.replace(/ - YouTube Music$/i, '').trim();
        for (const p of soundtrackPatterns) {
            const m = t.match(p);
            if (m && m[1]) {
                const name = m[1].replace(/"|\(|\)|\[|\]|\.|\-/g, '').trim();
                if (name) candidates.push(name);
                break;
            }
        }
    });

    // dedupe
    const movies = [...new Set(candidates)];

    // update badge
    badgeEl.style.display = movies.length ? 'inline-block' : 'none';
    badgeEl.textContent = movies.length;

    const OMDB_KEY = '67f8031e'; // <<--- replace with your own key if needed
    const cache = {};

    async function fetchOmdb(q) {
        if (!q) return null;
        if (cache[q]) return cache[q];
        try {
            const url = `https://www.omdbapi.com/?apikey=${OMDB_KEY}&t=${encodeURIComponent(q)}`;
            const resp = await fetch(url);
            const data = await resp.json();
            cache[q] = data;
            return data;
        } catch (e) {
            return null;
        }
    }

    // show placeholder cards while loading
    movies.forEach((m, i) => {
        const card = document.createElement('div'); card.className = 'card'; card.style.animationDelay = `${i * 30}ms`;
        card.innerHTML = `<div style="display:flex;gap:10px;align-items:center"><div style="width:60px;height:80px;background:var(--glass);border-radius:6px"></div><div style="flex:1"><div class="title">${m}</div><div class="meta">Loading info...</div></div></div>`;
        resultsEl.appendChild(card);
    });

    // fetch OMDb info and replace cards
    Promise.all(movies.map(m => fetchOmdb(m))).then(datas => {
        resultsEl.innerHTML = '';
        datas.forEach((data, i) => {
            const m = movies[i];
            const card = document.createElement('div'); card.className = 'card'; card.style.animationDelay = `${i * 30}ms`;
            const imgUrl = (data && data.Poster && data.Poster !== 'N/A') ? data.Poster : null;
            const left = document.createElement('div'); left.style.display = 'flex'; left.style.alignItems = 'center'; left.style.gap = '10px';
            const poster = document.createElement('div'); poster.style.width = '60px'; poster.style.height = '80px'; poster.style.borderRadius = '6px'; poster.style.backgroundSize = 'cover'; poster.style.backgroundPosition = 'center'; poster.style.backgroundColor = 'var(--glass)';
            if (imgUrl) poster.style.backgroundImage = `url(${imgUrl})`;
            const info = document.createElement('div'); info.style.flex = '1';
            const title = document.createElement('div'); title.className = 'title'; title.textContent = data && data.Title ? data.Title : m;
            const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = data && data.Year ? `${data.Year} • ${data.Genre || ''}` : 'No details';
            info.appendChild(title); info.appendChild(meta);
            left.appendChild(poster); left.appendChild(info);

            const actions = document.createElement('div'); actions.className = 'card-actions';
            const imdbBtn = document.createElement('button'); imdbBtn.className = 'small-btn'; imdbBtn.textContent = 'Open on IMDb';
            imdbBtn.addEventListener('click', () => {
                const q = data && data.imdbID ? `https://www.imdb.com/title/${data.imdbID}` : `https://www.imdb.com/find?q=${encodeURIComponent(m)}`;
                chrome.tabs.create({ url: q });
            });
            const copyBtn = document.createElement('button'); copyBtn.className = 'small-btn'; copyBtn.textContent = 'Copy';
            copyBtn.addEventListener('click', async () => { try { await navigator.clipboard.writeText(data && data.Title ? data.Title : m); const s = document.createElement('span'); s.className = 'copied'; s.textContent = 'Copied!'; copyBtn.parentNode.appendChild(s); setTimeout(() => s.remove(), 1200); } catch (e) { alert('Copy failed') } });

            actions.appendChild(imdbBtn); actions.appendChild(copyBtn);

            card.appendChild(left); card.appendChild(actions);
            resultsEl.appendChild(card);
        });
    });
}

function findTitles() {
    setMessage('Looking for YouTube Music in the active tab...');
    showSpinner(true);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
            showSpinner(false);
            setMessage('No active tab found.');
            renderTitles([]);
            return;
        }
        const tab = tabs[0];
        chrome.scripting.executeScript(
            { target: { tabId: tab.id }, func: collectTitles },
            (results) => {
                showSpinner(false);
                if (!results || results.length === 0) {
                    setMessage('No results returned from page.');
                    renderTitles([]);
                    return;
                }
                const res = results[0].result;
                if (!res || !res.ok) {
                    setMessage('Error collecting titles: ' + (res && res.error ? res.error : 'unknown'));
                    renderTitles([]);
                    return;
                }
                const titles = res.titles || [];
                if (titles.length === 0) {
                    setMessage('No song titles found on this page.');
                    renderTitles([]);
                    return;
                }
                setMessage(`Found ${titles.length} titles:`);
                renderTitles(titles);
            }
        );
    });
}

refreshBtn.addEventListener('click', () => findTitles());
closeBtn.addEventListener('click', () => window.close());

findTitles();