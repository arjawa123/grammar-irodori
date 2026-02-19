// --- CONFIG & STATE ---
const API_URL = "/api/builder/validate";

let fullData = [];
let userStats = { xp: 0, streak: 0 };
let favorites = [];
let passedItems = [];
let showRomaji = false;
let showOnlyFav = false;
let currentLevelFile = null;

const els = {
    list: document.getElementById('treeList'),
    loading: document.getElementById('loadingIndicator'),
    welcome: document.getElementById('welcomeScreen'),
    tpl: document.getElementById('contentTemplate'),
    streak: document.getElementById('streakCount'),
    xp: document.getElementById('xpCount'),

    selectWrapper: document.querySelector('.level-select-wrapper'),
    selectTrigger: document.getElementById('levelSelectTrigger'),
    selectOptions: document.getElementById('levelOptions'),
    selectValue: document.querySelector('.select-value'),
};

// --- INIT ---
window.onload = () => {
    loadUserStats();
    setupCustomSelect();
};

// --- CUSTOM SELECT LOGIC ---
function setupCustomSelect() {
    els.selectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = els.selectOptions.classList.toggle('open');
        els.selectWrapper.classList.toggle('open', isOpen);
    });

    document.addEventListener('click', (e) => {
        if (!els.selectWrapper.contains(e.target)) {
            els.selectOptions.classList.remove('open');
            els.selectWrapper.classList.remove('open');
        }
    });

    const options = document.querySelectorAll('.option');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            const val = opt.getAttribute('data-value');
            const label = opt.querySelector('.opt-label').innerText;
            const tag = opt.querySelector('.opt-tag').innerText;

            els.selectValue.innerText = `${tag} – ${label}`;
            els.selectOptions.classList.remove('open');
            els.selectWrapper.classList.remove('open');

            currentLevelFile = val;
            loadData(`/api/grammar/${val}`);
        });
    });
}

// --- DATA LOGIC ---
function loadUserStats() {
    userStats = JSON.parse(localStorage.getItem('bunpouStats')) || { xp: 0, streak: 0 };
    favorites = JSON.parse(localStorage.getItem('bunpouFavs')) || [];
    passedItems = JSON.parse(localStorage.getItem('bunpouPassed')) || [];
    updateStatsUI();
}

function saveUserStats() {
    localStorage.setItem('bunpouStats', JSON.stringify(userStats));
    localStorage.setItem('bunpouFavs', JSON.stringify(favorites));
    localStorage.setItem('bunpouPassed', JSON.stringify(passedItems));
    updateStatsUI();
}

function updateStatsUI() {
    els.streak.innerText = userStats.streak;
    els.xp.innerText = userStats.xp;
}

function animateCount(el, targetVal) {
    const start = parseInt(el.innerText) || 0;
    const diff = targetVal - start;
    if (diff === 0) return;
    const steps = 20;
    let step = 0;
    const timer = setInterval(() => {
        step++;
        el.innerText = Math.round(start + (diff * step) / steps);
        if (step >= steps) clearInterval(timer);
    }, 16);
}

async function loadData(url) {
    if (!url) return;
    try {
        els.welcome.style.display = 'none';
        els.list.style.display = 'none';
        els.loading.style.display = 'flex';

        const res = await fetch(url);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Data tidak ditemukan.");
        }

        const json = await res.json();
        fullData = json.map((d) => ({
            ...d,
            uniqueId: d.grammar_id
        }));

        els.loading.style.display = 'none';
        els.list.style.display = 'flex';
        renderTree();
    } catch (e) {
        els.loading.style.display = 'none';
        els.list.style.display = 'flex';
        els.list.innerHTML = `
            <div class="error-state">
                <h3>Gagal memuat data</h3>
                <p>${e.message}</p>
            </div>`;
    }
}

