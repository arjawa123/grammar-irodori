'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useProgress } from '@/context/ProgressContext';
import { MagnifyingGlass, X, CheckCircle, Heart, SpeakerHigh } from '@phosphor-icons/react';

function speak(text) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ja-JP';
        window.speechSynthesis.speak(u);
    }
}

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [filterLevel, setFilterLevel] = useState('');
    const { isLearned, isFavorite } = useProgress();

    const doSearch = useCallback(async (q) => {
        if (!q.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }
        setLoading(true);
        setHasSearched(true);
        try {
            const res = await fetch(`/api/grammar?search=${encodeURIComponent(q.trim())}`);
            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            doSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, doSearch]);

    const filtered = filterLevel
        ? results.filter(g => g.level === filterLevel)
        : results;

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-bright mb-4">Cari Grammar</h1>

                {/* Search Input */}
                <div className="relative">
                    <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Cari pola, arti, contoh kalimat..."
                        className="w-full bg-surface border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-text focus:outline-none focus:border-primary/50 placeholder:text-text-dim"
                        autoFocus
                    />
                    {query && (
                        <button
                            onClick={() => { setQuery(''); setResults([]); setHasSearched(false); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Filter */}
                {results.length > 0 && (
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => setFilterLevel('')}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${!filterLevel ? 'bg-primary text-white' : 'bg-surface-light text-text-dim hover:text-text'
                                }`}
                        >
                            Semua ({results.length})
                        </button>
                        {['A1', 'A21', 'A22'].map(lvl => {
                            const count = results.filter(g => g.level === lvl).length;
                            if (count === 0) return null;
                            return (
                                <button
                                    key={lvl}
                                    onClick={() => setFilterLevel(filterLevel === lvl ? '' : lvl)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filterLevel === lvl ? 'bg-primary text-white' : 'bg-surface-light text-text-dim hover:text-text'
                                        }`}
                                >
                                    {lvl} ({count})
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Results */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20" />)}
                </div>
            ) : hasSearched && filtered.length === 0 ? (
                <div className="bg-surface rounded-xl border border-border p-8 text-center">
                    <MagnifyingGlass size={40} className="text-text-dim mx-auto mb-3" />
                    <h3 className="font-bold text-text-bright mb-1">Tidak ditemukan</h3>
                    <p className="text-sm text-text-dim">Coba kata kunci lain</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((item, i) => {
                        const learned = isLearned(item.grammar_id);
                        const fav = isFavorite(item.grammar_id);

                        return (
                            <Link
                                key={item.grammar_id}
                                href={`/grammar/${item.grammar_id}`}
                                className="block bg-surface rounded-xl border border-border p-4 hover:border-primary/30 transition-all animate-fade-in"
                                style={{ animationDelay: `${i * 0.03}s` }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-light text-text-dim">{item.level} · L{item.lesson}</span>
                                            {learned && <CheckCircle size={14} weight="fill" className="text-success" />}
                                            {fav && <Heart size={14} weight="fill" className="text-danger" />}
                                        </div>
                                        <h3 className="font-bold text-text-bright font-jp text-base mt-1">{item.pattern}</h3>
                                        <p className="text-sm text-text-dim">{item.meaning_id}</p>
                                        {item.usage && (
                                            <p className="text-xs text-text-dim mt-0.5 line-clamp-1">{item.usage}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); speak(item.pattern); }}
                                        className="w-8 h-8 rounded-lg bg-surface-light hover:bg-surface-lighter flex items-center justify-center flex-shrink-0"
                                    >
                                        <SpeakerHigh size={14} className="text-text-dim" />
                                    </button>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Empty state */}
            {!hasSearched && !loading && (
                <div className="bg-surface rounded-xl border border-border p-8 text-center">
                    <MagnifyingGlass size={48} className="text-text-dim/30 mx-auto mb-3" />
                    <p className="text-text-dim text-sm">Ketik untuk mencari grammar berdasarkan pola, arti, atau contoh kalimat</p>
                </div>
            )}
        </div>
    );
}
