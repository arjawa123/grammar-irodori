'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Books, Heart, MagnifyingGlass, ChartBar, GameController, ArrowsClockwise } from '@phosphor-icons/react';
import { useProgress } from '@/context/ProgressContext';

const navItems = [
    { href: '/', label: 'Dashboard', icon: House },
    { href: '/browse', label: 'Browse', icon: Books },
    { href: '/quiz', label: 'Quiz', icon: GameController },
    { href: '/review', label: 'Review', icon: ArrowsClockwise },
    { href: '/favorites', label: 'Favorit', icon: Heart },
    { href: '/search', label: 'Cari', icon: MagnifyingGlass },
    { href: '/progress', label: 'Statistik', icon: ChartBar },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { progress } = useProgress();

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-border flex-col z-40">
                {/* Logo */}
                <div className="p-5 border-b border-border">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg font-jp">
                            言
                        </div>
                        <div>
                            <h1 className="text-text-bright font-bold text-lg leading-tight">Bunpou Master</h1>
                            <p className="text-text-dim text-xs">AI Grammar</p>
                        </div>
                    </Link>
                </div>

                {/* Stats mini */}
                <div className="px-4 py-3 flex gap-2">
                    <div className="flex-1 bg-surface-light rounded-lg p-2.5 text-center">
                        <p className="text-xs text-text-dim">Streak</p>
                        <p className="text-lg font-bold text-warning">{progress.stats.streak}</p>
                    </div>
                    <div className="flex-1 bg-surface-light rounded-lg p-2.5 text-center">
                        <p className="text-xs text-text-dim">XP</p>
                        <p className="text-lg font-bold text-primary-light">{progress.stats.xp}</p>
                    </div>
                </div>

                {/* Nav items */}
                <nav className="flex-1 px-3 py-2 space-y-1">
                    {navItems.map(item => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-primary/15 text-primary-light'
                                        : 'text-text-dim hover:text-text hover:bg-surface-light'
                                    }`}
                            >
                                <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                                {item.label}
                                {item.href === '/favorites' && progress.favorites.length > 0 && (
                                    <span className="ml-auto text-xs bg-danger/20 text-danger rounded-full px-2 py-0.5">
                                        {progress.favorites.length}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Progress mini */}
                <div className="p-4 border-t border-border">
                    <div className="text-xs text-text-dim mb-1">Grammar Dipelajari</div>
                    <div className="text-xl font-bold text-success">{progress.learnedItems.length}</div>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-border z-50 safe-area-bottom">
                <div className="flex items-center justify-around px-1 py-1">
                    {navItems.slice(0, 5).map(item => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl text-[10px] font-medium transition-all ${isActive ? 'text-primary-light' : 'text-text-dim'
                                    }`}
                            >
                                <Icon size={22} weight={isActive ? 'fill' : 'regular'} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