// --- RENDER TREE ---
function renderTree() {
    els.list.innerHTML = '';
    const dataToRender = showOnlyFav
        ? fullData.filter(d => favorites.includes(d.uniqueId))
        : fullData;

    if (dataToRender.length === 0) {
        els.list.innerHTML = `<div class="error-state"><p>Tidak ada item yang ditemukan.</p></div>`;
        return;
    }

    const grouped = {};
    dataToRender.forEach(item => {
        const k = item.lesson || "Extra";
        if (!grouped[k]) grouped[k] = [];
        grouped[k].push(item);
    });

    Object.keys(grouped).sort((a, b) => a - b).forEach(lesson => {
        const items = grouped[lesson];
        const lessonGroup = document.createElement('div');
        lessonGroup.className = 'lesson-group';

        const lessonHeader = document.createElement('div');
        lessonHeader.className = 'lesson-header';
        lessonHeader.innerHTML = `
            <div class="lesson-header-left">
                <div class="lesson-number">${lesson}</div>
                <span class="lesson-title">Lesson ${lesson} <span class="lesson-count">${items.length} pola</span></span>
            </div>
            <i class="ph ph-caret-down"></i>
        `;

        const lessonContent = document.createElement('div');
        lessonContent.className = 'lesson-content-wrapper';

        lessonHeader.addEventListener('click', () => {
            lessonGroup.classList.toggle('open');
        });

        items.forEach(item => {
            lessonContent.appendChild(createGrammarItem(item));
        });

        lessonGroup.append(lessonHeader, lessonContent);
        els.list.appendChild(lessonGroup);
    });
}

function createGrammarItem(item) {
    const el = document.createElement('div');
    el.className = 'tree-item';
    if (passedItems.includes(item.uniqueId)) el.classList.add('done');

    el.innerHTML = `
        <div class="accordion-header">
            <div class="accordion-header-left">
                <div class="item-status"></div>
                <h3 class="pattern-title">${item.pattern}</h3>
            </div>
            <i class="ph ph-caret-down"></i>
        </div>
        <div class="accordion-content"></div>
    `;

    el.querySelector('.accordion-header').addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = el.classList.contains('active');

        el.parentElement.querySelectorAll('.tree-item.active').forEach(sib => {
            if (sib !== el) sib.classList.remove('active');
        });

        if (!isOpen) {
            el.classList.add('active');
            const contentBox = el.querySelector('.accordion-content');
            if (!contentBox.hasChildNodes()) renderDetails(contentBox, item, el);
        } else {
            el.classList.remove('active');
        }
    });

    return el;
}

function renderDetails(container, data, treeItemEl) {
    const clone = els.tpl.content.cloneNode(true);

    clone.querySelector('.meaning').innerText = data.meaning || data.meaning_id;
    clone.querySelector('.usage-text').innerText = data.usage;

    const noteArea = clone.querySelector('.note-area');
    noteArea.innerText = data.notes ? `📝 ${data.notes}` : '';

    const exList = clone.querySelector('.examples-list');
    data.example.forEach(ex => {
        const div = document.createElement('div');
        div.className = 'example-card';
        div.onclick = () => speak(ex.jp);

        const highlighted = highlightSyntax(ex.jp, data.pattern);
        div.innerHTML = `
            <p class="jp">${highlighted}</p>
            <p class="romaji" style="display:${showRomaji ? 'block' : 'none'}">${ex.romaji}</p>
            <p class="trans">${ex.id}</p>
        `;
        exList.appendChild(div);
    });

    const btnFav = clone.querySelector('.btn-fav');
    updateFavIcon(btnFav, data.uniqueId);
    btnFav.onclick = () => toggleFav(data.uniqueId, btnFav);
    clone.querySelector('.btn-audio').onclick = () => speak(data.pattern + ". " + data.example[0].jp);

    const sections = {
        learn: clone.querySelector('.learn-section'),
        quiz: clone.querySelector('.quiz-section'),
        builder: clone.querySelector('.builder-section')
    };

    const switchSec = (name) => {
        Object.values(sections).forEach(s => s.style.display = 'none');
        sections[name].style.display = 'block';
    };

    clone.querySelector('.btn-start-quiz').onclick = () => {
        switchSec('quiz');
        initQuiz(sections.quiz, data, treeItemEl);
    };
    clone.querySelector('.btn-start-builder').onclick = () => {
        switchSec('builder');
        initBuilder(sections.builder, data);
    };
    clone.querySelectorAll('.btn-back-learn').forEach(b => b.onclick = () => switchSec('learn'));

    if (passedItems.includes(data.uniqueId)) {
        const badge = clone.querySelector('.completion-badge');
        if (badge) badge.style.display = 'flex';
    }

    container.appendChild(clone);
}

