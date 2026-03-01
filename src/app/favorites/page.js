'use client';

import { useEffect, useState } from 'react';
import { useProgress } from '@/context/ProgressContext';
import Link from 'next/link';
import { Heart, Trash, ArrowLeft, GameController, SpeakerHigh } from '@phosphor-icons/react';
import { showToast } from '@/components/Toast';

function speak(text) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ja-JP';
        window.speechSynthesis.speak(u);
    }
}

export default function FavoritesPage() {
    const { progress, toggleFavorite, isLearned } = useProgress();
    const [grammar, setGrammar] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/grammar');
                const data = await res.json();
                setGrammar(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const favorited = grammar.filter(g => progress.favorites.includes(g.grammar_id));

    // Group by level
    const grouped = {};
    favorited.forEach(item => {
        if (!grouped[item.level]) grouped[item.level] = [];
        grouped[item.level].push(item);
    });

    if (loading) {
        return (
            <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20" />)}
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-bright flex items-center gap-2">
                    <Heart size={24} weight="fill" className="text-danger" /> Favorit
                </h1>
                <p className="text-text-dim text-sm mt-1">{favorited.length} grammar disimpan</p>
            </div>

            {favorited.length === 0 ? (
                <div className="bg-surface rounded-2xl border border-border p-8 text-center">
                    <Heart size={48} className="text-text-dim mx-auto mb-3" />
                    <h3 className="font-bold text-text-bright mb-1">Belum ada favorit</h3>
                    <p className="text-sm text-text-dim mb-4">Tambahkan grammar ke favorit saat belajar untuk menyimpannya di sini</p>
                    <Link href="/browse" className="inline-flex items-center gap-1.5 text-primary-light hover:underline text-sm">
                        Mulai belajar →
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.keys(grouped).sort().map(level => (
                        <div key={level}>
                            <h2 className="text-sm font-bold text-text-dim mb-2 uppercase tracking-wide">{level}</h2>
                            <div className="space-y-2">
                                {grouped[level].map((item, i) => {
                                    const learned = isLearned(item.grammar_id);
                                    return (
                                        <div
                                            key={item.grammar_id}
                                            className="bg-surface rounded-xl border border-border p-4 flex items-start gap-3 animate-fade-in"
                                            style={{ animationDelay: `${i * 0.04}s` }}
                                        >
                                            <Link href={`/grammar/${item.grammar_id}`} className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className="font-bold text-text-bright font-jp">{item.pattern}</h3>
                                                    {learned && <span className="text-xs text-success">✅</span>}
                                                </div>
                                                <p className="text-sm text-text-dim">{item.meaning_id}</p>
                                                <p className="text-xs text-text-dim mt-0.5">L{item.lesson}</p>
                                            </Link>
                                            <div className="flex gap-1.5 flex-shrink-0">
                                                <button
                                                    onClick={() => speak(item.pattern)}
                                                    className="w-8 h-8 rounded-lg bg-surface-light hover:bg-surface-lighter flex items-center justify-center transition-all"
                                                >
                                                    <SpeakerHigh size={14} className="text-text-dim" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        toggleFavorite(item.grammar_id);
                                                        showToast('Dihapus dari favorit', 'info');
                                                    }}
                                                    className="w-8 h-8 rounded-lg bg-danger/10 hover:bg-danger/20 flex items-center justify-center transition-all"
                                                >
                                                    <Trash size={14} className="text-danger" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
