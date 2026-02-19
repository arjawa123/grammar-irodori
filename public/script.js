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
    loading: document.getElementById('loadingIndicator'), // Pake loading biasa
    welcome: document.getElementById('welcomeScreen'),
    tpl: document.getElementById('contentTemplate'),
    streak: document.getElementById('streakCount'),
    xp: document.getElementById('xpCount'),
    
    // Select Elements
    selectWrapper: document.querySelector('.custom-select-wrapper'),
    selectTrigger: document.getElementById('levelSelectTrigger'),
    selectOptions: document.getElementById('levelOptions'),
    selectValue: document.querySelector('.select-value'),
};

// --- INIT ---
window.onload = () => {
    loadUserStats();
    setupCustomSelect();
    
    // Langsung buka dropdown, tidak perlu loading Kuromoji
    els.selectWrapper.classList.remove('locked');
};

// --- CUSTOM SELECT LOGIC ---
function setupCustomSelect() {
    els.selectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        els.selectOptions.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!els.selectTrigger.contains(e.target)) {
            els.selectOptions.classList.remove('open');
        }
    });

    const options = document.querySelectorAll('.option');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            // Cek lock state
            if (els.selectWrapper.classList.contains('locked')) return;

            const val = opt.getAttribute('data-value'); // Sekarang isinya "N5"
            const text = opt.innerText;
            
            els.selectValue.innerText = text.trim();
            els.selectOptions.classList.remove('open');
            
            // Simpan level saat ini
            currentLevelFile = val; 
            
            // Panggil API dengan format URL baru
            // Jika val = "N5", maka fetch ke /api/grammar/N5
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

async function loadData(url) {
    if (!url) return;
    try {
        els.welcome.style.display = 'none';
        els.list.style.display = 'none';
        els.loading.style.display = 'block';
        els.loading.querySelector('p').innerText = "Memuat Data dari Database..."; // Update text dikit
        
        const res = await fetch(url);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
             throw new Error("File JSON tidak ditemukan.");
        }

        const json = await res.json();
        
        // Data dari MongoDB sudah punya struktur yang kita mau.
        // Kita tetap pastikan uniqueId ada.
        fullData = json.map((d, i) => ({ 
            ...d, 
            uniqueId: d.grammar_id // Gunakan ID dari database
        }));
        
        els.loading.style.display = 'none';
        els.list.style.display = 'block';
        renderTree();
    } catch (e) {
        els.loading.style.display = 'none';
        els.list.style.display = 'block';
        els.list.innerHTML = `<div style="text-align:center; padding:30px; color:var(--red-ink);"><h3>Gomen ne...</h3><p>${e.message}</p></div>`;
    }
}

// --- RENDER TREE ---
function renderTree() {
    els.list.innerHTML = '';
    const dataToRender = showOnlyFav ? fullData.filter(d => favorites.includes(d.uniqueId)) : fullData;

    if(dataToRender.length === 0) {
        els.list.innerHTML = `<div style="text-align:center; padding:20px; color:#666;">Tidak ada item.</div>`;
        return;
    }

    const grouped = {};
    dataToRender.forEach(item => {
        const k = item.lesson || "Extra";
        if(!grouped[k]) grouped[k] = [];
        grouped[k].push(item);
    });

    Object.keys(grouped).sort((a,b) => a - b).forEach(lesson => {
        const lessonGroup = document.createElement('div');
        lessonGroup.className = 'lesson-group';
        
        const lessonHeader = document.createElement('div');
        lessonHeader.className = 'lesson-header';
        lessonHeader.innerHTML = `<span>Lesson ${lesson}</span><i class="ph ph-caret-down"></i>`;
        
        const lessonContent = document.createElement('div');
        lessonContent.className = 'lesson-content-wrapper';

        lessonHeader.addEventListener('click', () => {
            lessonGroup.classList.toggle('open');
        });

        grouped[lesson].forEach(item => {
            lessonContent.appendChild(createGrammarItem(item));
        });

        lessonGroup.append(lessonHeader, lessonContent);
        els.list.appendChild(lessonGroup);
    });
}

