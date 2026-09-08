(function() {
    'use strict';

    const STORAGE_KEY = 'devtools-json-data';

    const treeEl = document.getElementById('jsonTree');
    const emptyEl = document.getElementById('jsonEmpty');
    const statsEl = document.getElementById('jsonStats');
    const toast = document.getElementById('toast');
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const searchCount = document.getElementById('searchCount');
    const searchPrev = document.getElementById('searchPrev');
    const searchNext = document.getElementById('searchNext');

    let rootData = null;
    let rawString = '';
    let matches = [];
    let currentMatchIndex = -1;

    // ----- TOAST -----
    let toastTimeout = null;
    function showToast(message) {
        toast.textContent = message;
        toast.className = 'toast';
        void toast.offsetWidth;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // ----- SMALL HELPERS -----
    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function countKeys(value) {
        if (Array.isArray(value)) {
            return value.reduce((sum, v) => sum + countKeys(v), value.length);
        }
        if (value !== null && typeof value === 'object') {
            return Object.keys(value).reduce((sum, k) => sum + countKeys(value[k]), Object.keys(value).length);
        }
        return 0;
    }

    // ----- VALUE RENDERING (primitives) -----
    function valueSpan(value) {
        if (typeof value === 'string') {
            const span = el('span', 'json-string', JSON.stringify(value));
            return span;
        }
        if (typeof value === 'number') return el('span', 'json-number', String(value));
        if (typeof value === 'boolean') return el('span', 'json-boolean', String(value));
        if (value === null) return el('span', 'json-null', 'null');
        return el('span', '', String(value));
    }

    // ----- BUILD A NODE (key optional, value required) -----
    function buildNode(key, value, isLast) {
        const node = el('div', 'json-node');
        const isContainer = value !== null && typeof value === 'object';
        const isArray = Array.isArray(value);

        const line = el('div', 'json-line');
        node.appendChild(line);

        // toggle / spacer
        let toggleBtn = null;
        if (isContainer && Object.keys(value).length > 0) {
            toggleBtn = el('button', 'json-toggle', '▾');
        } else {
            toggleBtn = el('span', 'json-toggle spacer', '▾');
        }
        line.appendChild(toggleBtn);

        // key
        if (key !== null) {
            line.appendChild(el('span', 'json-key', `"${key}"`));
            line.appendChild(el('span', 'json-colon', ':'));
        }

        if (!isContainer) {
            line.appendChild(valueSpan(value));
            if (!isLast) line.appendChild(el('span', 'json-punct', ','));
            return node;
        }

        const openBrace = isArray ? '[' : '{';
        const closeBrace = isArray ? ']' : '}';
        const entries = isArray ? value.map((v, i) => [i, v]) : Object.keys(value).map(k => [k, value[k]]);

        line.appendChild(el('span', 'json-punct', openBrace));

        if (entries.length === 0) {
            line.appendChild(el('span', 'json-punct', closeBrace + (isLast ? '' : ',')));
            if (toggleBtn.tagName === 'BUTTON') toggleBtn.className = 'json-toggle spacer';
            return node;
        }

        const summary = el('span', 'json-summary', ` ${entries.length} ${isArray ? 'items' : 'keys'} `);
        line.appendChild(summary);

        const childrenWrap = el('div', 'json-children');
        node.appendChild(childrenWrap);

        entries.forEach(([k, v], idx) => {
            const childKey = isArray ? null : k;
            childrenWrap.appendChild(buildNode(childKey, v, idx === entries.length - 1));
        });

        const closingLine = el('div', 'json-line');
        closingLine.appendChild(el('span', 'json-toggle spacer', ''));
        closingLine.appendChild(el('span', 'json-punct', closeBrace + (isLast ? '' : ',')));
        childrenWrap.appendChild(closingLine);

        function setCollapsed(collapsed) {
            childrenWrap.classList.toggle('hidden', collapsed);
            toggleBtn.classList.toggle('collapsed', collapsed);
            summary.style.display = collapsed ? 'inline' : 'none';
        }
        setCollapsed(false);

        toggleBtn.addEventListener('click', () => {
            setCollapsed(!childrenWrap.classList.contains('hidden'));
        });
        summary.addEventListener('click', () => {
            setCollapsed(!childrenWrap.classList.contains('hidden'));
        });

        node._setCollapsed = setCollapsed;
        return node;
    }

    // ----- RENDER ROOT -----
    function render(data) {
        treeEl.innerHTML = '';
        treeEl.appendChild(buildNode(null, data, true));
    }

    // ----- EXPAND / COLLAPSE ALL -----
    function setAllCollapsed(collapsed) {
        treeEl.querySelectorAll('.json-node').forEach((node) => {
            if (typeof node._setCollapsed === 'function') node._setCollapsed(collapsed);
        });
    }

    document.getElementById('expandAllBtn').addEventListener('click', () => setAllCollapsed(false));
    document.getElementById('collapseAllBtn').addEventListener('click', () => setAllCollapsed(true));

    // ----- COPY / DOWNLOAD -----
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (_) {
            return false;
        }
    }

    document.getElementById('copyBtn').addEventListener('click', async () => {
        const ok = await copyToClipboard(rawString);
        showToast(ok ? '✓ Copied formatted JSON' : '× Failed to copy');
    });

    document.getElementById('downloadBtn').addEventListener('click', () => {
        const blob = new Blob([rawString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    // ----- SEARCH -----
    function updateCountLabel() {
        if (!searchCount) return;
        if (matches.length === 0) {
            searchCount.textContent = searchInput.value.trim() ? '0/0' : '';
        } else {
            searchCount.textContent = `${currentMatchIndex + 1}/${matches.length}`;
        }
        if (searchPrev) searchPrev.disabled = matches.length === 0;
        if (searchNext) searchNext.disabled = matches.length === 0;
    }

    function goToMatch(index) {
        if (matches.length === 0) return;
        currentMatchIndex = ((index % matches.length) + matches.length) % matches.length;

        matches.forEach((m) => m.classList.remove('current-match'));
        const target = matches[currentMatchIndex];
        target.classList.add('current-match');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        updateCountLabel();
    }

    function handleSearch() {
        const term = searchInput.value.toLowerCase().trim();
        searchClear.classList.toggle('visible', term.length > 0);

        treeEl.querySelectorAll('.json-line').forEach((line) => {
            line.classList.remove('match-highlight', 'current-match');
        });

        matches = [];
        currentMatchIndex = -1;

        if (!term) {
            updateCountLabel();
            return;
        }

        treeEl.querySelectorAll('.json-line').forEach((line) => {
            const text = line.textContent.toLowerCase();
            if (text.includes(term)) {
                line.classList.add('match-highlight');
                // expand all ancestor containers so the match is visible
                let ancestor = line.closest('.json-children');
                while (ancestor) {
                    ancestor.classList.remove('hidden');
                    const parentNode = ancestor.parentElement;
                    if (parentNode && typeof parentNode._setCollapsed === 'function') {
                        const toggle = parentNode.querySelector(':scope > .json-line > .json-toggle');
                        if (toggle) toggle.classList.remove('collapsed');
                        const summary = parentNode.querySelector(':scope > .json-line > .json-summary');
                        if (summary) summary.style.display = 'none';
                    }
                    ancestor = parentNode ? parentNode.closest('.json-children') : null;
                }
            }
        });

        // matches collected in document (top-to-bottom) order
        matches = Array.from(treeEl.querySelectorAll('.json-line.match-highlight'));

        if (matches.length > 0) {
            goToMatch(0);
        } else {
            updateCountLabel();
        }
    }

    searchInput.addEventListener('input', handleSearch);

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                goToMatch(currentMatchIndex - 1);
            } else {
                goToMatch(currentMatchIndex + 1);
            }
        }
    });

    if (searchNext) searchNext.addEventListener('click', () => goToMatch(currentMatchIndex + 1));
    if (searchPrev) searchPrev.addEventListener('click', () => goToMatch(currentMatchIndex - 1));

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        handleSearch();
        searchInput.focus();
    });

    // ----- INIT -----
    document.addEventListener('DOMContentLoaded', () => {
        const stored = localStorage.getItem(STORAGE_KEY);

        if (!stored) {
            emptyEl.classList.add('visible');
            statsEl.innerHTML = '<span>No data</span>';
            return;
        }

        try {
            rootData = JSON.parse(stored);
        } catch (_) {
            emptyEl.classList.add('visible');
            emptyEl.querySelector('p').textContent = 'Stored data was corrupted. Go back and format again.';
            statsEl.innerHTML = '<span>No data</span>';
            return;
        }

        rawString = JSON.stringify(rootData, null, 2);
        render(rootData);

        const sizeKb = (new Blob([rawString]).size / 1024).toFixed(1);
        const keyCount = countKeys(rootData);
        statsEl.innerHTML = `
            <span>📏 <span class="num">${sizeKb} KB</span></span>
            <span>🔑 <span class="num">${keyCount}</span> keys</span>
        `;
    });

})();