// --- REGEX SYNTAX HIGHLIGHTER ---
function highlightSyntax(sentence, pattern) {
    let grammarCore = pattern.replace(/[NVA-Z0-9~～\(\)]+/g, '').trim();
    if (grammarCore.length === 0) grammarCore = "###IGNORE###";

    const tokens = smartSegment(sentence);

    let html = "";
    tokens.forEach(token => {
        let className = "hl-noun";

        if (token === grammarCore || (token.includes(grammarCore) && grammarCore.length > 1)) {
            className = "hl-grammar";
        } else if (/^(は|が|を|に|で|へ|と|も|から|まで|ね|よ|か)$/.test(token)) {
            className = "hl-particle";
        }

        html += `<span class="${className}">${token}</span>`;
    });

    return html;
}

// --- QUIZ SYSTEM ---
function initQuiz(ui, data, treeItemEl) {
    const sentence = data.example[0].jp;
    ui.querySelector('.quiz-question').innerText = `"${data.example[0].id}"`;
    const dropZone = ui.querySelector('.drop-zone');
    const wordBank = ui.querySelector('.word-bank');
    const feedback = ui.querySelector('.feedback-msg');

    dropZone.innerHTML = '<span class="drop-placeholder">Klik kata di bawah untuk menyusun kalimat...</span>';
    wordBank.innerHTML = '';
    feedback.innerText = '';
    feedback.className = 'feedback-msg';

    const tokens = smartSegment(sentence);
    const particles = tokens.filter(t => /^(は|が|を|に|で|へ|と|も|から|まで|ね|よ|か)$/.test(t));
    const gameMode = (particles.length > 0 && Math.random() > 0.5) ? 'PARTICLE' : 'SCRAMBLE';

    if (gameMode === 'PARTICLE') {
        startParticleQuiz(sentence, tokens, ui, treeItemEl, data);
    } else {
        startScrambleQuiz(sentence, tokens, ui, treeItemEl, data);
    }
}

// --- SMART SEGMENTER ---
function smartSegment(text) {
    const cleanText = text.trim();
    let tokens = [];

    if (cleanText.includes(' ')) {
        tokens = cleanText.split(/\s+/);
    } else {
        const regex = /([一-龯々]+|[ァ-ンー]+|[ぁ-ん]+|[a-zA-Z0-9]+|[。、！？.!?]+)/g;
        tokens = cleanText.match(regex) || [cleanText];
    }

    const merged = [];
    tokens.forEach(token => {
        const isPunctuation = /^[。、！？.!?]+$/.test(token);
        if (isPunctuation && merged.length > 0) {
            merged[merged.length - 1] += token;
        } else {
            merged.push(token);
        }
    });

    return merged;
}

