'use client';

import { useEffect, useState, useCallback } from 'react';
import { useProgress } from '@/context/ProgressContext';
import { showToast } from '@/components/Toast';
import { GameController, ArrowLeft, Trophy, Lightning, CheckCircle, XCircle } from '@phosphor-icons/react';
import Link from 'next/link';

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
        if (/^[。、！？.!?]+$/.test(token) && merged.length > 0) {
            merged[merged.length - 1] += token;
        } else {
            merged.push(token);
        }
    });
    return merged;
}

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

const levels = [
    { id: 'A1', name: 'Starter' },
    { id: 'A21', name: 'Elementary I' },
    { id: 'A22', name: 'Elementary II' },
];

export default function QuizPage() {
    const [phase, setPhase] = useState('setup');
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [grammarPool, setGrammarPool] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [totalAnswered, setTotalAnswered] = useState(0);
    const [loading, setLoading] = useState(false);
    const { recordQuiz, markAsLearned, progress } = useProgress();

    // Quiz state for current question
    const [quizType, setQuizType] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [userAnswer, setUserAnswer] = useState([]);
    const [bankWords, setBankWords] = useState([]);
    const [particleTarget, setParticleTarget] = useState(null);
    const [particleOptions, setParticleOptions] = useState([]);
    const [particleTokens, setParticleTokens] = useState([]);
    const [mcOptions, setMcOptions] = useState([]);
    const [mcSelected, setMcSelected] = useState(null);
    const [allMeanings, setAllMeanings] = useState([]);

    const startQuiz = async (lvl) => {
        setSelectedLevel(lvl);
        setLoading(true);
        try {
            const filter = lvl === 'review'
                ? ''
                : lvl === 'random'
                    ? ''
                    : `?level=${lvl}`;
            const res = await fetch(`/api/grammar${filter}`);
            let data = await res.json();

            if (lvl === 'review') {
                data = data.filter(g => !progress.learnedItems.includes(g.grammar_id));
            }

            // Shuffle and take max 10
            data = data.sort(() => Math.random() - 0.5).slice(0, 10);
            setGrammarPool(data);
            setAllMeanings(data.map(g => g.meaning_id));
            setCurrentIndex(0);
            setScore(0);
            setTotalAnswered(0);
            setPhase('playing');
            setupQuestion(data[0], data.map(g => g.meaning_id));
        } catch (err) {
            showToast('Gagal memuat data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const setupQuestion = useCallback((grammar, meanings) => {
        if (!grammar || !grammar.example?.[0]) return;
        setFeedback(null);
        setMcSelected(null);
        setUserAnswer([]);

        const sentence = grammar.example[0].jp;
        const tokens = smartSegment(sentence);
        const particles = tokens.filter(t => /^(は|が|を|に|で|へ|と|も|から|まで|ね|よ|か)$/.test(t));

        // Random quiz type
        const types = ['scramble', 'mc'];
        if (particles.length > 0) types.push('particle');
        const type = types[Math.floor(Math.random() * types.length)];
        setQuizType(type);

        if (type === 'scramble') {
            const shuffled = [...tokens].sort(() => Math.random() - 0.5);
            setBankWords(shuffled);
        } else if (type === 'particle') {
            const target = particles[Math.floor(Math.random() * particles.length)];
            const commons = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も'];
            let opts = commons.filter(p => p !== target).sort(() => 0.5 - Math.random()).slice(0, 3);
            opts.push(target);
            opts.sort(() => 0.5 - Math.random());
            setParticleTarget(target);
            setParticleOptions(opts);
            setParticleTokens(tokens);
        } else if (type === 'mc') {
            const correct = grammar.meaning_id;
            const fakes = (meanings || allMeanings)
                .filter(m => m !== correct)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
            const opts = [...fakes, correct].sort(() => 0.5 - Math.random());
            setMcOptions(opts);
        }
    }, [allMeanings]);

    const handleAnswer = (isCorrect, grammarId) => {
        setFeedback(isCorrect ? 'correct' : 'wrong');
        setTotalAnswered(prev => prev + 1);
        if (isCorrect) {
            setScore(prev => prev + 1);
            triggerConfetti();
        }
        recordQuiz(grammarId, isCorrect);
        if (isCorrect) markAsLearned(grammarId);
    };

    const nextQuestion = () => {
        const nextIdx = currentIndex + 1;
        if (nextIdx >= grammarPool.length) {
            setPhase('result');
        } else {
            setCurrentIndex(nextIdx);
            setupQuestion(grammarPool[nextIdx], allMeanings);
        }
    };

    const handleScrambleClick = (word, fromBank) => {
        if (feedback) return;
        if (fromBank) {
            setUserAnswer(prev => [...prev, word]);
            setBankWords(prev => { const idx = prev.indexOf(word); const n = [...prev]; n.splice(idx, 1); return n; });
        } else {
            setBankWords(prev => [...prev, word]);
            setUserAnswer(prev => { const idx = prev.indexOf(word); const n = [...prev]; n.splice(idx, 1); return n; });
        }
    };

    const currentGrammar = grammarPool[currentIndex];

    useEffect(() => {
        if (quizType === 'scramble' && bankWords.length === 0 && userAnswer.length > 0 && currentGrammar) {
            const sentence = currentGrammar.example[0].jp;
            const ans = userAnswer.join('').replace(/\s+|　/g, '');
            const tgt = sentence.replace(/\s+|　/g, '');
            handleAnswer(ans === tgt, currentGrammar.grammar_id);
        }
    }, [bankWords, userAnswer, quizType, currentGrammar]);

    // Setup phase
    if (phase === 'setup') {
        return (
            <div className="p-4 lg:p-8 max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-text-bright mb-2">Quiz Mode</h1>
                <p className="text-text-dim text-sm mb-6">Pilih level atau mode untuk memulai quiz</p>

                <div className="space-y-3">
                    {levels.map(lvl => (
                        <button
                            key={lvl.id}
                            onClick={() => startQuiz(lvl.id)}
                            disabled={loading}
                            className="w-full bg-surface rounded-xl border border-border p-4 text-left hover:border-primary/30 transition-all"
                        >
                            <h3 className="font-bold text-text-bright">{lvl.id} — {lvl.name}</h3>
                            <p className="text-xs text-text-dim mt-0.5">Quiz grammar level {lvl.id}</p>
                        </button>
                    ))}
                    <button
                        onClick={() => startQuiz('random')}
                        disabled={loading}
                        className="w-full bg-surface rounded-xl border border-warning/30 p-4 text-left hover:border-warning/50 transition-all"
                    >
                        <h3 className="font-bold text-warning">🎲 Random Mix</h3>
                        <p className="text-xs text-text-dim mt-0.5">Campuran dari semua level</p>
                    </button>
                    <button
                        onClick={() => startQuiz('review')}
                        disabled={loading}
                        className="w-full bg-surface rounded-xl border border-accent/30 p-4 text-left hover:border-accent/50 transition-all"
                    >
                        <h3 className="font-bold text-accent">🔄 Review (Belum Dikuasai)</h3>
                        <p className="text-xs text-text-dim mt-0.5">Fokus pada grammar yang belum dipelajari</p>
                    </button>
                </div>
                {loading && <p className="text-center text-text-dim text-sm mt-4">Memuat...</p>}
            </div>
        );
    }

    // Result phase
    if (phase === 'result') {
        const pct = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
        return (
            <div className="p-4 lg:p-8 max-w-2xl mx-auto text-center">
                <div className="bg-surface rounded-2xl border border-border p-8 animate-slide-up">
                    <Trophy size={64} weight="fill" className={`mx-auto mb-4 ${pct >= 70 ? 'text-warning' : 'text-text-dim'}`} />
                    <h2 className="text-2xl font-bold text-text-bright mb-2">Quiz Selesai!</h2>
                    <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
                        {score}/{totalAnswered}
                    </p>
                    <p className="text-text-dim text-sm mb-6">Akurasi: {pct}%</p>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setPhase('setup')}
                            className="px-5 py-2.5 bg-surface-light hover:bg-surface-lighter rounded-xl text-sm font-medium text-text transition-all"
                        >
                            Quiz Lagi
                        </button>
                        <Link href="/" className="px-5 py-2.5 bg-primary hover:bg-primary-dark rounded-xl text-sm font-medium text-white transition-all">
                            Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Playing phase
    if (!currentGrammar) return null;

    return (
        <div className="p-4 lg:p-8 max-w-2xl mx-auto">
            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setPhase('setup')} className="text-text-dim hover:text-text">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1 h-2 bg-surface-lighter rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / grammarPool.length) * 100}%` }}
                    />
                </div>
                <span className="text-xs text-text-dim font-medium">{currentIndex + 1}/{grammarPool.length}</span>
                <span className="text-xs text-success font-bold">✓{score}</span>
            </div>

            {/* Current grammar info */}
            <div className="bg-surface rounded-xl border border-border p-4 mb-4">
                <span className="text-xs text-text-dim">{currentGrammar.level} · L{currentGrammar.lesson}</span>

                {/* Scramble */}
                {quizType === 'scramble' && (
                    <div className="mt-3">
                        <p className="text-sm text-text-dim mb-2">Terjemahkan:</p>
                        <p className="text-base text-text-bright font-medium mb-4">"{currentGrammar.example[0].id}"</p>
                        <div className="min-h-[50px] border-2 border-dashed border-border rounded-xl p-3 flex flex-wrap gap-2 mb-3">
                            {userAnswer.length === 0 ? (
                                <span className="text-sm text-text-dim">Klik kata...</span>
                            ) : (
                                userAnswer.map((w, i) => (
                                    <button key={i} onClick={() => handleScrambleClick(w, false)} className="word-pill">{w}</button>
                                ))
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {bankWords.map((w, i) => (
                                <button key={i} onClick={() => handleScrambleClick(w, true)} className="word-pill">{w}</button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Particle */}
                {quizType === 'particle' && (
                    <div className="mt-3">
                        <p className="text-sm text-text-dim mb-2">Isi partikel yang hilang:</p>
                        <p className="font-jp text-lg text-text-bright mt-2 text-center leading-relaxed">
                            {particleTokens.map((t, i) => (
                                t === particleTarget ? (
                                    <span key={i} className={`inline-block px-3 py-0.5 mx-0.5 rounded-lg font-bold ${feedback === 'correct' ? 'bg-success/20 text-success' :
                                            feedback === 'wrong' ? 'bg-danger/20 text-danger' :
                                                'bg-primary/20 text-primary-light'
                                        }`}>
                                        {feedback ? particleTarget : '？'}
                                    </span>
                                ) : <span key={i}>{t}</span>
                            ))}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                            {particleOptions.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (feedback) return;
                                        setMcSelected(opt);
                                        handleAnswer(opt === particleTarget, currentGrammar.grammar_id);
                                    }}
                                    disabled={!!feedback}
                                    className={`word-pill ${feedback && opt === particleTarget ? '!bg-success !border-success !text-white' :
                                            feedback && mcSelected === opt && opt !== particleTarget ? '!bg-danger !border-danger !text-white' : ''
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* MC */}
                {quizType === 'mc' && (
                    <div className="mt-3">
                        <p className="text-sm text-text-dim mb-1">Apa arti dari:</p>
                        <p className="font-jp text-xl font-bold text-text-bright text-center mb-4">{currentGrammar.pattern}</p>
                        <div className="space-y-2">
                            {mcOptions.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (feedback) return;
                                        setMcSelected(opt);
                                        handleAnswer(opt === currentGrammar.meaning_id, currentGrammar.grammar_id);
                                    }}
                                    disabled={!!feedback}
                                    className={`w-full text-left p-3 rounded-xl text-sm border transition-all ${feedback && opt === currentGrammar.meaning_id ? 'bg-success/20 border-success/50 text-success' :
                                            feedback && mcSelected === opt ? 'bg-danger/20 border-danger/50 text-danger' :
                                                !feedback ? 'bg-surface-light border-border hover:border-primary/30 text-text' :
                                                    'bg-surface-light border-border text-text-dim'
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Feedback & Next */}
            {feedback && (
                <div className="space-y-3 animate-slide-up">
                    <div className={`text-center p-3 rounded-xl font-medium text-sm ${feedback === 'correct' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                        }`}>
                        {feedback === 'correct' ? '🎉 Benar!' : '❌ Salah!'}
                    </div>
                    <button
                        onClick={nextQuestion}
                        className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium text-sm transition-all"
                    >
                        {currentIndex + 1 >= grammarPool.length ? '📊 Lihat Hasil' : '➡️ Soal Berikutnya'}
                    </button>
                </div>
            )}
        </div>
    );
}
