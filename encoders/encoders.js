(function() {
    'use strict';

    const toast = document.getElementById('toast');
    let toastTimeout = null;
    function showToast(message) {
        toast.textContent = message;
        toast.className = 'toast';
        void toast.offsetWidth;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (_) {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
                return true;
            } catch (_) {
                return false;
            }
        }
    }

    // ----- TABS -----
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            tabBtns.forEach((b) => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
        });
    });

    // ----- GENERIC COPY BUTTONS (data-copy-target) -----
    document.querySelectorAll('.io-copy').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const targetEl = document.getElementById(btn.dataset.copyTarget);
            if (!targetEl || !targetEl.value) {
                showToast('⚠️ Nothing to copy');
                return;
            }
            const ok = await copyText(targetEl.value);
            showToast(ok ? '✓ Copied to clipboard' : '× Failed to copy');
        });
    });

    // ========== BASE64 ==========
    const b64Input = document.getElementById('b64Input');
    const b64Output = document.getElementById('b64Output');

    function base64Encode(str) {
        const bytes = new TextEncoder().encode(str);
        let binary = '';
        bytes.forEach((b) => { binary += String.fromCharCode(b); });
        return btoa(binary);
    }

    function base64Decode(str) {
        const binary = atob(str.trim());
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
    }

    let b64Mode = 'encode';
    document.querySelectorAll('#b64Mode .mode-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#b64Mode .mode-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            b64Mode = btn.dataset.mode;
            runBase64();
        });
    });

    function runBase64() {
        const value = b64Input.value;
        if (!value) { b64Output.value = ''; return; }
        try {
            b64Output.value = b64Mode === 'encode' ? base64Encode(value) : base64Decode(value);
        } catch (e) {
            b64Output.value = '⚠️ Invalid Base64 input';
        }
    }

    b64Input.addEventListener('input', runBase64);

    // ========== URL ENCODE/DECODE ==========
    const urlInput = document.getElementById('urlInput');
    const urlOutput = document.getElementById('urlOutput');

    let urlMode = 'encode';
    document.querySelectorAll('#urlMode .mode-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#urlMode .mode-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            urlMode = btn.dataset.mode;
            runUrl();
        });
    });

    function runUrl() {
        const value = urlInput.value;
        if (!value) { urlOutput.value = ''; return; }
        try {
            urlOutput.value = urlMode === 'encode' ? encodeURIComponent(value) : decodeURIComponent(value);
        } catch (e) {
            urlOutput.value = '⚠️ Invalid encoded input';
        }
    }

    urlInput.addEventListener('input', runUrl);

    // ========== HASH ==========
    const hashInput = document.getElementById('hashInput');
    const hashList = document.getElementById('hashList');
    const HASH_ALGOS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

    function bufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    async function generateHashes() {
        const text = hashInput.value;
        if (!text) {
            hashList.innerHTML = '';
            return;
        }
        const bytes = new TextEncoder().encode(text);
        hashList.innerHTML = '';

        for (const algo of HASH_ALGOS) {
            const digest = await crypto.subtle.digest(algo, bytes);
            const hex = bufferToHex(digest);

            const row = document.createElement('div');
            row.className = 'hash-row';

            const label = document.createElement('div');
            label.className = 'hash-label';

            const labelText = document.createElement('span');
            labelText.textContent = algo;
            label.appendChild(labelText);

            const copyBtn = document.createElement('button');
            copyBtn.className = 'btn-copy';
            copyBtn.textContent = '📋 Copy';
            copyBtn.addEventListener('click', async () => {
                const ok = await copyText(hex);
                showToast(ok ? '✓ Copied ' + algo : '× Failed to copy');
            });
            label.appendChild(copyBtn);

            const value = document.createElement('div');
            value.className = 'hash-value';
            value.textContent = hex;

            row.appendChild(label);
            row.appendChild(value);
            hashList.appendChild(row);
        }
    }

    let hashDebounce = null;
    hashInput.addEventListener('input', () => {
        clearTimeout(hashDebounce);
        hashDebounce = setTimeout(generateHashes, 150);
    });

    // ========== TIMESTAMP ==========
    const tsInput = document.getElementById('tsInput');
    const tsUnit = document.getElementById('tsUnit');
    const tsToDateResult = document.getElementById('tsToDateResult');
    const dateInput = document.getElementById('dateInput');
    const dateToTsResult = document.getElementById('dateToTsResult');

    function pad(n) { return String(n).padStart(2, '0'); }

    function toDatetimeLocalValue(date) {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    document.getElementById('tsNowBtn').addEventListener('click', () => {
        const now = Date.now();
        tsInput.value = tsUnit.value === 'ms' ? now : Math.floor(now / 1000);
        runTsToDate();
    });

    function runTsToDate() {
        const raw = tsInput.value.trim();
        if (raw === '' || isNaN(Number(raw))) {
            tsToDateResult.innerHTML = '';
            return;
        }
        const ms = tsUnit.value === 'ms' ? Number(raw) : Number(raw) * 1000;
        const date = new Date(ms);
        if (isNaN(date.getTime())) {
            tsToDateResult.innerHTML = '<div>⚠️ Invalid timestamp</div>';
            return;
        }
        tsToDateResult.innerHTML = `
            <div><span class="row-label">Local:</span>${date.toString()}</div>
            <div><span class="row-label">UTC:</span>${date.toUTCString()}</div>
            <div><span class="row-label">ISO:</span>${date.toISOString()}</div>
        `;
    }

    tsInput.addEventListener('input', runTsToDate);
    tsUnit.addEventListener('change', runTsToDate);

    function runDateToTs() {
        if (!dateInput.value) {
            dateToTsResult.innerHTML = '';
            return;
        }
        const date = new Date(dateInput.value);
        if (isNaN(date.getTime())) {
            dateToTsResult.innerHTML = '<div>⚠️ Invalid date</div>';
            return;
        }
        const ms = date.getTime();
        dateToTsResult.innerHTML = `
            <div><span class="row-label">Seconds:</span>${Math.floor(ms / 1000)}</div>
            <div><span class="row-label">Milliseconds:</span>${ms}</div>
        `;
    }

    dateInput.addEventListener('input', runDateToTs);
    runDateToTs(); // show a result for the pre-filled "now" value on load

    // pre-fill "date to unix" with now, for convenience
    dateInput.value = toDatetimeLocalValue(new Date());

    // ========== UUID ==========
    const uuidCount = document.getElementById('uuidCount');
    const uuidList = document.getElementById('uuidList');

    function generateUuid() {
        if (crypto.randomUUID) return crypto.randomUUID();
        // fallback for older browsers
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0'));
        return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
    }

    function renderUuids() {
        const count = Math.min(50, Math.max(1, parseInt(uuidCount.value, 10) || 1));
        uuidList.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const id = generateUuid();
            const row = document.createElement('div');
            row.className = 'uuid-row';

            const span = document.createElement('span');
            span.textContent = id;

            const copyBtn = document.createElement('button');
            copyBtn.className = 'btn-copy';
            copyBtn.textContent = '📋';
            copyBtn.addEventListener('click', async () => {
                const ok = await copyText(id);
                showToast(ok ? '✓ Copied' : '× Failed to copy');
            });

            row.appendChild(span);
            row.appendChild(copyBtn);
            uuidList.appendChild(row);
        }
    }

    uuidCount.addEventListener('input', renderUuids);
    document.getElementById('uuidCopyAllBtn').addEventListener('click', async () => {
        const ids = Array.from(uuidList.querySelectorAll('span')).map((s) => s.textContent);
        if (ids.length === 0) {
            showToast('⚠️ Generate some UUIDs first');
            return;
        }
        const ok = await copyText(ids.join('\n'));
        showToast(ok ? '✓ Copied all UUIDs' : '× Failed to copy');
    });

    renderUuids(); // show some on load

    // ========== PASSWORD ==========
    const pwLength = document.getElementById('pwLength');
    const pwLengthLabel = document.getElementById('pwLengthLabel');
    const pwUpper = document.getElementById('pwUpper');
    const pwLower = document.getElementById('pwLower');
    const pwNumbers = document.getElementById('pwNumbers');
    const pwSymbols = document.getElementById('pwSymbols');
    const pwOutput = document.getElementById('pwOutput');
    const pwStrength = document.getElementById('pwStrength');

    const CHARSETS = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    pwLength.addEventListener('input', () => {
        pwLengthLabel.textContent = pwLength.value;
        generatePassword();
    });

    [pwUpper, pwLower, pwNumbers, pwSymbols].forEach((cb) => {
        cb.addEventListener('change', generatePassword);
    });

    function generatePassword() {
        let pool = '';
        if (pwUpper.checked) pool += CHARSETS.upper;
        if (pwLower.checked) pool += CHARSETS.lower;
        if (pwNumbers.checked) pool += CHARSETS.numbers;
        if (pwSymbols.checked) pool += CHARSETS.symbols;

        if (!pool) {
            showToast('⚠️ Select at least one character type');
            return;
        }

        const length = parseInt(pwLength.value, 10);
        const randomValues = crypto.getRandomValues(new Uint32Array(length));
        let password = '';
        for (let i = 0; i < length; i++) {
            password += pool[randomValues[i] % pool.length];
        }

        pwOutput.value = password;

        const entropy = length * Math.log2(pool.length);
        let label, color, pct;
        if (entropy < 40) { label = 'Weak'; color = '#f87171'; pct = 25; }
        else if (entropy < 60) { label = 'Fair'; color = '#fbbf24'; pct = 50; }
        else if (entropy < 90) { label = 'Strong'; color = '#7c8cff'; pct = 75; }
        else { label = 'Very Strong'; color = '#8ab6f9'; pct = 100; }

        pwStrength.innerHTML = `
            <div>${label} · ~${Math.round(entropy)} bits of entropy</div>
            <div class="bar"><div class="bar-fill" style="width:${pct}%; background:${color};"></div></div>
        `;
    }

    generatePassword(); // show one on load

    // ========== QR CODE ==========
    const qrInput = document.getElementById('qrInput');
    const qrSize = document.getElementById('qrSize');
    const qrCanvasHolder = document.getElementById('qrCanvasHolder');
    const qrEmpty = document.getElementById('qrEmpty');
    let qrInstance = null;

    document.getElementById('qrGenerateBtn').addEventListener('click', () => {
        const text = qrInput.value.trim();
        if (!text) {
            showToast('⚠️ Enter text or a URL first');
            return;
        }
        if (typeof QRCode === 'undefined') {
            showToast('× QR library failed to load (check your connection)');
            return;
        }

        const size = parseInt(qrSize.value, 10);
        qrCanvasHolder.innerHTML = '';
        qrInstance = new QRCode(qrCanvasHolder, {
            text: text,
            width: size,
            height: size,
            colorDark: '#000000',
            colorLight: '#ffffff'
        });

        qrCanvasHolder.classList.add('visible');
        qrEmpty.style.display = 'none';
    });

    document.getElementById('qrDownloadBtn').addEventListener('click', () => {
        const canvas = qrCanvasHolder.querySelector('canvas');
        if (!canvas) {
            showToast('⚠️ Generate a QR code first');
            return;
        }
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'qrcode.png';
        a.click();
    });

})();