function startScrambleQuiz(sentence, tokens, ui, treeItemEl, data) {
    const dropZone = ui.querySelector('.drop-zone');
    const wordBank = ui.querySelector('.word-bank');

    let quizWords = [...tokens].sort(() => Math.random() - 0.5);
    let userAnswer = [];

    function render() {
        dropZone.innerHTML = '';
        if (userAnswer.length === 0) {
            const ph = document.createElement('span');
            ph.className = 'drop-placeholder';
            ph.textContent = 'Klik kata di bawah untuk menyusun kalimat...';
            dropZone.appendChild(ph);
        } else {
            userAnswer.forEach((w, i) => dropZone.appendChild(createPill(w, () => {
                userAnswer.splice(i, 1);
                quizWords.push(w);
                render();
            })));
        }

        wordBank.innerHTML = '';
        quizWords.forEach((w, i) => wordBank.appendChild(createPill(w, () => {
            quizWords.splice(i, 1);
            userAnswer.push(w);
            render();
            checkScrambleWin();
        })));
    }

    function checkScrambleWin() {
        if (quizWords.length === 0) {
            const ans = userAnswer.join('').replace(/\s+|　/g, '');
            const tgt = sentence.replace(/\s+|　/g, '');
            handleWinLoss(ans === tgt, ui, treeItemEl, data);
        }
    }

    render();
}

function startParticleQuiz(sentence, tokens, ui, treeItemEl, data) {
    const dropZone = ui.querySelector('.drop-zone');
    const wordBank = ui.querySelector('.word-bank');

    const particleTokens = tokens.filter(t => /^(は|が|を|に|で|へ|と|も|から|まで|ね|よ|か)$/.test(t));
    const target = particleTokens[Math.floor(Math.random() * particleTokens.length)];

    let html = "";
    tokens.forEach(t => {
        if (t === target) html += `<span class="blank-slot">?</span>`;
        else html += `<span style="font-family:var(--font-jp);font-size:1.1rem;">${t}</span>`;
    });

    dropZone.innerHTML = `<div style="font-size:1.1rem;line-height:2.2;font-family:var(--font-jp);text-align:center;">${html}</div>`;

    const commons = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も'];
    let opts = commons.filter(p => p !== target).sort(() => 0.5 - Math.random()).slice(0, 3);
    opts.push(target);
    opts.sort(() => 0.5 - Math.random());

    wordBank.innerHTML = '';
    opts.forEach(opt => {
        wordBank.appendChild(createPill(opt, () => {
            const slot = dropZone.querySelector('.blank-slot');
            if (slot) {
                slot.innerText = opt;
                slot.classList.add('filled');
            }
            setTimeout(() => handleWinLoss(opt === target, ui, treeItemEl, data), 300);
        }));
    });
}

function handleWinLoss(isCorrect, ui, treeItemEl, data) {
    const feedback = ui.querySelector('.feedback-msg');
    if (isCorrect) {
        feedback.innerHTML = `<i class="ph ph-check-circle"></i> Seikai! Jawaban Benar!`;
        feedback.className = 'feedback-msg correct';
        speak("Seikai!");
        triggerConfetti();
        if (!passedItems.includes(data.uniqueId)) {
            passedItems.push(data.uniqueId);
            userStats.streak++;
            userStats.xp += 20;
            saveUserStats();
            treeItemEl.classList.add('done');
            const badge = treeItemEl.querySelector('.completion-badge');
            if (badge) badge.style.display = 'flex';
        }
    } else {
        feedback.innerHTML = `<i class="ph ph-x-circle"></i> Chigau... Coba lagi!`;
        feedback.className = 'feedback-msg wrong';
        userStats.streak = 0;
        saveUserStats();
    }
}

// --- CONFETTI ---
function triggerConfetti() {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    for (let i = 0; i < 48; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.left = (Math.random() * 100) + 'vw';
        piece.style.animationDelay = (Math.random() * 1.5) + 's';
        piece.style.animationDuration = (1.5 + Math.random() * 2) + 's';
        piece.style.width = (6 + Math.random() * 6) + 'px';
        piece.style.height = (6 + Math.random() * 6) + 'px';
        container.appendChild(piece);
    }

    setTimeout(() => container.remove(), 4500);
}

// --- UTILS ---
function createPill(txt, fn) {
    const b = document.createElement('button');
    b.className = 'word-pill';
    b.innerText = txt;
    b.onclick = fn;
    return b;
}

