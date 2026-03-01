'use client';

import Link from 'next/link';
import { useProgress } from '@/context/ProgressContext';
import { Books, ArrowLeft } from '@phosphor-icons/react';

const levels = [
    { id: 'A1', name: 'Starter', desc: 'Perkenalan diri, keluarga, kebiasaan, tempat, waktu', color: 'from-emerald-500 to-teal-600', lessons: '3-18' },
    { id: 'A21', name: 'Elementary I', desc: 'Pengalaman, rencana, arah, perbandingan', color: 'from-blue-500 to-indigo-600', lessons: '1-9' },
    { id: 'A22', name: 'Elementary II', desc: 'Opini, saran, kondisional, kegiatan kompleks', color: 'from-purple-500 to-pink-600', lessons: '10-18' },
];

export default function BrowsePage() {
    const { progress } = useProgress();

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href="/" className="inline-flex items-center gap-1.5 text-text-dim hover:text-text text-sm mb-3 transition-colors">
                    <ArrowLeft size={16} /> Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-text-bright">Browse Grammar</h1>
                <p className="text-text-dim text-sm mt-1">Pilih level untuk mulai menjelajahi tata bahasa</p>
            </div>

            <div className="space-y-4">
                {levels.map((lvl, i) => {
                    const learned = progress.learnedItems.filter(id => id.startsWith(lvl.id)).length;
                    const favorited = progress.favorites.filter(id => id.startsWith(lvl.id)).length;
                    return (
                        <Link
                            key={lvl.id}
                            href={`/browse/${lvl.id}`}
                            className="block bg-surface rounded-2xl border border-border p-5 lg:p-6 hover:border-primary/30 transition-all animate-slide-up hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/5"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${lvl.color} flex items-center justify-center flex-shrink-0`}>
                                    <Books size={28} weight="fill" className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md bg-gradient-to-r ${lvl.color} text-white`}>
                                            {lvl.id}
                                        </span>
                                        <h2 className="font-bold text-text-bright">{lvl.name}</h2>
                                    </div>
                                    <p className="text-sm text-text-dim">{lvl.desc}</p>
                                    <div className="flex items-center gap-4 mt-3 text-xs text-text-dim">
                                        <span>📖 Lesson {lvl.lessons}</span>
                                        <span>✅ {learned} dipelajari</span>
                                        {favorited > 0 && <span>❤️ {favorited} favorit</span>}
                                    </div>
                                    <div className="mt-2 h-1.5 bg-surface-lighter rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${lvl.color} rounded-full transition-all duration-700`}
                                            style={{ width: `${Math.min((learned / 20) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