function createGrammarItem(item) {
    const el = document.createElement('div');
    el.className = 'tree-item';
    if(passedItems.includes(item.uniqueId)) el.classList.add('done');

    el.innerHTML = `
        <div class="tree-node"></div>
        <div class="accordion-header">
            <h3 class="pattern-title">${item.pattern}</h3>
            <i class="ph ph-caret-down"></i>
        </div>
        <div class="accordion-content"></div>
    `;

    el.querySelector('.accordion-header').onclick = (e) => {
        e.stopPropagation();
        const isOpen = el.classList.contains('active');
        el.parentElement.querySelectorAll('.tree-item.active').forEach(sib => { if(sib !== el) sib.classList.remove('active'); });

        if(!isOpen) {
            el.classList.add('active');
            const contentBox = el.querySelector('.accordion-content');
            if(!contentBox.hasChildNodes()) renderDetails(contentBox, item, el);
        } else {
            el.classList.remove('active');
        }
    };
    return el;
}

function renderDetails(container, data, treeItemEl) {
    const clone = els.tpl.content.cloneNode(true);
    
    clone.querySelector('.meaning').innerText = data.meaning || data.meaning_id;
    clone.querySelector('.usage-box').innerText = data.usage;
    clone.querySelector('.note-area').innerText = data.notes ? `Note: ${data.notes}` : '';

    const exList = clone.querySelector('.examples-list');
    data.example.forEach(ex => {
        const div = document.createElement('div');
        div.className = 'sticky-note';
        div.onclick = () => speak(ex.jp);
        
        // Use Regex Highlight
        const highlighted = highlightSyntax(ex.jp, data.pattern);
        
        div.innerHTML = `
            <p class="jp">${highlighted}</p>
            <p class="romaji" style="display:${showRomaji?'block':'none'}">${ex.romaji}</p>
            <p class="trans">${ex.id}</p> `;
        exList.appendChild(div);
    });

    const btnFav = clone.querySelector('.btn-fav');
    updateFavIcon(btnFav, data.uniqueId);
    btnFav.onclick = () => toggleFav(data.uniqueId, btnFav);
    clone.querySelector('.btn-audio').onclick = () => speak(data.pattern + ". " + data.example[0].jp);

    const sections = { learn: clone.querySelector('.learn-section'), quiz: clone.querySelector('.quiz-section'), builder: clone.querySelector('.builder-section') };
    const switchSec = (name) => { Object.values(sections).forEach(s => s.style.display = 'none'); sections[name].style.display = 'block'; };

    clone.querySelector('.btn-start-quiz').onclick = () => { switchSec('quiz'); initQuiz(sections.quiz, data, treeItemEl); };
    clone.querySelector('.btn-start-builder').onclick = () => { switchSec('builder'); initBuilder(sections.builder, data); };
    clone.querySelectorAll('.btn-back-learn').forEach(b => b.onclick = () => switchSec('learn'));

    container.appendChild(clone);
}

// --- REGEX SYNTAX HIGHLIGHTER (PENGGANTI KUROMOJI) ---
function highlightSyntax(sentence, pattern) {
    // 1. Ekstrak Inti Grammar
    let grammarCore = pattern.replace(/[NVA-Z0-9~～\(\)]+/g, '').trim();
    if (grammarCore.length === 0) grammarCore = "###IGNORE###";

    // 2. Tokenisasi Cerdas dengan Regex
    // Memecah berdasarkan: Kanji, Katakana(termasuk panjang), Hiragana, Latin, Tanda Baca
    const tokens = smartSegment(sentence);
    
    let html = "";
    tokens.forEach(token => {
        let className = "hl-noun"; // Default (Hitam)

        // Cek Grammar Pattern
        if (token === grammarCore || (token.includes(grammarCore) && grammarCore.length > 1)) {
            className = "hl-grammar"; // Merah
        }
        // Cek Partikel Umum (Regex List)
        else if (/^(は|が|を|に|で|へ|と|も|から|まで|ね|よ|か)$/.test(token)) {
            className = "hl-particle"; // Biru
        }

        html += `<span class="${className}">${token}</span>`;
    });

    return html;
}

