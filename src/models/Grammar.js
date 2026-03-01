import mongoose from 'mongoose';

const GrammarSchema = new mongoose.Schema({
    grammar_id: { type: String, unique: true },
    level: { type: String, required: true, index: true },
    lesson: { type: Number, required: true },
    pattern: { type: String, required: true },
    meaning_id: String,
    usage: String,
    notes: String,
    example: [{
        jp: String,
        romaji: String,
        id: String
    }],
    used_vocab: [String]
});

export default mongoose.models.Grammar || mongoose.model('Grammar', GrammarSchema);
