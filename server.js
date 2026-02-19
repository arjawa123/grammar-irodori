const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose'); // Import Mongoose
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Koneksi Database
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ MongoDB Error:", err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// --- ROUTES ---
app.use('/api/builder', require('./routes/builder'));
app.use('/api/grammar', require('./routes/grammar')); // Tambahkan Route Grammar Baru

// Fallback Route
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
