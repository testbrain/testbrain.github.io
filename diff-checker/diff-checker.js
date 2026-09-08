(function() {
    'use strict';

    const oldTextEl = document.getElementById('oldText');
    const newTextEl = document.getElementById('newText');
    const compareBtn = document.getElementById('compareBtn');
    const swapBtn = document.getElementById('swapBtn');
    const loadSampleBtn = document.getElementById('loadSampleBtn');
    const clearBtn = document.getElementById('clearBtn');
    const statsEl = document.getElementById('diffStats');
    const linesEl = document.getElementById('diffLines');
    const emptyEl = document.getElementById('diffEmpty');
    const panesHeaderEl = document.getElementById('diffPanesHeader');

    // Currently focused change (hunk) index, or null when nothing is focused.
    let activeHunkIndex = null;

    function splitLines(text) {
        return text.replace(/\r\n/g, '\n').split('\n');
    }

    function tokenize(str) {
        return str.match(/\w+|[^\w\s]|\s+/g) || [];
    }

    // ----- LCS-BASED LINE DIFF -----
    function computeLineDiff(oldStr, newStr) {
        const a = splitLines(oldStr);
        const b = splitLines(newStr);
        const n = a.length;
        const m = b.length;

        const dp = new Array(n + 1);
        for (let i = 0; i <= n; i++) dp[i] = new Int32Array(m + 1);

        for (let i = n - 1; i >= 0; i--) {
            for (let j = m - 1; j >= 0; j--) {
                dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }

        const rows = [];
        let i = 0, j = 0;

        while (i < n && j < m) {
            if (a[i] === b[j]) {
                rows.push({ type: 'context', oldLn: i + 1, newLn: j + 1, text: a[i] });
                i++; j++;
            } else if (dp[i + 1][j] >= dp[i][j + 1]) {
                rows.push({ type: 'removed', oldLn: i + 1, newLn: null, text: a[i] });
                i++;
            } else {
                rows.push({ type: 'added', oldLn: null, newLn: j + 1, text: b[j] });
                j++;
            }
        }
        while (i < n) { rows.push({ type: 'removed', oldLn: i + 1, newLn: null, text: a[i] }); i++; }
        while (j < m) { rows.push({ type: 'added', oldLn: null, newLn: j + 1, text: b[j] }); j++; }

        return { rows, oldLines: a, newLines: b };
    }

    // ----- LCS-BASED TOKEN (WORD) DIFF, for highlighting within a paired line -----
    function diffTokens(oldStr, newStr) {
        const a = tokenize(oldStr);
        const b = tokenize(newStr);
        const n = a.length, m = b.length;

        const dp = new Array(n + 1);
        for (let i = 0; i <= n; i++) dp[i] = new Int32Array(m + 1);
        for (let i = n - 1; i >= 0; i--) {
            for (let j = m - 1; j >= 0; j--) {
                dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }

        let i = 0, j = 0;
        const oldTok = [], newTok = [];
        while (i < n && j < m) {
            if (a[i] === b[j]) {
                oldTok.push({ text: a[i], changed: false });
                newTok.push({ text: b[j], changed: false });
                i++; j++;
            } else if (dp[i + 1][j] >= dp[i][j + 1]) {
                oldTok.push({ text: a[i], changed: true });
                i++;
            } else {
                newTok.push({ text: b[j], changed: true });
                j++;
            }
        }
        while (i < n) { oldTok.push({ text: a[i], changed: true }); i++; }
        while (j < m) { newTok.push({ text: b[j], changed: true }); j++; }

        return { oldTok, newTok };
    }

    // ----- Group the flat row list into context rows + hunks (runs of removed/added) -----
    function buildHunks(rows) {
        const items = [];
        let lastOldLn = 0, lastNewLn = 0;
        let i = 0;
        while (i < rows.length) {
            const row = rows[i];
            if (row.type === 'context') {
                items.push({ kind: 'context', row });
                lastOldLn = row.oldLn;
                lastNewLn = row.newLn;
                i++;
                continue;
            }
            const removed = [];
            const added = [];
            while (i < rows.length && rows[i].type !== 'context') {
                if (rows[i].type === 'removed') removed.push(rows[i]);
                else added.push(rows[i]);
                i++;
            }
            items.push({
                kind: 'hunk',
                removed,
                added,
                anchorOldLn: lastOldLn,
                anchorNewLn: lastNewLn
            });
        }
        return items;
    }

    function el(tag, className) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        return node;
    }

    function cell(className, text) {
        const node = el('div', className);
        node.textContent = text === undefined ? '' : text;
        return node;
    }

    function appendTokens(container, tokens, sideClass) {
        tokens.forEach((tok) => {
            if (tok.changed) {
                const span = el('span', 'tok-diff');
                span.textContent = tok.text;
                container.appendChild(span);
            } else {
                container.appendChild(document.createTextNode(tok.text));
            }
        });
    }

    function contentCell(text, tokens) {
        const node = el('div', 'cell content');
        if (tokens) {
            appendTokens(node, tokens);
        } else {
            node.textContent = text === undefined ? '' : text;
        }
        return node;
    }

    // ----- State kept between compare/merge/navigate calls -----
    let state = null; // { rows, oldLines, newLines, hunks }

    function analyze() {
        const oldText = oldTextEl.value;
        const newText = newTextEl.value;
        const { rows, oldLines, newLines } = computeLineDiff(oldText, newText);
        const items = buildHunks(rows);
        const hunks = items.filter((it) => it.kind === 'hunk');
        state = { rows, oldLines, newLines, items, hunks };
        return state;
    }

    function renderRowContext(frag, row) {
        frag.appendChild(cell('cell ln', String(row.oldLn)));
        frag.appendChild(cell('cell marker', ' '));
        frag.appendChild(contentCell(row.text));
        frag.appendChild(cell('cell ln col-new-ln', String(row.newLn)));
        frag.appendChild(cell('cell marker', ' '));
        frag.appendChild(contentCell(row.text));
    }

    function renderHunkRows(frag, hunk, hunkIndex) {
        const pairCount = Math.min(hunk.removed.length, hunk.added.length);
        const total = Math.max(hunk.removed.length, hunk.added.length);
        const isActive = hunkIndex === activeHunkIndex;

        for (let k = 0; k < total; k++) {
            const oldRow = hunk.removed[k];
            const newRow = hunk.added[k];
            const paired = k < pairCount;
            let oldTokens = null, newTokens = null;
            if (paired) {
                const d = diffTokens(oldRow.text, newRow.text);
                oldTokens = d.oldTok;
                newTokens = d.newTok;
            }

            // Old (left) side
            if (oldRow) {
                const rowClass = 'row-removed side-old' + (isActive ? ' row-active' : '');
                const lnCell = cell('cell ln', String(oldRow.oldLn));
                lnCell.classList.add(rowClass.split(' ')[0], 'side-old');
                if (isActive) lnCell.classList.add('row-active');
                lnCell.dataset.hunk = String(hunkIndex);
                frag.appendChild(lnCell);

                const markerCell = cell('cell marker', '−');
                markerCell.classList.add('row-removed', 'side-old');
                if (isActive) markerCell.classList.add('row-active');
                markerCell.dataset.hunk = String(hunkIndex);
                frag.appendChild(markerCell);

                const cCell = contentCell(oldRow.text, oldTokens);
                cCell.classList.add('row-removed', 'side-old');
                if (isActive) cCell.classList.add('row-active');
                cCell.dataset.hunk = String(hunkIndex);
                frag.appendChild(cCell);
            } else {
                frag.appendChild(cell('cell ln row-empty'));
                frag.appendChild(cell('cell marker row-empty'));
                frag.appendChild(cell('cell content row-empty'));
            }

            // New (right) side
            if (newRow) {
                const lnCell = cell('cell ln col-new-ln', String(newRow.newLn));
                lnCell.classList.add('row-added', 'side-new');
                if (isActive) lnCell.classList.add('row-active');
                lnCell.dataset.hunk = String(hunkIndex);
                frag.appendChild(lnCell);

                const markerCell = cell('cell marker', '+');
                markerCell.classList.add('row-added', 'side-new');
                if (isActive) markerCell.classList.add('row-active');
                markerCell.dataset.hunk = String(hunkIndex);
                frag.appendChild(markerCell);

                const cCell = contentCell(newRow.text, newTokens);
                cCell.classList.add('row-added', 'side-new');
                if (isActive) cCell.classList.add('row-active');
                cCell.dataset.hunk = String(hunkIndex);
                frag.appendChild(cCell);
            } else {
                frag.appendChild(cell('cell ln col-new-ln row-empty'));
                frag.appendChild(cell('cell marker row-empty'));
                frag.appendChild(cell('cell content row-empty'));
            }
        }
    }

    function renderChangePanel(frag, hunkIndex, total) {
        const panel = el('div', 'change-panel');

        const head = el('div', 'change-panel-head');
        const title = el('span', 'change-panel-title');
        title.textContent = 'Change ' + (hunkIndex + 1) + ' of ' + total;
        head.appendChild(title);

        const nav = el('div', 'change-panel-nav');
        const prevBtn = el('button', 'change-nav-btn');
        prevBtn.type = 'button';
        prevBtn.textContent = '↑ Previous change';
        prevBtn.dataset.nav = 'prev';
        if (hunkIndex <= 0) prevBtn.disabled = true;

        const nextBtn = el('button', 'change-nav-btn');
        nextBtn.type = 'button';
        nextBtn.textContent = '↓ Next change';
        nextBtn.dataset.nav = 'next';
        if (hunkIndex >= total - 1) nextBtn.disabled = true;

        nav.appendChild(prevBtn);
        nav.appendChild(nextBtn);
        head.appendChild(nav);
        panel.appendChild(head);

        const actions = el('div', 'change-panel-actions');

        const mergeOld = el('button', 'merge-btn merge-old');
        mergeOld.type = 'button';
        mergeOld.dataset.merge = 'newFromOld';
        mergeOld.innerHTML = '';
        mergeOld.appendChild(document.createTextNode('Merge change '));
        const arrowRight = el('span', 'arrow');
        arrowRight.textContent = '›';
        mergeOld.appendChild(arrowRight);

        const dismiss = el('button', 'merge-dismiss');
        dismiss.type = 'button';
        dismiss.dataset.dismiss = '1';
        dismiss.textContent = '×';

        const mergeNew = el('button', 'merge-btn merge-new');
        mergeNew.type = 'button';
        mergeNew.dataset.merge = 'oldFromNew';
        const arrowLeft = el('span', 'arrow');
        arrowLeft.textContent = '‹';
        mergeNew.appendChild(arrowLeft);
        mergeNew.appendChild(document.createTextNode(' Merge change'));

        actions.appendChild(mergeOld);
        actions.appendChild(dismiss);
        actions.appendChild(mergeNew);
        panel.appendChild(actions);

        panel.dataset.hunk = String(hunkIndex);
        frag.appendChild(panel);
    }

    function render() {
        if (!state) return;
        const { items, hunks, rows } = state;

        linesEl.innerHTML = '';
        const frag = document.createDocumentFragment();

        let hunkCounter = 0;
        items.forEach((item) => {
            if (item.kind === 'context') {
                renderRowContext(frag, item.row);
            } else {
                const hunkIndex = hunkCounter;
                renderHunkRows(frag, item, hunkIndex);
                if (hunkIndex === activeHunkIndex) {
                    renderChangePanel(frag, hunkIndex, hunks.length);
                }
                hunkCounter++;
            }
        });

        linesEl.appendChild(frag);

        const added = rows.filter((r) => r.type === 'added').length;
        const removed = rows.filter((r) => r.type === 'removed').length;
        const unchanged = rows.filter((r) => r.type === 'context').length;

        let statsHtml =
            '<span class="added">＋ <span class="num">' + added + '</span> added</span>' +
            '<span class="removed">－ <span class="num">' + removed + '</span> removed</span>' +
            '<span>= <span class="num">' + unchanged + '</span> unchanged</span>';

        if (hunks.length > 0) {
            statsHtml += '<span class="change-nav-inline diff-changes-count">' +
                '<span>' + hunks.length + ' change' + (hunks.length === 1 ? '' : 's') + '</span>' +
                '<button type="button" class="change-nav-btn" data-nav="prev"' + (activeHunkIndex === null || activeHunkIndex <= 0 ? ' disabled' : '') + '>↑</button>' +
                '<button type="button" class="change-nav-btn" data-nav="next"' + (activeHunkIndex === null ? '' : (activeHunkIndex >= hunks.length - 1 ? ' disabled' : '')) + '>↓</button>' +
                '</span>';
        }
        statsEl.innerHTML = statsHtml;

        const hasContent = oldTextEl.value.length > 0 || newTextEl.value.length > 0;
        emptyEl.classList.toggle('visible', !hasContent);
        panesHeaderEl.classList.toggle('visible', hasContent);
    }

    function scrollActiveIntoView() {
        const target = linesEl.querySelector('.change-panel[data-hunk="' + activeHunkIndex + '"]') ||
            linesEl.querySelector('[data-hunk="' + activeHunkIndex + '"]');
        if (target && target.scrollIntoView) {
            target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }

    function setActiveHunk(index) {
        if (!state) return;
        if (index === null || index < 0 || index >= state.hunks.length) {
            activeHunkIndex = state.hunks.length > 0 ? Math.min(Math.max(index || 0, 0), state.hunks.length - 1) : null;
        } else {
            activeHunkIndex = index;
        }
        render();
        if (activeHunkIndex !== null) scrollActiveIntoView();
    }

    // Splice `insertLines` into `targetLines` replacing the range that corresponds to
    // the hunk's side being overwritten (identified by the rows on that side, or by
    // the anchor position when that side has no rows of its own, i.e. a pure insertion).
    function spliceLines(targetLines, rowsOnThatSide, anchorLn, insertLines) {
        let start, deleteCount;
        if (rowsOnThatSide.length > 0) {
            const firstLn = rowsOnThatSide[0].oldLn !== null ? rowsOnThatSide[0].oldLn : rowsOnThatSide[0].newLn;
            start = firstLn - 1;
            deleteCount = rowsOnThatSide.length;
        } else {
            start = anchorLn;
            deleteCount = 0;
        }
        const result = targetLines.slice();
        result.splice(start, deleteCount, ...insertLines);
        return result;
    }

    function mergeHunk(hunkIndex, direction) {
        if (!state) return;
        const hunk = state.hunks[hunkIndex];
        if (!hunk) return;

        if (direction === 'newFromOld') {
            // Make the "Changed" side match the "Original" side for this hunk.
            const insert = hunk.removed.map((r) => r.text);
            const newLines = spliceLines(state.newLines, hunk.added, hunk.anchorNewLn, insert);
            newTextEl.value = newLines.join('\n');
        } else {
            // Make the "Original" side match the "Changed" side for this hunk.
            const insert = hunk.added.map((r) => r.text);
            const oldLines = spliceLines(state.oldLines, hunk.removed, hunk.anchorOldLn, insert);
            oldTextEl.value = oldLines.join('\n');
        }

        const prevIndex = hunkIndex;
        analyze();
        if (state.hunks.length === 0) {
            activeHunkIndex = null;
        } else {
            activeHunkIndex = Math.min(prevIndex, state.hunks.length - 1);
        }
        render();
        if (activeHunkIndex !== null) scrollActiveIntoView();
    }

    function handleResultClick(e) {
        const navBtn = e.target.closest('[data-nav]');
        if (navBtn) {
            if (navBtn.disabled) return;
            const dir = navBtn.dataset.nav;
            if (!state || state.hunks.length === 0) return;
            const base = activeHunkIndex === null ? -1 : activeHunkIndex;
            const next = dir === 'next' ? base + 1 : base - 1;
            setActiveHunk(Math.min(Math.max(next, 0), state.hunks.length - 1));
            return;
        }

        const mergeBtn = e.target.closest('[data-merge]');
        if (mergeBtn) {
            const panel = mergeBtn.closest('.change-panel');
            const idx = parseInt(panel.dataset.hunk, 10);
            mergeHunk(idx, mergeBtn.dataset.merge);
            return;
        }

        const dismissBtn = e.target.closest('[data-dismiss]');
        if (dismissBtn) {
            activeHunkIndex = null;
            render();
            return;
        }

        const hunkCell = e.target.closest('[data-hunk]');
        if (hunkCell && !hunkCell.closest('.change-panel')) {
            setActiveHunk(parseInt(hunkCell.dataset.hunk, 10));
        }
    }

    linesEl.addEventListener('click', handleResultClick);
    statsEl.addEventListener('click', handleResultClick);

    compareBtn.addEventListener('click', () => {
        analyze();
        activeHunkIndex = state.hunks.length > 0 ? 0 : null;
        render();
        if (activeHunkIndex !== null) scrollActiveIntoView();
    });

    swapBtn.addEventListener('click', () => {
        const tmp = oldTextEl.value;
        oldTextEl.value = newTextEl.value;
        newTextEl.value = tmp;
    });

    loadSampleBtn.addEventListener('click', () => {
        var sampleOld = `function add(a, b) {
    return a + b;
}

function subtract(a, b) {
    return a - b;
}

function multiply(a, b, c) {
    return a * b * c;
}

function divide(a, b) {
    if (b === 0) {
        throw new Error("Cannot divide by zero");
    }
    return a / b;
}

function squareRoot(x) {
    if (x < 0) {
        throw new Error("Cannot take square root of negative number");
    }
    return Math.sqrt(x);
}

function factorial(n) {
    if (n < 0) {
        throw new Error("Cannot compute factorial of negative number");
    }
    if (n === 0 || n === 1) {
        return 1;
    }
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function fibonacci(n) {
    if (n < 0) {
        throw new Error("Cannot compute Fibonacci of negative number");
    }
    if (n === 0) return 0;
    if (n === 1) return 1;
    let a = 0, b = 1, temp;
    for (let i = 2; i <= n; i++) {
        temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}`; 

        var sampleNew = `function add(a, b) {
    return a + b;
}

function subtract(a, b) {
    return a - b;
}

function multiply(a, b) {
    return a * b;
}

function divide(a, b) {
    if (b === 0) {
        throw new Error("Cannot divide by zero");
    }
    return a / b;
}

function power(base, exponent) {
    return Math.pow(base, exponent);
}

function squareRoot(x) {
    if (x < 0) {
        throw new Error("Cannot take square root of negative number");
    }
    return Math.sqrt(x);
}

function factorial(n) {
    if (n < 0) {
        throw new Error("Cannot compute factorial of negative number");
    }
    if (n === 0 || n === 1) {
        return 1;
    }
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function fibonacci(n) {
    if (n < 0) {
        throw new Error("Cannot compute Fibonacci of negative number");
    }
    if (n === 0) return 0;
    if (n === 1) return 1;
    let a = 0, b = 1, temp;
    for (let i = 2; i <= n; i++) {
        temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}

function isPrime(num) {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
}`;

        oldTextEl.value = sampleOld;
        newTextEl.value = sampleNew;
        // analyze();
        // activeHunkIndex = state.hunks.length > 0 ? 0 : null;
        // render();
        // if (activeHunkIndex !== null) scrollActiveIntoView();
    })

    clearBtn.addEventListener('click', () => {
        oldTextEl.value = '';
        newTextEl.value = '';
        state = null;
        activeHunkIndex = null;
        linesEl.innerHTML = '';
        statsEl.innerHTML = '';
        panesHeaderEl.classList.remove('visible');
        emptyEl.classList.add('visible');
        oldTextEl.focus();
    });

})();