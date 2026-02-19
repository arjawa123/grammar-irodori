const mongoose = require('mongoose');

const GrammarSchema = new mongoose.Schema({
  grammar_id: { type: String, unique: true }, // ID unik (misal: g_1_0)
  level: { type: String, required: true, index: true }, // N5, N4, dll
  lesson: { type: Number, required: true }, // 1, 2, 3...
  pattern: { type: String, required: true },
  meaning_id: String,
  usage: String,
  notes: String,
  example: [{
    jp: String,
    romaji: String,
    id: String // Terjemahan
  }]
});

module.exports = mongoose.model('Grammar', GrammarSchema);
