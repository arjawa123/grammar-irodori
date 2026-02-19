const express = require('express');
const router = express.Router();
const Grammar = require('../models/Grammar');

// @desc    Ambil semua grammar berdasarkan Level
// @route   GET /api/grammar/:level
router.get('/:level', async (req, res) => {
    try {
        const level = req.params.level.toUpperCase(); // misal: "N5"
        
        // Ambil data dari DB, urutkan berdasarkan Lesson lalu ID
        const grammarList = await Grammar.find({ level: level })
                                         .sort({ lesson: 1, grammar_id: 1 });

        if (!grammarList || grammarList.length === 0) {
            return res.status(404).json({ message: "Data tidak ditemukan untuk level ini." });
        }

        res.json(grammarList);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
