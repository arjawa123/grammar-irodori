const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Grammar = require('./models/Grammar');
require('dotenv').config();

// Koneksi ke MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected for Seeding'))
    .catch(err => console.error(err));

// Fungsi Import
const importData = async () => {
    try {
        // 1. Baca File JSON (Sesuaikan nama file kamu di sini)
        // Pastikan path-nya benar menuju folder public/data atau dimanapun kamu menyimpannya
        const file1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/data/mapped_A1_grammar.json'), 'utf-8'));
        const file2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/data/mapped_A21_grammar.json'), 'utf-8'));
        const file3 = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/data/mapped_A22_grammar.json'), 'utf-8'));
        // const file3 = ... (tambahkan file ke-3 jika ada)

        // 2. Gabungkan semua data
        let allGrammar = [...file1, ...file2, ...file3]; 

        // 3. Tambahkan uniqueId jika belum ada di JSON (Penting untuk sistem favorit)
        allGrammar = allGrammar.map((item, index) => ({
            ...item,
            // Gunakan grammar_id dari JSON, atau buat baru jika tidak ada
            grammar_id: item.grammar_id || `g_${item.level}_${item.lesson}_${index}`
        }));

        // 4. Hapus data lama (opsional, biar gak duplikat saat test ulang)
        await Grammar.deleteMany();
        console.log('🗑️ Data lama dihapus...');

        // 5. Masukkan data baru
        await Grammar.insertMany(allGrammar);
        console.log('✅ Data Grammar Berhasil Diimpor!');

        process.exit();
    } catch (err) {
        console.error('❌ Gagal Impor:', err);
        process.exit(1);
    }
};

importData();
