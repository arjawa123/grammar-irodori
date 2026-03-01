'use client';

import Link from 'next/link';
import { useProgress } from '@/context/ProgressContext';
import { Books, Fire, Star, Heart, Trophy, Lightning, ArrowRight } from '@phosphor-icons/react';

const levels = [
  { id: 'A1', name: 'Starter', desc: 'Perkenalan, keluarga, kebiasaan sehari-hari', color: 'from-emerald-500 to-teal-600' },
  { id: 'A21', name: 'Elementary I', desc: 'Pengalaman, rencana, perbandingan', color: 'from-blue-500 to-indigo-600' },
  { id: 'A22', name: 'Elementary II', desc: 'Opini, kondisional, kegiatan kompleks', color: 'from-purple-500 to-pink-600' },
];

export default function DashboardPage() {
  const { progress, loading } = useProgress();

  if (loading) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="skeleton h-40 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24" />)}
        </div>
      </div>
    );
  }

  const accuracy = progress.stats.totalQuizzes > 0
    ? Math.round((progress.stats.correctAnswers / progress.stats.totalQuizzes) * 100)
    : 0;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-surface to-accent/10 border border-border p-6 lg:p-10">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-light rounded-full px-3 py-1 text-xs font-medium mb-4">
            <span className="font-jp">日本語</span> Grammar Irodori
          </div>
          <h1 className="text-2xl lg:text-4xl font-bold text-text-bright mb-2">
            Selamat Datang di <span className="bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">Bunpou Master</span>
          </h1>
          <p className="text-text-dim text-sm lg:text-base max-w-lg">
            Pelajari tata bahasa Jepang dari buku Irodori dengan quiz interaktif, review SRS, dan validasi AI.
          </p>
          <Link href="/browse" className="mt-4 inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-95">
            Mulai Belajar <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Trophy, label: 'Dipelajari', value: progress.learnedItems.length, color: 'text-success', bg: 'bg-success/10' },
          { icon: Fire, label: 'Streak', value: progress.stats.streak, color: 'text-warning', bg: 'bg-warning/10' },
          { icon: Star, label: 'XP', value: progress.stats.xp, color: 'text-primary-light', bg: 'bg-primary/10' },
          { icon: Lightning, label: 'Akurasi', value: `${accuracy}%`, color: 'text-accent', bg: 'bg-accent/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface rounded-xl border border-border p-4 hover:border-border/80 transition-all animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-2`}>
              <stat.icon size={18} weight="fill" className={stat.color} />
            </div>
            <p className="text-lg lg:text-2xl font-bold text-text-bright">{stat.value}</p>
            <p className="text-xs text-text-dim">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Level Cards */}
      <div>
        <h2 className="text-lg font-bold text-text-bright mb-3">Pilih Level</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {levels.map((lvl, i) => {
            const learnedInLevel = progress.learnedItems.filter(id => id.startsWith(lvl.id)).length;
            return (
              <Link
                key={lvl.id}
                href={`/browse/${lvl.id}`}
                className="group bg-surface rounded-xl border border-border p-5 hover:border-primary/30 transition-all animate-fade-in hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${lvl.color} flex items-center justify-center mb-3`}>
                  <Books size={24} weight="fill" className="text-white" />
                </div>
                <h3 className="font-bold text-text-bright text-base">{lvl.id} — {lvl.name}</h3>
                <p className="text-xs text-text-dim mt-1 line-clamp-1">{lvl.desc}</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-surface-lighter rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${lvl.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min((learnedInLevel / 20) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-dim font-medium">{learnedInLevel}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Link href="/quiz" className="bg-surface rounded-xl border border-border p-4 hover:border-warning/30 transition-all group">
          <span className="text-2xl mb-2 block">🎮</span>
          <h3 className="font-semibold text-text-bright text-sm">Quiz Mode</h3>
          <p className="text-xs text-text-dim mt-0.5">Uji pengetahuanmu</p>
        </Link>
        <Link href="/review" className="bg-surface rounded-xl border border-border p-4 hover:border-accent/30 transition-all group">
          <span className="text-2xl mb-2 block">🔄</span>
          <h3 className="font-semibold text-text-bright text-sm">Review</h3>
          <p className="text-xs text-text-dim mt-0.5">Flashcard SRS</p>
        </Link>
        <Link href="/search" className="bg-surface rounded-xl border border-border p-4 hover:border-success/30 transition-all group col-span-2 lg:col-span-1">
          <span className="text-2xl mb-2 block">🔍</span>
          <h3 className="font-semibold text-text-bright text-sm">Cari Grammar</h3>
          <p className="text-xs text-text-dim mt-0.5">Temukan pola grammar</p>
        </Link>
      </div>
    </div>
  );
}
