'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ProgressContext = createContext(null);

function generateVisitorId() {
    if (typeof window === 'undefined') return 'ssr';
    let id = localStorage.getItem('bunpou_visitor_id');
    if (!id) {
        id = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('bunpou_visitor_id', id);
    }
    return id;
}

export function ProgressProvider({ children }) {
    const [progress, setProgress] = useState({
        learnedItems: [],
        favorites: [],
        stats: { xp: 0, streak: 0, lastStudyDate: null, totalQuizzes: 0, correctAnswers: 0 },
        reviewData: [],
    });
    const [loading, setLoading] = useState(true);
    const [visitorId, setVisitorId] = useState('ssr');

    useEffect(() => {
        const id = generateVisitorId();
        setVisitorId(id);
        fetchProgress(id);
    }, []);

    const fetchProgress = async (id) => {
        try {
            const res = await fetch('/api/progress', {
                headers: { 'x-visitor-id': id },
            });
            const data = await res.json();
            setProgress({
                learnedItems: data.learnedItems || [],
                favorites: data.favorites || [],
                stats: data.stats || { xp: 0, streak: 0, lastStudyDate: null, totalQuizzes: 0, correctAnswers: 0 },
                reviewData: data.reviewData || [],
            });
        } catch (err) {
            console.error('Failed to fetch progress:', err);
        } finally {
            setLoading(false);
        }
    };

    const saveProgress = useCallback(async (newProgress) => {
        setProgress(newProgress);
        try {
            await fetch('/api/progress', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-visitor-id': visitorId,
                },
                body: JSON.stringify(newProgress),
            });
        } catch (err) {
            console.error('Failed to save progress:', err);
        }
    }, [visitorId]);

    const toggleFavorite = useCallback((grammarId) => {
        setProgress(prev => {
            const isFav = prev.favorites.includes(grammarId);
            const newProgress = {
                ...prev,
                favorites: isFav
                    ? prev.favorites.filter(id => id !== grammarId)
                    : [...prev.favorites, grammarId],
            };
            saveProgress(newProgress);
            return newProgress;
        });
    }, [saveProgress]);

    const markAsLearned = useCallback((grammarId) => {
        setProgress(prev => {
            if (prev.learnedItems.includes(grammarId)) return prev;
            const today = new Date().toISOString().split('T')[0];
            const isNewDay = prev.stats.lastStudyDate !== today;
            const newProgress = {
                ...prev,
                learnedItems: [...prev.learnedItems, grammarId],
                stats: {
                    ...prev.stats,
                    xp: prev.stats.xp + 20,
                    streak: isNewDay ? prev.stats.streak + 1 : prev.stats.streak,
                    lastStudyDate: today,
                },
            };
            saveProgress(newProgress);
            return newProgress;
        });
    }, [saveProgress]);

    const recordQuiz = useCallback((grammarId, isCorrect) => {
        setProgress(prev => {
            const today = new Date().toISOString().split('T')[0];
            const isNewDay = prev.stats.lastStudyDate !== today;
            const newProgress = {
                ...prev,
                stats: {
                    ...prev.stats,
                    xp: prev.stats.xp + (isCorrect ? 15 : 2),
                    streak: isNewDay ? prev.stats.streak + 1 : prev.stats.streak,
                    lastStudyDate: today,
                    totalQuizzes: prev.stats.totalQuizzes + 1,
                    correctAnswers: prev.stats.correctAnswers + (isCorrect ? 1 : 0),
                },
            };

            // Update review data (simple SRS)
            const existingIdx = newProgress.reviewData.findIndex(r => r.grammarId === grammarId);
            const now = new Date();
            if (existingIdx >= 0) {
                const item = { ...newProgress.reviewData[existingIdx] };
                if (isCorrect) {
                    item.interval = Math.min(item.interval * item.easeFactor, 30);
                    item.easeFactor = Math.min(item.easeFactor + 0.1, 3.0);
                } else {
                    item.interval = 1;
                    item.easeFactor = Math.max(item.easeFactor - 0.2, 1.3);
                }
                item.lastReview = now;
                item.nextReview = new Date(now.getTime() + item.interval * 24 * 60 * 60 * 1000);
                newProgress.reviewData = [...newProgress.reviewData];
                newProgress.reviewData[existingIdx] = item;
            } else {
                newProgress.reviewData = [...newProgress.reviewData, {
                    grammarId,
                    interval: isCorrect ? 1 : 0.5,
                    easeFactor: 2.5,
                    lastReview: now,
                    nextReview: new Date(now.getTime() + (isCorrect ? 1 : 0.5) * 24 * 60 * 60 * 1000),
                }];
            }

            saveProgress(newProgress);
            return newProgress;
        });
    }, [saveProgress]);

    const unmarkLearned = useCallback((grammarId) => {
        setProgress(prev => {
            const newProgress = {
                ...prev,
                learnedItems: prev.learnedItems.filter(id => id !== grammarId),
            };
            saveProgress(newProgress);
            return newProgress;
        });
    }, [saveProgress]);

    return (
        <ProgressContext.Provider value={{
            progress,
            loading,
            toggleFavorite,
            markAsLearned,
            unmarkLearned,
            recordQuiz,
            isFavorite: (id) => progress.favorites.includes(id),
            isLearned: (id) => progress.learnedItems.includes(id),
        }}>
            {children}
        </ProgressContext.Provider>
    );
}

export function useProgress() {
    const context = useContext(ProgressContext);
    if (!context) throw new Error('useProgress must be used within ProgressProvider');
    return context;
}
