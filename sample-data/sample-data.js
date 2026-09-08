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

    function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

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

    // ========== FAKE DATA ==========
    const MALE_FIRST_NAMES = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Paul', 'Steven', 'Andrew', 'Joshua', 'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas'];
    const FEMALE_FIRST_NAMES = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Margaret', 'Betty', 'Sandra', 'Ashley', 'Dorothy', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Laura', 'Sharon', 'Cynthia'];
    const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];
    const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'protonmail.com', 'example.com', 'mail.com'];
    const STREET_NAMES = ['Maple St', 'Oak Ave', 'Elm Rd', 'Pine Ln', 'Cedar Blvd', '2nd Ave', 'Main St', 'Park Rd', 'Sunset Blvd', 'Lake Dr', 'River Rd', 'Hillcrest Ave', 'Broadway', 'Church St', 'Willow Way'];
    const GENDERS = ['Male', 'Female', 'Non-binary'];

    const COUNTRIES = [
        { name: 'United States', states: [
            { name: 'California', cities: ['Los Angeles', 'San Francisco', 'San Diego'] },
            { name: 'Texas', cities: ['Houston', 'Austin', 'Dallas'] },
            { name: 'New York', cities: ['New York City', 'Buffalo', 'Albany'] }
        ]},
        { name: 'India', states: [
            { name: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur'] },
            { name: 'Karnataka', cities: ['Bangalore', 'Mysore'] },
            { name: 'Delhi', cities: ['New Delhi'] }
        ]},
        { name: 'United Kingdom', states: [
            { name: 'England', cities: ['London', 'Manchester', 'Birmingham'] },
            { name: 'Scotland', cities: ['Edinburgh', 'Glasgow'] }
        ]},
        { name: 'Canada', states: [
            { name: 'Ontario', cities: ['Toronto', 'Ottawa'] },
            { name: 'Quebec', cities: ['Montreal', 'Quebec City'] }
        ]},
        { name: 'Australia', states: [
            { name: 'New South Wales', cities: ['Sydney', 'Newcastle'] },
            { name: 'Victoria', cities: ['Melbourne', 'Geelong'] }
        ]},
        { name: 'Germany', states: [
            { name: 'Bavaria', cities: ['Munich', 'Nuremberg'] },
            { name: 'Berlin', cities: ['Berlin'] }
        ]}
    ];

    function generateEntry(id) {
        const gender = randomItem(GENDERS);
        const firstName = gender === 'Female'
            ? randomItem(FEMALE_FIRST_NAMES)
            : gender === 'Male'
                ? randomItem(MALE_FIRST_NAMES)
                : randomItem([...MALE_FIRST_NAMES, ...FEMALE_FIRST_NAMES]);
        const lastName = randomItem(LAST_NAMES);
        const username = `${firstName}.${lastName}${randomInt(1, 999)}`.toLowerCase();
        const email = `${username}@${randomItem(EMAIL_DOMAINS)}`;
        const country = randomItem(COUNTRIES);
        const state = randomItem(country.states);
        const city = randomItem(state.cities);
        const address = `${randomInt(100, 9999)} ${randomItem(STREET_NAMES)}, ${city}`;
        const phone = `+1-${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
        const website = `https://www.${lastName.toLowerCase()}${randomInt(1, 99)}.com`;
        const age = randomInt(18, 65);

        return {
            id, firstName, lastName, username, email, address, phone, website,
            age, gender, country: country.name, state: state.name, city
        };
    }

    let fdData = [];
    const fdTableBody = document.getElementById('fdTableBody');
    const fdCount = document.getElementById('fdCount');

    function renderFdTable() {
        if (fdData.length === 0) {
            fdTableBody.innerHTML = '<tr><td class="fd-empty" colspan="13">Click "Generate" to create sample entries</td></tr>';
            return;
        }
        fdTableBody.innerHTML = fdData.map((e) => `
            <tr>
                <td>${e.id}</td><td>${e.firstName}</td><td>${e.lastName}</td><td>${e.username}</td>
                <td>${e.email}</td><td>${e.address}</td><td>${e.phone}</td><td>${e.website}</td>
                <td>${e.age}</td><td>${e.gender}</td><td>${e.country}</td><td>${e.state}</td><td>${e.city}</td>
            </tr>
        `).join('');
    }

    function generateFakeData() {
        const count = Math.min(5000, Math.max(1, parseInt(fdCount.value, 10) || 1));
        fdData = [];
        for (let i = 1; i <= count; i++) fdData.push(generateEntry(i));
        renderFdTable();
        showToast(`✓ Generated ${count} entries`);
    }

    document.getElementById('fdGenerateBtn').addEventListener('click', generateFakeData);

    function downloadBlob(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    document.getElementById('fdDownloadJsonBtn').addEventListener('click', () => {
        if (fdData.length === 0) { showToast('⚠️ Generate some data first'); return; }
        downloadBlob(JSON.stringify(fdData, null, 2), 'fake-data.json', 'application/json');
    });

    document.getElementById('fdDownloadCsvBtn').addEventListener('click', () => {
        if (fdData.length === 0) { showToast('⚠️ Generate some data first'); return; }
        const headers = Object.keys(fdData[0]);
        const escapeCsv = (val) => {
            const str = String(val);
            return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
        };
        const rows = fdData.map((row) => headers.map((h) => escapeCsv(row[h])).join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        downloadBlob(csv, 'fake-data.csv', 'text/csv');
    });

    // ========== LOREM IPSUM ==========
    const CLASSIC_WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'];

    const BUZZWORDS = ['synergy', 'leverage', 'paradigm shift', 'circle back', 'bandwidth', 'actionable insights', 'low-hanging fruit', 'move the needle', 'deep dive', 'value-add', 'core competency', 'disrupt', 'streamline', 'scalable', 'holistic approach', 'best practice', 'touch base', 'boil the ocean', 'growth hacking', 'ideate', 'pivot', 'ecosystem', 'thought leadership', 'empower', 'incentivize', 'onboard', 'drill down', 'double-click', 'north star', 'unlock value', 'game changer', 'win-win', 'bleeding edge', 'blue sky thinking', 'take it offline', 'align stakeholders', 'operationalize', 'future-proof', 'best-in-class', 'mission-critical', 'customer-centric', 'agile mindset', 'data-driven', 'end-to-end solution', 'digital transformation', 'cross-functional', 'optimize workflows', 'the ask', 'move fast', 'ping me'];

    const PIRATE_WORDS = ['arr', 'matey', 'scallywag', 'booty', 'landlubber', 'yo-ho-ho', 'plunder', 'treasure', 'grog', 'scurvy', 'cutlass', 'galleon', 'buccaneer', 'doubloon', 'shiver me timbers', 'avast', 'aye', 'captain', 'crew', 'sea', 'ship', 'island', 'map', 'chest', 'pirate', 'sail', 'wind', 'storm', 'kraken', 'parrot', 'anchor', 'plank', 'mutiny', 'rum', 'compass', 'voyage', 'deck', 'cannon', 'flag', 'harbor'];

    const HACKER_WORDS = ['compile', 'deploy', 'refactor', 'kubernetes', 'microservice', 'async', 'cache', 'endpoint', 'payload', 'middleware', 'container', 'pipeline', 'repository', 'commit', 'merge', 'branch', 'debug', 'exception', 'latency', 'throughput', 'scalability', 'encryption', 'algorithm', 'runtime', 'framework', 'backend', 'frontend', 'database', 'query', 'server', 'cloud', 'docker', 'api', 'token', 'session', 'hash', 'binary', 'kernel', 'thread', 'buffer'];

    const CAT_WORDS = ['meow', 'purr', 'whiskers', 'paw', 'nap', 'yarn', 'scratch', 'pounce', 'hiss', 'kitty', 'litter', 'tuna', 'mouse', 'climb', 'curtains', 'box', 'sunbeam', 'tail', 'fluffy', 'knead', 'catnip', 'windowsill', 'chase', 'laser', 'treat', 'claw', 'stretch', 'purrfect', 'feline', 'zoomies'];

    const BACON_WORDS = ['bacon', 'brisket', 'pork', 'sausage', 'ribeye', 'chuck', 'ham', 'meatball', 'pancetta', 'turducken', 'salami', 'beef', 'chicken', 'tri-tip', 'jerky', 'pastrami', 'tenderloin', 'shank', 'shoulder', 'loin', 'flank', 'sirloin', 'bresaola', 'capicola', 'andouille', 'spare ribs', 't-bone', 'porchetta', 'kielbasa', 'prosciutto'];

    const WORD_BANKS = {
        classic: CLASSIC_WORDS,
        buzzword: BUZZWORDS,
        pirate: PIRATE_WORDS,
        hacker: HACKER_WORDS,
        cat: CAT_WORDS,
        bacon: BACON_WORDS
    };

    const OPENERS = {
        classic: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        buzzword: "Let's circle back and leverage synergies to unlock value.",
        pirate: 'Arr, gather round mateys and hear this tale.',
        hacker: 'System initialized. Compiling the following payload.',
        cat: 'Meow meow purr, the cat has spoken.',
        bacon: 'Bacon ipsum dolor amet, pork belly ham hock.'
    };

    function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

    function buildSentence(wordBank, minWords, maxWords) {
        const wordCount = randomInt(minWords, maxWords);
        const words = [];
        for (let i = 0; i < wordCount; i++) words.push(randomItem(wordBank));
        // occasionally insert a comma partway through
        if (words.length > 5 && Math.random() < 0.5) {
            const commaIdx = randomInt(2, words.length - 3);
            words[commaIdx] += ',';
        }
        return capitalize(words.join(' ')) + '.';
    }

    function buildParagraph(wordBank, minWords, maxWords, minSentences, maxSentences) {
        const sentenceCount = randomInt(minSentences, maxSentences);
        const sentences = [];
        for (let i = 0; i < sentenceCount; i++) sentences.push(buildSentence(wordBank, minWords, maxWords));
        return sentences.join(' ');
    }

    function generateLorem(style, type, count, opts) {
        const wordBank = WORD_BANKS[style] || WORD_BANKS.classic;
        const opener = OPENERS[style] || OPENERS.classic;
        const minW = Math.min(opts.minWords, opts.maxWords);
        const maxW = Math.max(opts.minWords, opts.maxWords);
        const minS = Math.min(opts.minSentences, opts.maxSentences);
        const maxS = Math.max(opts.minSentences, opts.maxSentences);

        let text;

        if (type === 'words') {
            const words = [];
            for (let i = 0; i < count; i++) words.push(randomItem(wordBank));
            text = capitalize(words.join(' ')) + '.';
        } else if (type === 'sentences') {
            const sentences = [];
            for (let i = 0; i < count; i++) sentences.push(buildSentence(wordBank, minW, maxW));
            if (opts.useOpener) sentences.unshift(opener);
            text = sentences.join(' ');
        } else {
            // paragraphs
            const paragraphs = [];
            for (let i = 0; i < count; i++) paragraphs.push(buildParagraph(wordBank, minW, maxW, minS, maxS));
            if (opts.useOpener) paragraphs[0] = opener + ' ' + paragraphs[0];

            if (opts.html) {
                return paragraphs.map((p) => `<p>${p}</p>`).join('\n');
            }
            text = paragraphs.join('\n\n');
        }

        if (opts.html && type !== 'paragraphs') {
            return `<p>${text}</p>`;
        }
        return text;
    }

    function updateLoremStats(text) {
        const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const wordCount = plain ? plain.split(' ').length : 0;
        const charCount = plain.length;
        document.getElementById('loremStats').textContent = `${wordCount} words · ${charCount} characters`;
    }

    document.getElementById('loremGenerateBtn').addEventListener('click', () => {
        const style = document.getElementById('loremStyle').value;
        const type = document.getElementById('loremType').value;
        const count = Math.min(50, Math.max(1, parseInt(document.getElementById('loremCount').value, 10) || 1));

        const opts = {
            minWords: Math.max(2, parseInt(document.getElementById('loremWordsMin').value, 10) || 6),
            maxWords: Math.max(2, parseInt(document.getElementById('loremWordsMax').value, 10) || 14),
            minSentences: Math.max(1, parseInt(document.getElementById('loremSentMin').value, 10) || 4),
            maxSentences: Math.max(1, parseInt(document.getElementById('loremSentMax').value, 10) || 7),
            useOpener: document.getElementById('loremOpener').checked,
            html: document.getElementById('loremHtml').checked
        };

        const output = generateLorem(style, type, count, opts);
        document.getElementById('loremOutput').value = output;
        updateLoremStats(output);
    });

    // generic copy button (data-copy-target -> element id whose .value to copy)
    document.querySelectorAll('.io-copy').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const targetEl = document.getElementById(btn.dataset.copyTarget);
            if (!targetEl || !targetEl.value) { showToast('⚠️ Nothing to copy'); return; }
            const ok = await copyText(targetEl.value);
            showToast(ok ? '✓ Copied to clipboard' : '× Failed to copy');
        });
    });

})();