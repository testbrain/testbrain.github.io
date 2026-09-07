(function() {
    'use strict';

    // ----- CONFIG -----
    const BASE_URL = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);

    // ----- TOOL DATA -----
    const tools = [
        {
            id: 'check-linux',
            name: 'check-linux',
            description: 'Detects which Linux distribution is installed',
            filename: 'check-linux',
            badge: 'SH',
            autoRun: true,   // Runs automatically after download
            cleanup: true    // Deletes after running
        },
        {
            id: 'check-system',
            name: 'check-system',
            description: 'Comprehensive system info: CPU, memory, disk, network & more',
            filename: 'check-system',
            badge: 'SH',
            autoRun: true,
            cleanup: true
        },
        {
            id: 'check-security',
            name: 'check-security',
            description: 'Security audit: users, SSH, firewall, malware detection',
            filename: 'check-security',
            badge: 'SH',
            autoRun: true,
            cleanup: true
        },
        {
            id: 'check-network',
            name: 'check-network',
            description: 'Network diagnostics: interfaces, DNS, latency, bandwidth',
            filename: 'check-network',
            badge: 'SH',
            autoRun: true,
            cleanup: true
        },
        {
            id: 'check-disk-health',
            name: 'check-disk-health',
            description: 'Disk health: usage, performance, SMART data, predictive failure',
            filename: 'check-disk-health',
            badge: 'SH',
            autoRun: true,
            cleanup: true
        },
        {
            id: 'check-php',
            name: 'check-php',
            description: 'PHP info: versions, config, extensions, performance',
            filename: 'check-php',
            badge: 'SH',
            autoRun: true,
            cleanup: true
        },
        {
            id: 'check-mysql',
            name: 'check-mysql',
            description: 'MySQL/MariaDB health: status, size, performance, tables',
            filename: 'check-mysql',
            badge: 'SH',
            autoRun: true,
            cleanup: true
        },
        {
            id: 'check-ssl',
            name: 'check-ssl',
            description: 'SSL certificate checker: expiry, chain, protocols',
            filename: 'check-ssl',
            badge: 'SH',
            autoRun: true,
            cleanup: true
        },
        {
            id: 'check-performance',
            name: 'check-performance',
            description: 'Performance benchmark: CPU, memory, disk, network speed',
            filename: 'check-performance',
            badge: 'SH',
            autoRun: true,
            cleanup: true
        },
        {
            id: 'check-process',
            name: 'check-process',
            description: 'Process monitoring: top CPU/memory, zombies, system processes',
            filename: 'check-process',
            badge: 'SH',
            autoRun: true,
            cleanup: true
        },
        {
            id: 'check-nginx',
            name: 'check-nginx',
            description: 'Nginx health: config, SSL, logs, performance, security',
            filename: 'check-nginx',
            badge: 'SH',
            autoRun: true,
            cleanup: true
        },
        {
            id: 'check-apache',
            name: 'check-apache',
            description: 'Apache health: config, modules, SSL, logs, performance',
            filename: 'check-apache',
            badge: 'SH',
            autoRun: true,
            cleanup: true
        },
        {
            id: 'take-backup',
            name: 'take-backup',
            description: 'Take backup of Projects, Databases, Crons and send to backup server via FTP/SFTP. Just add your credientials after download this script via : nano take-backup',
            filename: 'take-backup',
            badge: 'SH',
            autoRun: false,
            cleanup: false
        }
    ];

    // ----- DOM REFS -----
    const grid = document.getElementById('tool-grid');
    const toast = document.getElementById('toast');
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const noResults = document.getElementById('noResults');
    const toolCount = document.getElementById('tool-count');

    // ----- HELPERS -----
    function getFileUrl(filename) {
        return BASE_URL + filename;
    }

    function getFullCommand(url, filename, autoRun = true, cleanup = true) {
        let cmd = `wget ${url} && chmod +x ${filename}`;

        if (autoRun) {
            cmd += ` && clear && ./${filename}`;
        }

        if (cleanup) {
            cmd += ` && rm -f ${filename}`;
        }

        return cmd;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ----- TOAST -----
    let toastTimeout = null;

    function showToast(message) {
        toast.textContent = message;
        toast.className = 'toast';

        void toast.offsetWidth;
        toast.classList.add('show');

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // ----- COPY -----
    async function copyToClipboard(text) {
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

    // ----- RENDER -----
    function renderTools(filter = '') {
        if (!grid) return;

        const searchTerm = filter.toLowerCase().trim();
        let html = '';
        let visibleCount = 0;

        tools.forEach((tool) => {
            const url = getFileUrl(tool.filename);
            const fullCmd = getFullCommand(url, tool.filename, tool.autoRun !== false, tool.cleanup !== false);
            const escapedCmd = fullCmd.replace(/"/g, '&quot;');

            const matchesSearch = !searchTerm ||
                tool.name.toLowerCase().includes(searchTerm) ||
                tool.description.toLowerCase().includes(searchTerm) ||
                tool.id.toLowerCase().includes(searchTerm);

            if (matchesSearch) {
                visibleCount++;
                let badgeClass = 'bash';
                if (tool.id.includes('php') || tool.id.includes('mysql') || tool.id.includes('ssl')) {
                    badgeClass = 'python';
                } else if (tool.id.includes('network') || tool.id.includes('performance')) {
                    badgeClass = 'js';
                }

                // Show badges based on settings
                let extraBadges = '';
                if (tool.autoRun === false) {
                    extraBadges += `<span class="badge download-only">⬇ Download Only</span>`;
                }

                html += `
                    <div class="tool-card" data-tool-id="${tool.id}">
                        <div class="tool-header">
                            <div class="tool-info">
                                <div class="tool-name">
                                    ${escapeHtml(tool.name)}
                                    <span class="badge ${badgeClass}">${escapeHtml(tool.badge || 'SH')}</span>
                                    ${extraBadges}
                                </div>
                                <div class="tool-desc">${escapeHtml(tool.description)}</div>
                            </div>
                            <button class="btn-copy" data-command="${escapedCmd}" title="Copy command">
                                <span class="icon">📋</span> Copy
                            </button>
                        </div>

                        <div class="tool-url">
                            <span class="wget-prefix">wget</span>
                            <span class="url-text">${escapeHtml(url)}</span>
                        </div>
                    </div>
                `;
            }
        });

        grid.innerHTML = html;

        // Update tool count
        if (toolCount) {
            toolCount.textContent = visibleCount;
        }

        // Show/hide no results
        if (noResults) {
            if (visibleCount === 0 && searchTerm) {
                noResults.classList.add('visible');
            } else {
                noResults.classList.remove('visible');
            }
        }

        // Attach copy events
        grid.querySelectorAll('.btn-copy').forEach((btn) => {
            btn.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();

                const fullCmd = this.getAttribute('data-command');

                if (!fullCmd) {
                    showToast('❌ Error copying command');
                    return;
                }

                const ok = await copyToClipboard(fullCmd);

                if (ok) {
                    const originalText = this.innerHTML;
                    this.innerHTML = '<span class="icon">✅</span> Copied!';
                    this.classList.add('copied');

                    showToast('✅ Copied to clipboard');

                    setTimeout(() => {
                        this.innerHTML = originalText;
                        this.classList.remove('copied');
                    }, 2000);
                } else {
                    showToast('❌ Failed to copy');
                }
            });
        });
    }

    // ----- SEARCH -----
    function handleSearch() {
        const query = searchInput.value;
        renderTools(query);

        if (query.length > 0) {
            searchClear.classList.add('visible');
        } else {
            searchClear.classList.remove('visible');
        }
    }

    // ----- INIT -----
    document.addEventListener('DOMContentLoaded', () => {
        renderTools();

        searchInput.addEventListener('input', handleSearch);

        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.classList.remove('visible');
            renderTools('');
            searchInput.focus();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                e.preventDefault();
                searchInput.focus();
            }
            if (e.key === 'Escape' && document.activeElement === searchInput) {
                searchInput.blur();
            }
        });
    });

})();