function initBuilder(ui, data) {
    ui.querySelector('.target-pattern').innerText = data.pattern;
    const inputEl = ui.querySelector('.ai-input');
    const btnSubmit = ui.querySelector('.btn-submit-ai');
    const resultBox = ui.querySelector('.ai-result');
    const loadingEl = ui.querySelector('.builder-loading');

    inputEl.value = '';
    resultBox.style.display = 'none';

    btnSubmit.onclick = async () => {
        const userSentence = inputEl.value.trim();
        if (!userSentence) {
            inputEl.focus();
            inputEl.style.borderColor = 'var(--danger)';
            setTimeout(() => inputEl.style.borderColor = '', 1500);
            return;
        }

        btnSubmit.disabled = true;
        loadingEl.style.display = 'flex';
        resultBox.style.display = 'none';

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ words: [data.pattern], userSentence })
            });

            if (!response.ok) throw new Error("Gagal menghubungi Sensei AI");

            const result = await response.json();
            renderAIResult(ui, result);
        } catch (error) {
            loadingEl.style.display = 'none';
            resultBox.style.display = 'block';
            resultBox.querySelector('.ai-result-title').innerText = 'Terjadi Kesalahan';
            resultBox.querySelector('.ai-correction').innerText = error.message;
        } finally {
            btnSubmit.disabled = false;
            loadingEl.style.display = 'none';
        }
    };
}

function renderAIResult(ui, res) {
    const box = ui.querySelector('.ai-result');
    const badge = ui.querySelector('.ai-score-badge');

    box.style.display = 'block';
    badge.innerText = `Skor: ${res.score}/10`;

    if (res.score >= 8) {
        badge.style.background = 'var(--success)';
    } else if (res.score >= 5) {
        badge.style.background = 'var(--warning)';
    } else {
        badge.style.background = 'var(--danger)';
    }

    const correctionEl = ui.querySelector('.ai-correction');
    correctionEl.innerHTML = res.is_correct
        ? `<span style="color:var(--success);font-weight:700;">✓ Sempurna!</span>`
        : `<span style="color:var(--danger);">${res.correction}</span>`;

    ui.querySelector('.ai-explanation').innerText = res.explanation;

    const altList = ui.querySelector('.ai-alt-list');
    altList.innerHTML = '';
    if (res.alternatives) {
        res.alternatives.forEach(alt => {
            const li = document.createElement('li');
            li.innerText = alt;
            altList.appendChild(li);
        });
    }

    const altRow = ui.querySelector('.ai-alts');
    altRow.style.display = (res.alternatives && res.alternatives.length) ? 'flex' : 'none';
}

function speak(txt) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(txt);
        u.lang = 'ja-JP';
        window.speechSynthesis.speak(u);
    }
}

function toggleFav(id, btn) {
    if (favorites.includes(id)) {
        favorites = favorites.filter(x => x !== id);
    } else {
        favorites.push(id);
    }
    saveUserStats();
    updateFavIcon(btn, id);
}

function updateFavIcon(btn, id) {
    const i = btn.querySelector('i');
    if (favorites.includes(id)) {
        btn.classList.add('active');
        i.classList.replace('ph-heart', 'ph-heart-fill');
    } else {
        btn.classList.remove('active');
        i.classList.replace('ph-heart-fill', 'ph-heart');
    }
}

document.getElementById('btnRomaji').addEventListener('click', () => {
    showRomaji = !showRomaji;
    const btn = document.getElementById('btnRomaji');
    btn.classList.toggle('active', showRomaji);
    document.querySelectorAll('.romaji').forEach(e => {
        e.style.display = showRomaji ? 'block' : 'none';
    });
});

document.getElementById('btnFilterFav').addEventListener('click', (e) => {
    showOnlyFav = !showOnlyFav;
    e.currentTarget.classList.toggle('active', showOnlyFav);
    if (fullData.length > 0) renderTree();
});
