import mongoose from 'mongoose';

const UserProgressSchema = new mongoose.Schema({
    visitorId: { type: String, required: true, unique: true, index: true },
    learnedItems: [{ type: String }],
    favorites: [{ type: String }],
    stats: {
        xp: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        lastStudyDate: { type: String, default: null },
        totalQuizzes: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
    },
    reviewData: [{
        grammarId: String,
        interval: { type: Number, default: 1 },
        easeFactor: { type: Number, default: 2.5 },
        nextReview: Date,
        lastReview: Date,
    }],
}, { timestamps: true });

export default mongoose.models.UserProgress || mongoose.model('UserProgress', UserProgressSchema);
