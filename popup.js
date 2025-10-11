const messageEl = document.querySelector('.message');
const resultsEl = document.getElementById('results');

messageEl.innerText = 'Looking for YouTube Music in the active tab...';

// Function to run in the page context to collect titles
function collectTitles() {
    try {
        const nodes = document.querySelectorAll('.song-title.style-scope.ytmusic-player-queue-item');
        const titles = Array.from(nodes, el => el.textContent.trim()).filter(Boolean);
        return { ok: true, titles };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

// Query the active tab and execute the collector in its context
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
        messageEl.innerText = 'No active tab found.';
        return;
    }
    const tab = tabs[0];
    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            func: collectTitles,
        },
        (results) => {
            if (!results || results.length === 0) {
                messageEl.innerText = 'No results returned from page.';
                return;
            }
            const res = results[0].result;
            if (!res || !res.ok) {
                messageEl.innerText = 'Error collecting titles: ' + (res && res.error ? res.error : 'unknown');
                return;
            }
            const titles = res.titles || [];
            if (titles.length === 0) {
                messageEl.innerText = 'No song titles found on this page.';
                return;
            }
            messageEl.innerText = `Found ${titles.length} titles:`;
            const ul = document.createElement('ul');
            titles.forEach(t => {
                const li = document.createElement('li');
                li.textContent = t.replace(/ - YouTube Music$/i, '').trim();
                ul.appendChild(li);
            });
            resultsEl.innerHTML = '';
            resultsEl.appendChild(ul);
        }
    );
});