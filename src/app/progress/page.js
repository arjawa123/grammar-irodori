'use client';

import { useEffect, useState } from 'react';
import { useProgress } from '@/context/ProgressContext';
import { ChartBar, Trophy, Fire, Star, Lightning, Heart, Target, Clock, Books } from '@phosphor-icons/react';

export default function ProgressPage() {
    const { progress, loading } = useProgress();
    const [totalGrammar, setTotalGrammar] = useState(0);
    const [levelCounts, setLevelCounts] = useState({});

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/grammar');
                const data = await res.json();
                setTotalGrammar(data.length);

                const counts = {};
                data.forEach(g => {
                    counts[g.level] = (counts[g.level] || 0) + 1;
                });
                setLevelCounts(counts);
            } catch (err) {
                console.error(err);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-4">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24" />)}
            </div>
        );
    }

    const accuracy = progress.stats.totalQuizzes > 0
        ? Math.round((progress.stats.correctAnswers / progress.stats.totalQuizzes) * 100)
        : 0;

    const overallProgress = totalGrammar > 0
        ? Math.round((progress.learnedItems.length / totalGrammar) * 100)
        : 0;

    const levels = ['A1', 'A21', 'A22'];
    const levelColors = {
        A1: 'from-emerald-500 to-teal-600',
        A21: 'from-blue-500 to-indigo-600',
        A22: 'from-purple-500 to-pink-600',
    };

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-bright flex items-center gap-2">
                    <ChartBar size={24} weight="fill" className="text-primary-light" /> Statistik
                </h1>
                <p className="text-text-dim text-sm mt-1">Progress belajar dan pencapaianmu</p>
            </div>

            {/* Overall Progress */}
            <div className="bg-surface rounded-2xl border border-border p-6 mb-4">
                <h2 className="text-sm font-medium text-text-dim mb-3">Progress Keseluruhan</h2>
                <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-surface-lighter)" strokeWidth="8" />
                            <circle
                                cx="50" cy="50" r="42" fill="none"
                                stroke="url(#grad)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${overallProgress * 2.64} 264`}
                                className="transition-all duration-1000"
                            />
                            <defs>
                                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-text-bright">{overallProgress}%</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-text-bright">{progress.learnedItems.length} <span className="text-text-dim text-sm font-normal">/ {totalGrammar}</span></p>
                        <p className="text-sm text-text-dim">Grammar dipelajari</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {[
                    { icon: Fire, label: 'Streak', value: progress.stats.streak, unit: 'hari', color: 'text-warning', bg: 'bg-warning/10' },
                    { icon: Star, label: 'Total XP', value: progress.stats.xp, unit: 'XP', color: 'text-primary-light', bg: 'bg-primary/10' },
                    { icon: Target, label: 'Total Quiz', value: progress.stats.totalQuizzes, unit: '', color: 'text-accent', bg: 'bg-accent/10' },
                    { icon: Lightning, label: 'Akurasi Quiz', value: accuracy, unit: '%', color: 'text-success', bg: 'bg-success/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-surface rounded-xl border border-border p-4 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-2`}>
                            <stat.icon size={18} weight="fill" className={stat.color} />
                        </div>
                        <p className="text-xl font-bold text-text-bright">{stat.value}<span className="text-xs text-text-dim font-normal ml-1">{stat.unit}</span></p>
                        <p className="text-xs text-text-dim">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* More stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Heart size={16} weight="fill" className="text-danger" />
                        <span className="text-xs text-text-dim">Favorit</span>
                    </div>
                    <p className="text-xl font-bold text-text-bright">{progress.favorites.length}</p>
                </div>
                <div className="bg-surface rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock size={16} className="text-text-dim" />
                        <span className="text-xs text-text-dim">Terakhir Belajar</span>
                    </div>
                    <p className="text-sm font-bold text-text-bright">{progress.stats.lastStudyDate || '-'}</p>
                </div>
            </div>

            {/* Per-Level Progress */}
            <div className="bg-surface rounded-2xl border border-border p-5">
                <h2 className="text-sm font-medium text-text-dim mb-4">Progress per Level</h2>
                <div className="space-y-4">
                    {levels.map(lvl => {
                        const total = levelCounts[lvl] || 0;
                        const learned = progress.learnedItems.filter(id => id.startsWith(lvl)).length;
                        const pct = total > 0 ? Math.round((learned / total) * 100) : 0;

                        return (
                            <div key={lvl}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded bg-gradient-to-r ${levelColors[lvl]} text-white`}>{lvl}</span>
                                        <span className="text-sm text-text-dim">{learned} / {total}</span>
                                    </div>
                                    <span className="text-sm font-bold text-text-bright">{pct}%</span>
                                </div>
                                <div className="h-2.5 bg-surface-lighter rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${levelColors[lvl]} rounded-full transition-all duration-1000`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Achievements */}
            <div className="bg-surface rounded-2xl border border-border p-5 mt-4">
                <h2 className="text-sm font-medium text-text-dim mb-3">Pencapaian</h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { title: 'Pemula', desc: 'Pelajari 1 grammar', achieved: progress.learnedItems.length >= 1, emoji: '🌱' },
                        { title: 'Penjelajah', desc: 'Pelajari 10 grammar', achieved: progress.learnedItems.length >= 10, emoji: '🏃' },
                        { title: 'Tekun', desc: 'Pelajari 25 grammar', achieved: progress.learnedItems.length >= 25, emoji: '📚' },
                        { title: 'Master', desc: 'Pelajari 50 grammar', achieved: progress.learnedItems.length >= 50, emoji: '🏆' },
                        { title: 'Quiz Pro', desc: 'Selesaikan 20 quiz', achieved: progress.stats.totalQuizzes >= 20, emoji: '🎮' },
                        { title: 'Streak 7', desc: '7 hari berturut-turut', achieved: progress.stats.streak >= 7, emoji: '🔥' },
                    ].map((badge, i) => (
                        <div
                            key={i}
                            className={`rounded-xl border p-3 text-center transition-all ${badge.achieved
                                    ? 'bg-primary/5 border-primary/20'
                                    : 'bg-surface-light border-border opacity-50'
                                }`}
                        >
                            <span className="text-2xl block mb-1">{badge.emoji}</span>
                            <p className="text-xs font-bold text-text-bright">{badge.title}</p>
                            <p className="text-[10px] text-text-dim">{badge.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
