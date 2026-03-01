'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProgress } from '@/context/ProgressContext';
import { showToast } from '@/components/Toast';
import {
    ArrowLeft, Heart, CheckCircle, SpeakerHigh, Sparkle,
    GameController, ArrowRight, CaretLeft, CaretRight, Eye, EyeSlash, Info, Lightbulb
} from '@phosphor-icons/react';

function speak(text) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ja-JP';
        window.speechSynthesis.speak(u);
    }
}

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

function highlightSyntax(sentence, pattern) {
    let grammarCore = pattern.replace(/[NVA-Z0-9~～()]+/g, '').trim();
    if (grammarCore.length === 0) grammarCore = '###IGNORE###';
    const tokens = smartSegment(sentence);
    return tokens.map((token, i) => {
        let cls = 'hl-noun';
        if (token === grammarCore || (token.includes(grammarCore) && grammarCore.length > 1)) cls = 'hl-grammar';
        else if (/^(は|が|を|に|で|へ|と|も|から|まで|ね|よ|か)$/.test(token)) cls = 'hl-particle';
        return <span key={i} className={cls}>{token}</span>;
    });
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

export default function GrammarDetailPage() {
    const params = useParams();
    const grammarId = params.id;
    const [grammar, setGrammar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('learn');
    const [showRomaji, setShowRomaji] = useState(false);
    const { toggleFavorite, markAsLearned, unmarkLearned, recordQuiz, isFavorite, isLearned } = useProgress();

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/grammar?id=${grammarId}`);
                const data = await res.json();
                setGrammar(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [grammarId]);

    if (loading) {
        return (
            <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-4">
                <div className="skeleton h-10 w-48" />
                <div className="skeleton h-48" />
                <div className="skeleton h-32" />
            </div>
        );
    }

    if (!grammar) {
        return (
            <div className="p-4 lg:p-8 max-w-3xl mx-auto text-center text-text-dim">
                Grammar tidak ditemukan.
            </div>
        );
    }

    const learned = isLearned(grammar.grammar_id);
    const fav = isFavorite(grammar.grammar_id);

    return (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
            {/* Back link */}
            <Link
                href={`/browse/${grammar.level}/${grammar.lesson}`}
                className="inline-flex items-center gap-1.5 text-text-dim hover:text-text text-sm mb-4 transition-colors"
            >
                <ArrowLeft size={16} /> Lesson {grammar.lesson}
            </Link>

            {/* Header */}
            <div className="bg-surface rounded-2xl border border-border p-5 lg:p-6 mb-4">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary/20 text-primary-light">{grammar.level}</span>
                            <span className="text-xs text-text-dim">L{grammar.lesson}</span>
                            {learned && <CheckCircle size={16} weight="fill" className="text-success" />}
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-text-bright font-jp">{grammar.pattern}</h1>
                        <p className="text-base text-text-dim mt-1">{grammar.meaning_id}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => speak(grammar.pattern)}
                            className="w-10 h-10 rounded-xl bg-surface-light hover:bg-surface-lighter flex items-center justify-center transition-all"
                            title="Dengarkan"
                        >
                            <SpeakerHigh size={18} className="text-text-dim" />
                        </button>
                        <button
                            onClick={() => {
                                toggleFavorite(grammar.grammar_id);
                                showToast(fav ? 'Dihapus dari favorit' : 'Ditambahkan ke favorit', fav ? 'info' : 'success');
                            }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${fav ? 'bg-danger/20 text-danger' : 'bg-surface-light hover:bg-surface-lighter text-text-dim'
                                }`}
                            title="Favorit"
                        >
                            <Heart size={18} weight={fav ? 'fill' : 'regular'} />
                        </button>
                    </div>
                </div>

                {/* Tab selector */}
                <div className="flex gap-1 bg-surface-light rounded-xl p-1">
                    {[
                        { id: 'learn', label: 'Belajar', icon: Lightbulb },
                        { id: 'quiz', label: 'Quiz', icon: GameController },
                        { id: 'ai', label: 'AI Builder', icon: Sparkle },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-text-dim hover:text-text'
                                }`}
                        >
                            <tab.icon size={16} weight={activeTab === tab.id ? 'fill' : 'regular'} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'learn' && (
                <LearnTab grammar={grammar} showRomaji={showRomaji} setShowRomaji={setShowRomaji} learned={learned} markAsLearned={markAsLearned} unmarkLearned={unmarkLearned} />
            )}
            {activeTab === 'quiz' && (
                <QuizTab grammar={grammar} recordQuiz={recordQuiz} markAsLearned={markAsLearned} />
            )}
            {activeTab === 'ai' && (
                <AIBuilderTab grammar={grammar} />
            )}
        </div>
    );
}

function LearnTab({ grammar, showRomaji, setShowRomaji, learned, markAsLearned, unmarkLearned }) {
    return (
        <div className="space-y-4 animate-fade-in">
            {/* Usage */}
            <div className="bg-surface rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-xs text-primary-light font-medium mb-2">
                    <Info size={14} /> Penggunaan
                </div>
                <p className="text-sm text-text">{grammar.usage}</p>
            </div>

            {/* Examples */}
            <div className="bg-surface rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-text-dim font-medium">Contoh Kalimat</span>
                    <button
                        onClick={() => setShowRomaji(!showRomaji)}
                        className="flex items-center gap-1 text-xs text-text-dim hover:text-text transition-colors"
                    >
                        {showRomaji ? <EyeSlash size={14} /> : <Eye size={14} />}
                        {showRomaji ? 'Sembunyikan' : 'Tampilkan'} Romaji
                    </button>
                </div>
                <div className="space-y-3">
                    {grammar.example?.map((ex, i) => (
                        <button
                            key={i}
                            onClick={() => speak(ex.jp)}
                            className="w-full text-left bg-surface-light rounded-xl p-3.5 hover:bg-surface-lighter transition-all group"
                        >
                            <p className="font-jp text-base text-text-bright leading-relaxed">
                                {highlightSyntax(ex.jp, grammar.pattern)}
                            </p>
                            {showRomaji && <p className="text-xs text-text-dim mt-1 italic">{ex.romaji}</p>}
                            <p className="text-sm text-text-dim mt-1">{ex.id}</p>
                            <SpeakerHigh size={14} className="text-text-dim opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Notes */}
            {grammar.notes && (
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                    <p className="text-sm text-text">📝 {grammar.notes}</p>
                </div>
            )}

            {/* Mark as learned */}
            <button
                onClick={() => {
                    if (learned) {
                        unmarkLearned(grammar.grammar_id);
                        showToast('Ditandai belum dipelajari', 'info');
                    } else {
                        markAsLearned(grammar.grammar_id);
                        showToast('Ditandai sudah dipelajari! +20 XP', 'success');
                        triggerConfetti();
                    }
                }}
                className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${learned
                        ? 'bg-success/20 text-success border border-success/30 hover:bg-success/30'
                        : 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25'
                    }`}
            >
                {learned ? '✅ Sudah Dipelajari (Klik untuk batalkan)' : '✅ Tandai Sudah Dipelajari'}
            </button>
        </div>
    );
}

