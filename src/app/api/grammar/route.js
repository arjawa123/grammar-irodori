import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Grammar from '@/models/Grammar';

export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const level = searchParams.get('level');
        const lesson = searchParams.get('lesson');
        const search = searchParams.get('search');
        const id = searchParams.get('id');

        // Get single grammar by ID
        if (id) {
            const grammar = await Grammar.findOne({ grammar_id: id }).lean();
            if (!grammar) {
                return NextResponse.json({ error: 'Grammar not found' }, { status: 404 });
            }
            return NextResponse.json(grammar);
        }

        // Search grammar
        if (search) {
            const regex = new RegExp(search, 'i');
            const results = await Grammar.find({
                $or: [
                    { pattern: regex },
                    { meaning_id: regex },
                    { usage: regex },
                    { notes: regex },
                    { 'example.jp': regex },
                    { 'example.id': regex },
                ]
            }).sort({ level: 1, lesson: 1 }).lean();
            return NextResponse.json(results);
        }

        // Filter by level and/or lesson
        const filter = {};
        if (level) filter.level = level.toUpperCase();
        if (lesson) filter.lesson = parseInt(lesson);

        const grammarList = await Grammar.find(filter)
            .sort({ lesson: 1, grammar_id: 1 })
            .lean();

        return NextResponse.json(grammarList);
    } catch (error) {
        console.error('Grammar API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
