'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProgress } from '@/context/ProgressContext';
import { ArrowLeft, CheckCircle, Heart, CaretRight } from '@phosphor-icons/react';

const levelNames = { A1: 'Starter', A21: 'Elementary I', A22: 'Elementary II' };

export default function LevelPage() {
    const params = useParams();
    const level = params.level;
    const [grammar, setGrammar] = useState([]);
    const [loading, setLoading] = useState(true);
    const { progress } = useProgress();

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/grammar?level=${level}`);
                const data = await res.json();
                setGrammar(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [level]);

    // Group by lesson
    const grouped = {};
    grammar.forEach(item => {
        const k = item.lesson;
        if (!grouped[k]) grouped[k] = [];
        grouped[k].push(item);
    });
    const lessons = Object.keys(grouped).sort((a, b) => a - b);

    if (loading) {
        return (
            <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-3">
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20" />)}
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href="/browse" className="inline-flex items-center gap-1.5 text-text-dim hover:text-text text-sm mb-3 transition-colors">
                    <ArrowLeft size={16} /> Browse
                </Link>
                <h1 className="text-2xl font-bold text-text-bright">{level} — {levelNames[level] || level}</h1>
                <p className="text-text-dim text-sm mt-1">{grammar.length} pola grammar · {lessons.length} lesson</p>
            </div>

            <div className="space-y-3">
                {lessons.map((lesson, i) => {
                    const items = grouped[lesson];
                    const learnedCount = items.filter(g => progress.learnedItems.includes(g.grammar_id)).length;
                    const allLearned = learnedCount === items.length;

                    return (
                        <Link
                            key={lesson}
                            href={`/browse/${level}/${lesson}`}
                            className="block bg-surface rounded-xl border border-border p-4 hover:border-primary/30 transition-all animate-fade-in hover:-translate-y-0.5"
                            style={{ animationDelay: `${i * 0.05}s` }}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${allLearned
                                        ? 'bg-success/20 text-success'
                                        : 'bg-surface-light text-text-dim'
                                    }`}>
                                    {allLearned ? <CheckCircle size={20} weight="fill" /> : lesson}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-text-bright text-sm">Lesson {lesson}</h3>
                                    <p className="text-xs text-text-dim">{items.length} pola grammar · {learnedCount} dipelajari</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-surface-lighter rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all"
                                            style={{ width: `${items.length > 0 ? (learnedCount / items.length * 100) : 0}%` }}
                                        />
                                    </div>
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