function QuizTab({ grammar, recordQuiz, markAsLearned }) {
    const [quizState, setQuizState] = useState('idle');
    const [quizType, setQuizType] = useState(null);
    const [userAnswer, setUserAnswer] = useState([]);
    const [bankWords, setBankWords] = useState([]);
    const [feedback, setFeedback] = useState(null);
    const [particleTarget, setParticleTarget] = useState(null);
    const [particleOptions, setParticleOptions] = useState([]);
    const [particleTokens, setParticleTokens] = useState([]);
    // MC state
    const [mcOptions, setMcOptions] = useState([]);
    const [mcSelected, setMcSelected] = useState(null);

    const sentence = grammar.example?.[0]?.jp || '';

    const startScramble = useCallback(() => {
        const tokens = smartSegment(sentence);
        const shuffled = [...tokens].sort(() => Math.random() - 0.5);
        setBankWords(shuffled);
        setUserAnswer([]);
        setFeedback(null);
        setQuizType('scramble');
        setQuizState('playing');
    }, [sentence]);

    const startParticle = useCallback(() => {
        const tokens = smartSegment(sentence);
        const particles = tokens.filter(t => /^(は|が|を|に|で|へ|と|も|から|まで|ね|よ|か)$/.test(t));
        if (particles.length === 0) { startScramble(); return; }
        const target = particles[Math.floor(Math.random() * particles.length)];
        const commons = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も'];
        let opts = commons.filter(p => p !== target).sort(() => 0.5 - Math.random()).slice(0, 3);
        opts.push(target);
        opts.sort(() => 0.5 - Math.random());
        setParticleTarget(target);
        setParticleOptions(opts);
        setParticleTokens(tokens);
        setFeedback(null);
        setMcSelected(null);
        setQuizType('particle');
        setQuizState('playing');
    }, [sentence, startScramble]);

    const startMC = useCallback(() => {
        setFeedback(null);
        setMcSelected(null);
        const correct = grammar.meaning_id;
        // Generate fake options
        const fakes = [
            'Menyatakan tempat kegiatan',
            'Bentuk lampau dari kata kerja',
            'Menunjukkan kepemilikan',
            'Menyatakan keinginan',
            'Bentuk negatif sopan',
            'Menyatakan waktu',
        ].filter(f => f !== correct).sort(() => 0.5 - Math.random()).slice(0, 3);
        const opts = [...fakes, correct].sort(() => 0.5 - Math.random());
        setMcOptions(opts);
        setQuizType('mc');
        setQuizState('playing');
    }, [grammar.meaning_id]);

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

    useEffect(() => {
        if (quizType === 'scramble' && bankWords.length === 0 && userAnswer.length > 0) {
            const ans = userAnswer.join('').replace(/\s+|　/g, '');
            const tgt = sentence.replace(/\s+|　/g, '');
            const correct = ans === tgt;
            setFeedback(correct ? 'correct' : 'wrong');
            recordQuiz(grammar.grammar_id, correct);
            if (correct) {
                markAsLearned(grammar.grammar_id);
                triggerConfetti();
                speak('Seikai!');
                showToast('Seikai! Jawaban Benar! 🎉', 'success');
            } else {
                showToast('Coba lagi! 😅', 'error');
            }
        }
    }, [bankWords, userAnswer, quizType, sentence, grammar.grammar_id, recordQuiz, markAsLearned]);

    const handleParticleSelect = (opt) => {
        if (feedback) return;
        const correct = opt === particleTarget;
        setFeedback(correct ? 'correct' : 'wrong');
        setMcSelected(opt);
        recordQuiz(grammar.grammar_id, correct);
        if (correct) {
            markAsLearned(grammar.grammar_id);
            triggerConfetti();
            speak('Seikai!');
            showToast('Seikai! Jawaban Benar! 🎉', 'success');
        } else {
            showToast(`Jawaban yang benar: ${particleTarget}`, 'error');
        }
    };

    const handleMCSelect = (opt) => {
        if (feedback) return;
        const correct = opt === grammar.meaning_id;
        setFeedback(correct ? 'correct' : 'wrong');
        setMcSelected(opt);
        recordQuiz(grammar.grammar_id, correct);
        if (correct) {
            markAsLearned(grammar.grammar_id);
            triggerConfetti();
            showToast('Seikai! Jawaban Benar! 🎉', 'success');
        } else {
            showToast('Coba lagi!', 'error');
        }
    };

    if (quizState === 'idle') {
        return (
            <div className="animate-fade-in space-y-3">
                <div className="bg-surface rounded-xl border border-border p-5 text-center">
                    <GameController size={40} className="text-warning mx-auto mb-3" />
                    <h3 className="font-bold text-text-bright text-lg mb-1">Pilih Jenis Quiz</h3>
                    <p className="text-sm text-text-dim mb-4">Uji pemahamanmu tentang pola <span className="font-jp text-primary-light">{grammar.pattern}</span></p>
                    <div className="space-y-2">
                        <button onClick={startScramble} className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary-light rounded-xl font-medium text-sm transition-all">
                            🧩 Susun Kalimat (Scramble)
                        </button>
                        <button onClick={startParticle} className="w-full py-3 bg-warning/10 hover:bg-warning/20 text-warning rounded-xl font-medium text-sm transition-all">
                            🎯 Isi Partikel
                        </button>
                        <button onClick={startMC} className="w-full py-3 bg-accent/10 hover:bg-accent/20 text-accent rounded-xl font-medium text-sm transition-all">
                            📝 Pilihan Ganda (Arti)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-4">
            {/* Scramble Quiz */}
            {quizType === 'scramble' && (
                <div className="bg-surface rounded-xl border border-border p-5">
                    <div className="text-center mb-4">
                        <span className="text-xs text-text-dim">Terjemahkan</span>
                        <p className="text-base text-text-bright font-medium mt-1">"{grammar.example[0].id}"</p>
                    </div>

                    {/* Drop zone */}
                    <div className="min-h-[60px] border-2 border-dashed border-border rounded-xl p-3 flex flex-wrap gap-2 mb-4">
                        {userAnswer.length === 0 ? (
                            <span className="text-sm text-text-dim w-full text-center">Klik kata di bawah untuk menyusun kalimat...</span>
                        ) : (
                            userAnswer.map((w, i) => (
                                <button key={i} onClick={() => handleScrambleClick(w, false)} className="word-pill">{w}</button>
                            ))
                        )}
                    </div>

                    {/* Word bank */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        {bankWords.map((w, i) => (
                            <button key={i} onClick={() => handleScrambleClick(w, true)} className="word-pill">{w}</button>
                        ))}
                    </div>
                </div>
            )}

            {/* Particle Quiz */}
            {quizType === 'particle' && (
                <div className="bg-surface rounded-xl border border-border p-5">
                    <div className="text-center mb-4">
                        <span className="text-xs text-text-dim">Isi partikel yang hilang</span>
                        <p className="font-jp text-lg text-text-bright mt-2 leading-relaxed">
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
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {particleOptions.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => handleParticleSelect(opt)}
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

            {/* Multiple Choice Quiz */}
            {quizType === 'mc' && (
                <div className="bg-surface rounded-xl border border-border p-5">
                    <div className="text-center mb-4">
                        <span className="text-xs text-text-dim">Apa arti dari pola grammar ini?</span>
                        <p className="font-jp text-xl text-text-bright font-bold mt-2">{grammar.pattern}</p>
                    </div>
                    <div className="space-y-2">
                        {mcOptions.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => handleMCSelect(opt)}
                                disabled={!!feedback}
                                className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-all border ${feedback && opt === grammar.meaning_id ? 'bg-success/20 border-success/50 text-success' :
                                        feedback && mcSelected === opt && opt !== grammar.meaning_id ? 'bg-danger/20 border-danger/50 text-danger' :
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

            {/* Feedback */}
            {feedback && (
                <div className={`text-center p-4 rounded-xl font-medium text-sm animate-slide-up ${feedback === 'correct' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                    }`}>
                    {feedback === 'correct' ? '🎉 Seikai! Jawaban Benar!' : '❌ Coba lagi!'}
                </div>
            )}

            {/* Retry / Back */}
            <div className="flex gap-2">
                <button
                    onClick={() => setQuizState('idle')}
                    className="flex-1 py-2.5 rounded-xl bg-surface-light hover:bg-surface-lighter text-text-dim text-sm font-medium transition-all"
                >
                    ← Kembali
                </button>
                {feedback && (
                    <button
                        onClick={() => {
                            setFeedback(null);
                            setMcSelected(null);
                            if (quizType === 'scramble') startScramble();
                            else if (quizType === 'particle') startParticle();
                            else startMC();
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-all"
                    >
                        🔄 Coba Lagi
                    </button>
                )}
            </div>
        </div>
    );
}

function AIBuilderTab({ grammar }) {
    const [input, setInput] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/builder/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ words: [grammar.pattern], userSentence: input.trim() }),
            });
            if (!res.ok) throw new Error('Gagal menghubungi AI');
            const data = await res.json();
            setResult(data);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-4">
            <div className="bg-surface rounded-xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkle size={18} weight="fill" className="text-accent" />
                    <h3 className="font-bold text-text-bright text-sm">AI Sentence Builder</h3>
                </div>
                <div className="bg-surface-light rounded-lg p-3 mb-3 text-center">
                    <span className="text-xs text-text-dim">Pola Grammar</span>
                    <p className="font-jp text-lg font-bold text-primary-light mt-0.5">{grammar.pattern}</p>
                </div>
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Tulis kalimatmu dalam Bahasa Jepang..."
                    className="w-full bg-surface-light border border-border rounded-xl p-3 text-sm text-text font-jp focus:outline-none focus:border-primary/50 resize-none h-24 placeholder:text-text-dim"
                />
                <button
                    onClick={handleSubmit}
                    disabled={loading || !input.trim()}
                    className="w-full mt-2 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium text-sm transition-all hover:shadow-lg disabled:opacity-50"
                >
                    {loading ? '⏳ Sensei sedang memeriksa...' : '✨ Cek dengan AI'}
                </button>
            </div>

            {result && (
                <div className="bg-surface rounded-xl border border-border p-5 animate-slide-up">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`px-3 py-1 rounded-lg text-sm font-bold text-white ${result.score >= 8 ? 'bg-success' : result.score >= 5 ? 'bg-warning' : 'bg-danger'
                            }`}>
                            Skor: {result.score}/10
                        </div>
                        <span className="text-sm text-text-dim">Hasil Analisis</span>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <span className="text-xs text-text-dim block mb-1">Koreksi</span>
                            {result.is_correct ? (
                                <p className="text-success font-medium text-sm">✓ Sempurna!</p>
                            ) : (
                                <p className="text-danger text-sm font-jp">{result.correction}</p>
                            )}
                        </div>
                        <div>
                            <span className="text-xs text-text-dim block mb-1">Penjelasan</span>
                            <p className="text-sm text-text whitespace-pre-wrap">{result.explanation}</p>
                        </div>
                        {result.alternatives?.length > 0 && (
                            <div>
                                <span className="text-xs text-text-dim block mb-1">Alternatif</span>
                                <ul className="space-y-1">
                                    {result.alternatives.map((alt, i) => (
                                        <li key={i} className="text-sm text-text-dim font-jp bg-surface-light rounded-lg px-3 py-1.5">{alt}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
