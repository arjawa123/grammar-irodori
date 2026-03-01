'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProgress } from '@/context/ProgressContext';
import { ArrowLeft, CheckCircle, Heart, SpeakerHigh, CaretRight } from '@phosphor-icons/react';

export default function LessonPage() {
    const params = useParams();
    const { level, lesson } = params;
    const [grammar, setGrammar] = useState([]);
    const [loading, setLoading] = useState(true);
    const { progress, toggleFavorite, isFavorite, isLearned } = useProgress();

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/grammar?level=${level}&lesson=${lesson}`);
                const data = await res.json();
                setGrammar(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [level, lesson]);

    if (loading) {
        return (
            <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24" />)}
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href={`/browse/${level}`} className="inline-flex items-center gap-1.5 text-text-dim hover:text-text text-sm mb-3 transition-colors">
                    <ArrowLeft size={16} /> {level}
                </Link>
                <h1 className="text-2xl font-bold text-text-bright">Lesson {lesson}</h1>
                <p className="text-text-dim text-sm mt-1">{grammar.length} pola grammar</p>
            </div>

            <div className="space-y-3">
                {grammar.map((item, i) => {
                    const learned = isLearned(item.grammar_id);
                    const fav = isFavorite(item.grammar_id);

                    return (
                        <Link
                            key={item.grammar_id}
                            href={`/grammar/${item.grammar_id}`}
                            className={`block bg-surface rounded-xl border p-4 transition-all animate-fade-in hover:-translate-y-0.5 ${learned ? 'border-success/20' : 'border-border hover:border-primary/30'
                                }`}
                            style={{ animationDelay: `${i * 0.04}s` }}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${learned ? 'bg-success/20' : 'bg-surface-light'
                                    }`}>
                                    {learned
                                        ? <CheckCircle size={18} weight="fill" className="text-success" />
                                        : <span className="text-xs text-text-dim font-medium">{i + 1}</span>
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-text-bright font-jp text-base">{item.pattern}</h3>
                                    <p className="text-sm text-text-dim mt-0.5">{item.meaning_id}</p>
                                    {item.example?.[0] && (
                                        <p className="text-xs text-text-dim mt-1 font-jp truncate">{item.example[0].jp}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {fav && <Heart size={14} weight="fill" className="text-danger" />}
                                    <CaretRight size={16} className="text-text-dim" />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
