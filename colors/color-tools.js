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
            return false;
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

    // ----- COLOR CONVERSION HELPERS -----
    function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

    function hexToRgb(hex) {
        const clean = hex.replace('#', '').trim();
        if (!/^[0-9a-fA-F]{6}$/.test(clean) && !/^[0-9a-fA-F]{3}$/.test(clean)) return null;
        const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
        const num = parseInt(full, 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }

    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                default: h = (r - g) / d + 4;
            }
            h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    function hslToRgb(h, s, l) {
        h = (h % 360) / 360; s /= 100; l /= 100;
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }

    // ========== PICKER & CONVERTER ==========
    const colorNative = document.getElementById('colorNative');
    const colorPreviewBox = document.getElementById('colorPreviewBox');
    const hexInput = document.getElementById('hexInput');
    const rInput = document.getElementById('rInput');
    const gInput = document.getElementById('gInput');
    const bInput = document.getElementById('bInput');
    const hInput = document.getElementById('hInput');
    const sInput = document.getElementById('sInput');
    const lInput = document.getElementById('lInput');
    const hexString = document.getElementById('hexString');
    const rgbString = document.getElementById('rgbString');
    const hslString = document.getElementById('hslString');

    let isUpdating = false;

    function applyColor(hex) {
        if (isUpdating) return;
        isUpdating = true;

        const rgb = hexToRgb(hex);
        if (!rgb) { isUpdating = false; return; }
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        hexInput.value = hex;
        rInput.value = rgb.r; gInput.value = rgb.g; bInput.value = rgb.b;
        hInput.value = hsl.h; sInput.value = hsl.s; lInput.value = hsl.l;
        colorNative.value = hex;
        colorPreviewBox.style.background = hex;

        hexString.textContent = hex;
        rgbString.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        hslString.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

        isUpdating = false;
    }

    hexInput.addEventListener('input', () => {
        let val = hexInput.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (hexToRgb(val)) applyColor(val);
    });

    colorNative.addEventListener('input', () => applyColor(colorNative.value));

    [rInput, gInput, bInput].forEach((el) => {
        el.addEventListener('input', () => {
            const r = clamp(parseInt(rInput.value, 10) || 0, 0, 255);
            const g = clamp(parseInt(gInput.value, 10) || 0, 0, 255);
            const b = clamp(parseInt(bInput.value, 10) || 0, 0, 255);
            applyColor(rgbToHex(r, g, b));
        });
    });

    [hInput, sInput, lInput].forEach((el) => {
        el.addEventListener('input', () => {
            const h = clamp(parseInt(hInput.value, 10) || 0, 0, 360);
            const s = clamp(parseInt(sInput.value, 10) || 0, 0, 100);
            const l = clamp(parseInt(lInput.value, 10) || 0, 0, 100);
            const rgb = hslToRgb(h, s, l);
            applyColor(rgbToHex(rgb.r, rgb.g, rgb.b));
        });
    });

    document.querySelectorAll('.color-copy-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const el = document.getElementById(btn.dataset.copyCode);
            const ok = await copyText(el.textContent);
            showToast(ok ? '✓ Copied' : '× Failed to copy');
        });
    });

    applyColor('#7c8cff'); // initialize display

    // ========== CONTRAST CHECKER ==========
    const fgNative = document.getElementById('fgNative');
    const fgHex = document.getElementById('fgHex');
    const bgNative = document.getElementById('bgNative');
    const bgHex = document.getElementById('bgHex');
    const contrastPreview = document.getElementById('contrastPreview');
    const contrastResult = document.getElementById('contrastResult');

    function relativeLuminance(r, g, b) {
        const channel = (v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    }

    function contrastRatio(rgb1, rgb2) {
        const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
        const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
        const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    function badge(pass) {
        return `<span class="contrast-badge ${pass ? 'pass' : 'fail'}">${pass ? '✓ Pass' : '✕ Fail'}</span>`;
    }

    function updateContrast() {
        const fgRgb = hexToRgb(fgHex.value);
        const bgRgb = hexToRgb(bgHex.value);
        if (!fgRgb || !bgRgb) return;

        contrastPreview.style.color = fgHex.value;
        contrastPreview.style.background = bgHex.value;

        const ratio = contrastRatio(fgRgb, bgRgb);
        const ratioText = ratio.toFixed(2) + ':1';

        contrastResult.innerHTML = `
            <div class="contrast-ratio-card">
                <div class="ratio-value">${ratioText}</div>
                <div class="ratio-label">Contrast ratio</div>
            </div>
            <div class="contrast-badge-group">
                <h4>Normal Text</h4>
                <div class="contrast-badge-row"><span>AA (≥4.5)</span>${badge(ratio >= 4.5)}</div>
                <div class="contrast-badge-row"><span>AAA (≥7)</span>${badge(ratio >= 7)}</div>
            </div>
            <div class="contrast-badge-group">
                <h4>Large Text</h4>
                <div class="contrast-badge-row"><span>AA (≥3)</span>${badge(ratio >= 3)}</div>
                <div class="contrast-badge-row"><span>AAA (≥4.5)</span>${badge(ratio >= 4.5)}</div>
            </div>
        `;
    }

    fgNative.addEventListener('input', () => { fgHex.value = fgNative.value; updateContrast(); });
    bgNative.addEventListener('input', () => { bgHex.value = bgNative.value; updateContrast(); });

    fgHex.addEventListener('input', () => {
        let val = fgHex.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (hexToRgb(val)) { fgNative.value = val; updateContrast(); }
    });

    bgHex.addEventListener('input', () => {
        let val = bgHex.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (hexToRgb(val)) { bgNative.value = val; updateContrast(); }
    });

    updateContrast(); // initialize display

})();