// --- QUIZ SYSTEM (Menggunakan Regex Segmenter) ---
function initQuiz(ui, data, treeItemEl) {
    const sentence = data.example[0].jp;
    ui.querySelector('.quiz-question').innerText = `"${data.example[0].id}"`;
    const dropZone = ui.querySelector('.drop-zone');
    const wordBank = ui.querySelector('.word-bank');
    const feedback = ui.querySelector('.feedback-msg');

    // Reset UI
    dropZone.innerHTML = ''; wordBank.innerHTML = ''; dropZone.className = 'drop-zone'; feedback.innerText = '';

    // Gunakan Regex Segmenter
    const tokens = smartSegment(sentence);
    
    // Logic Quiz Hybrid (Scramble / Particle)
    // Cek apakah ada partikel di dalam token
    const particles = tokens.filter(t => /^(は|が|を|に|で|へ|と|も|から|まで|ね|よ|か)$/.test(t));
    const gameMode = (particles.length > 0 && Math.random() > 0.5) ? 'PARTICLE' : 'SCRAMBLE';

    if (gameMode === 'PARTICLE') {
        startParticleQuiz(sentence, tokens, ui, treeItemEl, data);
    } else {
        startScrambleQuiz(sentence, tokens, ui, treeItemEl, data);
    }
}

// --- SMART SEGMENTER (REGEX BASED) ---
function smartSegment(text) {
    const cleanText = text.trim();
    let tokens = [];

    // Prioritas 1: Jika JSON pakai spasi
    if (cleanText.includes(' ')) {
        tokens = cleanText.split(/\s+/);
    } else {
        // Prioritas 2: Regex Cerdas
        // [一-龯々]+ : Kanji
        // [ァ-ンー]+  : Katakana + Tanda Panjang
        // [ぁ-ん]+    : Hiragana
        // [a-zA-Z0-9]+: Latin
        // [。、！？.!?]+ : Tanda Baca
        const regex = /([一-龯々]+|[ァ-ンー]+|[ぁ-ん]+|[a-zA-Z0-9]+|[。、！？.!?]+)/g;
        tokens = cleanText.match(regex) || [cleanText];
    }

    // Merge Tanda Baca ke token sebelumnya
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
        dropZone.innerHTML = userAnswer.length ? '' : '<span style="color:#aaa">Susun kalimat...</span>';
        if(userAnswer.length) dropZone.classList.remove('empty'); else dropZone.classList.add('empty');
        wordBank.innerHTML = '';

        userAnswer.forEach((w, i) => dropZone.appendChild(createPill(w, () => { userAnswer.splice(i, 1); quizWords.push(w); render(); })));
        quizWords.forEach((w, i) => wordBank.appendChild(createPill(w, () => { quizWords.splice(i, 1); userAnswer.push(w); render(); checkScrambleWin(); })));
    }

    function checkScrambleWin() {
        if(quizWords.length === 0) {
            const ans = userAnswer.join('').replace(/\s+|　/g,'');
            const tgt = sentence.replace(/\s+|　/g,'');
            handleWinLoss(ans === tgt, ui, treeItemEl, data);
        }
    }
    render();
}

function startParticleQuiz(sentence, tokens, ui, treeItemEl, data) {
    const dropZone = ui.querySelector('.drop-zone');
    const wordBank = ui.querySelector('.word-bank');
    
    // Cari partikel
    const particleTokens = tokens.filter(t => /^(は|が|を|に|で|へ|と|も|から|まで|ね|よ|か)$/.test(t));
    const target = particleTokens[Math.floor(Math.random() * particleTokens.length)];
    
    let html = "";
    tokens.forEach(t => {
        if(t === target) html += `<div class="blank-slot">?</div>`;
        else html += `<span>${t}</span>`;
    });
    
    dropZone.innerHTML = `<div style="font-size:1.3rem; line-height:2;">${html}</div>`;
    
    const commons = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も'];
    let opts = commons.filter(p => p !== target).sort(() => 0.5 - Math.random()).slice(0, 3);
    opts.push(target);
    opts.sort(() => 0.5 - Math.random());

    wordBank.innerHTML = '';
    opts.forEach(opt => {
        wordBank.appendChild(createPill(opt, () => {
            const slot = dropZone.querySelector('.blank-slot');
            slot.innerText = opt; slot.classList.add('filled');
            setTimeout(() => handleWinLoss(opt === target, ui, treeItemEl, data), 300);
        }));
    });
}

