import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserProgress from '@/models/UserProgress';

function getVisitorId(request) {
    const id = request.headers.get('x-visitor-id') || 'default-user';
    return id;
}

export async function GET(request) {
    try {
        await dbConnect();
        const visitorId = getVisitorId(request);

        let progress = await UserProgress.findOne({ visitorId }).lean();
        if (!progress) {
            progress = {
                visitorId,
                learnedItems: [],
                favorites: [],
                stats: { xp: 0, streak: 0, lastStudyDate: null, totalQuizzes: 0, correctAnswers: 0 },
                reviewData: [],
            };
        }

        return NextResponse.json(progress);
    } catch (error) {
        console.error('Progress GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        await dbConnect();
        const visitorId = getVisitorId(request);
        const body = await request.json();

        const progress = await UserProgress.findOneAndUpdate(
            { visitorId },
            { $set: body },
            { new: true, upsert: true }
        ).lean();

        return NextResponse.json(progress);
    } catch (error) {
        console.error('Progress PUT Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
