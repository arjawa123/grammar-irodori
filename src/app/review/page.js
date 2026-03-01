'use client';

import { useEffect, useState } from 'react';
import { useProgress } from '@/context/ProgressContext';
import { showToast } from '@/components/Toast';
import { ArrowsClockwise, Eye, EyeSlash, Brain, CheckCircle, XCircle, SpeakerHigh } from '@phosphor-icons/react';
import Link from 'next/link';

function speak(text) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ja-JP';
        window.speechSynthesis.speak(u);
    }
}

export default function ReviewPage() {
    const { progress, recordQuiz } = useProgress();
    const [grammarList, setGrammarList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewQueue, setReviewQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [mode, setMode] = useState('setup'); // setup | reviewing | done
    const [reviewDirection, setReviewDirection] = useState('pattern-to-meaning');
    const [stats, setStats] = useState({ remembered: 0, forgot: 0 });

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/grammar');
                const data = await res.json();
                setGrammarList(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const startReview = (type) => {
        setReviewDirection(type);
        // Filter grammar that has been learned
        let pool = grammarList.filter(g => progress.learnedItems.includes(g.grammar_id));

        // Sort by SRS priority
        const now = new Date();
        pool.sort((a, b) => {
            const rdA = progress.reviewData.find(r => r.grammarId === a.grammar_id);
            const rdB = progress.reviewData.find(r => r.grammarId === b.grammar_id);
            const priorityA = rdA && rdA.nextReview ? new Date(rdA.nextReview) - now : -Infinity;
            const priorityB = rdB && rdB.nextReview ? new Date(rdB.nextReview) - now : -Infinity;
            return priorityA - priorityB;
        });

        // Take max 15 for review
        pool = pool.slice(0, 15);

        if (pool.length === 0) {
            showToast('Belum ada grammar yang dipelajari untuk di-review', 'info');
            return;
        }

        setReviewQueue(pool);
        setCurrentIndex(0);
        setShowAnswer(false);
        setStats({ remembered: 0, forgot: 0 });
        setMode('reviewing');
    };

    const handleResponse = (remembered) => {
        const current = reviewQueue[currentIndex];
        recordQuiz(current.grammar_id, remembered);

        setStats(prev => ({
            remembered: prev.remembered + (remembered ? 1 : 0),
            forgot: prev.forgot + (remembered ? 0 : 1),
        }));

        if (currentIndex + 1 >= reviewQueue.length) {
            setMode('done');
        } else {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24" />)}
            </div>
        );
    }

    // Setup
    if (mode === 'setup') {
        const learnedCount = grammarList.filter(g => progress.learnedItems.includes(g.grammar_id)).length;
        const dueCount = progress.reviewData.filter(r => {
            return r.nextReview && new Date(r.nextReview) <= new Date();
        }).length;

        return (
            <div className="p-4 lg:p-8 max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-text-bright mb-2">Review Flashcard</h1>
                <p className="text-text-dim text-sm mb-6">Review grammar yang sudah dipelajari dengan metode Spaced Repetition</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-surface rounded-xl border border-border p-4 text-center">
                        <p className="text-2xl font-bold text-primary-light">{learnedCount}</p>
                        <p className="text-xs text-text-dim">Dipelajari</p>
                    </div>
                    <div className="bg-surface rounded-xl border border-border p-4 text-center">
                        <p className="text-2xl font-bold text-warning">{dueCount}</p>
                        <p className="text-xs text-text-dim">Perlu Review</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => startReview('pattern-to-meaning')}
                        className="w-full bg-surface rounded-xl border border-border p-4 text-left hover:border-primary/30 transition-all"
                    >
                        <h3 className="font-bold text-text-bright">🇯🇵 → 🇮🇩 Pola → Arti</h3>
                        <p className="text-xs text-text-dim mt-0.5">Lihat pola grammar, tebak artinya</p>
                    </button>
                    <button
                        onClick={() => startReview('meaning-to-pattern')}
                        className="w-full bg-surface rounded-xl border border-border p-4 text-left hover:border-accent/30 transition-all"
                    >
                        <h3 className="font-bold text-text-bright">🇮🇩 → 🇯🇵 Arti → Pola</h3>
                        <p className="text-xs text-text-dim mt-0.5">Lihat arti, tebak pola grammarnya</p>
                    </button>
                </div>

                {learnedCount === 0 && (
                    <div className="mt-6 text-center text-text-dim text-sm">
                        <p>Belum ada grammar yang dipelajari.</p>
                        <Link href="/browse" className="text-primary-light hover:underline mt-1 inline-block">
                            Mulai belajar →
                        </Link>
                    </div>
                )}
            </div>
        );
    }

    // Done
    if (mode === 'done') {
        const total = stats.remembered + stats.forgot;
        const pct = total > 0 ? Math.round((stats.remembered / total) * 100) : 0;
        return (
            <div className="p-4 lg:p-8 max-w-2xl mx-auto text-center">
                <div className="bg-surface rounded-2xl border border-border p-8 animate-slide-up">
                    <Brain size={64} weight="fill" className="mx-auto mb-4 text-accent" />
                    <h2 className="text-2xl font-bold text-text-bright mb-2">Review Selesai!</h2>
                    <div className="flex justify-center gap-6 my-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-success">{stats.remembered}</p>
                            <p className="text-xs text-text-dim">Ingat</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-danger">{stats.forgot}</p>
                            <p className="text-xs text-text-dim">Lupa</p>
                        </div>
                    </div>
                    <p className="text-text-dim text-sm mb-6">Retensi: {pct}%</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => setMode('setup')} className="px-5 py-2.5 bg-surface-light hover:bg-surface-lighter rounded-xl text-sm font-medium text-text transition-all">
                            Review Lagi
                        </button>
                        <Link href="/" className="px-5 py-2.5 bg-primary hover:bg-primary-dark rounded-xl text-sm font-medium text-white transition-all">
                            Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Reviewing
    const current = reviewQueue[currentIndex];
    if (!current) return null;

    const front = reviewDirection === 'pattern-to-meaning' ? current.pattern : current.meaning_id;
    const back = reviewDirection === 'pattern-to-meaning' ? current.meaning_id : current.pattern;
    const isFrontJp = reviewDirection === 'pattern-to-meaning';

    return (
        <div className="p-4 lg:p-8 max-w-2xl mx-auto">
            {/* Progress */}
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setMode('setup')} className="text-text-dim hover:text-text">
                    <ArrowsClockwise size={20} />
                </button>
                <div className="flex-1 h-2 bg-surface-lighter rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${((currentIndex + 1) / reviewQueue.length) * 100}%` }} />
                </div>
                <span className="text-xs text-text-dim">{currentIndex + 1}/{reviewQueue.length}</span>
            </div>

            {/* Flashcard */}
            <div
                onClick={() => !showAnswer && setShowAnswer(true)}
                className={`bg-surface rounded-2xl border border-border p-8 text-center min-h-[250px] flex flex-col items-center justify-center cursor-pointer transition-all ${!showAnswer ? 'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5' : ''
                    }`}
            >
                <span className="text-xs text-text-dim mb-2">
                    {isFrontJp ? 'Pola Grammar' : 'Arti'}
                </span>
                <p className={`text-2xl font-bold text-text-bright ${isFrontJp ? 'font-jp' : ''}`}>{front}</p>
                {isFrontJp && (
                    <button
                        onClick={(e) => { e.stopPropagation(); speak(front); }}
                        className="mt-2 text-text-dim hover:text-text"
                    >
                        <SpeakerHigh size={20} />
                    </button>
                )}

                {showAnswer ? (
                    <div className="mt-6 pt-6 border-t border-border w-full animate-fade-in">
                        <span className="text-xs text-text-dim mb-1 block">{isFrontJp ? 'Arti' : 'Pola'}</span>
                        <p className={`text-xl font-bold text-primary-light ${!isFrontJp ? 'font-jp' : ''}`}>{back}</p>
                        {current.usage && <p className="text-sm text-text-dim mt-2">{current.usage}</p>}
                        {current.example?.[0] && (
                            <p className="text-sm text-text-dim mt-1 font-jp">{current.example[0].jp}</p>
                        )}
                    </div>
                ) : (
                    <p className="text-text-dim text-sm mt-4">Tap untuk melihat jawaban</p>
                )}
            </div>

            {/* Response buttons */}
            {showAnswer && (
                <div className="flex gap-3 mt-4 animate-slide-up">
                    <button
                        onClick={() => handleResponse(false)}
                        className="flex-1 bg-danger/10 hover:bg-danger/20 text-danger py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
                    >
                        <XCircle size={18} weight="fill" /> Lupa
                    </button>
                    <button
                        onClick={() => handleResponse(true)}
                        className="flex-1 bg-success/10 hover:bg-success/20 text-success py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={18} weight="fill" /> Ingat
                    </button>
                </div>
            )}
        </div>
    );
}