function handleWinLoss(isCorrect, ui, treeItemEl, data) {
    const feedback = ui.querySelector('.feedback-msg');
    if (isCorrect) {
        feedback.innerText = "SEIKAI! 🎉"; feedback.className = "feedback-msg correct";
        speak("Seikai!");
        if(!passedItems.includes(data.uniqueId)) { passedItems.push(data.uniqueId); userStats.streak++; userStats.xp += 20; saveUserStats(); treeItemEl.classList.add('done', 'passed'); }
    } else {
        feedback.innerText = "CHIGAU... 😅"; feedback.className = "feedback-msg wrong";
        userStats.streak = 0; saveUserStats();
    }
}

// --- UTILS ---
function createPill(txt, fn) { const b = document.createElement('button'); b.className = 'word-pill'; b.innerText = txt; b.onclick = fn; return b; }
function initBuilder(ui, data) {
    ui.querySelector('.target-pattern').innerText = data.pattern;
    const inputEl = ui.querySelector('.ai-input');
    const btnSubmit = ui.querySelector('.btn-submit-ai');
    const resultBox = ui.querySelector('.ai-result');
    const loadingEl = ui.querySelector('.builder-loading');
    
    inputEl.value = ""; resultBox.style.display = 'none';
    
    btnSubmit.onclick = async () => {
        const userSentence = inputEl.value.trim();
        if(!userSentence) return alert("Tulis kalimat dulu dong! 😅");
        btnSubmit.disabled = true; loadingEl.style.display = 'block'; resultBox.style.display = 'none';
        try {
            const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ words: [data.pattern], userSentence: userSentence }) });
            if(!response.ok) throw new Error("Gagal menghubungi Sensei AI");
            const result = await response.json();
            renderAIResult(ui, result);
        } catch (error) { alert("Error: " + error.message); } 
        finally { btnSubmit.disabled = false; loadingEl.style.display = 'none'; }
    };
}
function renderAIResult(ui, res) {
    const box = ui.querySelector('.ai-result'); const badge = ui.querySelector('.ai-score-badge');
    box.style.display = 'block'; badge.innerText = `Skor: ${res.score}/10`; badge.style.background = res.score >= 8 ? 'var(--green-marker)' : (res.score >= 5 ? '#e67e22' : 'var(--red-ink)');
    ui.querySelector('.ai-correction').innerHTML = res.is_correct ? `<span style="color:green">Sempurna!</span>` : `<span style="color:red">${res.correction}</span>`;
    ui.querySelector('.ai-explanation').innerText = res.explanation;
    const altList = ui.querySelector('.ai-alt-list'); altList.innerHTML = '';
    if(res.alternatives) res.alternatives.forEach(alt => { const li = document.createElement('li'); li.innerText = alt; altList.appendChild(li); });
}
function speak(txt) { if('speechSynthesis' in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = 'ja-JP'; window.speechSynthesis.speak(u); }}
function toggleFav(id, btn) { favorites.includes(id) ? favorites = favorites.filter(x => x !== id) : favorites.push(id); saveUserStats(); updateFavIcon(btn, id); }
function updateFavIcon(btn, id) { const i = btn.querySelector('i'); if(favorites.includes(id)) { btn.classList.add('active'); i.classList.replace('ph-heart', 'ph-heart-fill'); } else { btn.classList.remove('active'); i.classList.replace('ph-heart-fill', 'ph-heart'); }}
document.getElementById('btnRomaji').addEventListener('click', () => { showRomaji = !showRomaji; document.querySelectorAll('.romaji').forEach(e => e.style.display = showRomaji?'block':'none'); });
document.getElementById('btnFilterFav').addEventListener('click', (e) => { showOnlyFav = !showOnlyFav; e.currentTarget.classList.toggle('active'); renderTree(); });
