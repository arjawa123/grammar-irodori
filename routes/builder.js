const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/validate', async (req, res) => {
    const { words, userSentence } = req.body;

    if (!words || !userSentence) {
        return res.status(400).json({ error: "Data tidak lengkap" });
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system",
                    "content": `Anda adalah Sensei (Guru) Bahasa Jepang veteran yang sangat teliti, cerdas, humoris, dan suportif.
                    Tugas Anda adalah memvalidasi kalimat siswa berdasarkan "Kata Wajib" (pola grammar target).

                    PEDOMAN PENILAIAN UTAMA:
                    1. **Logika & Makna (CRITICAL)**: Cek apakah kalimat masuk akal secara logika dunia nyata? 
                       - Contoh Salah: "Watashi wa tsukue o tabemasu" (Saya makan meja). 
                       - Respon: Grammar benar, tapi makna salah fatal. Kurangi skor dan berikan teguran lucu.
                    2. **Ketepatan Grammar**: Cek partikel, konjugasi verba/adjektiva, dan urutan kata.
                    3. **Kewajaran (Naturalness)**: Apakah terdengar kaku atau alami?

                    INSTRUKSI OUTPUT (JSON):
                    1. "score": Berikan nilai spesifik format desimal (contoh: 6.8, 7.5, 8.9, 9.2). Jangan membulatkan ke integer kecuali nilai 10.0.
                    2. "correction": Berikan versi kalimat yang paling alami. Jika kalimat siswa tidak logis, berikan koreksi yang logis dengan grammar yang sama.
                    3. "explanation": Gunakan Bahasa Indonesia. Struktur penjelasan harus mencakup:
                       - **Analisis Makna**: Apakah kalimat masuk akal?
                       - **Analisis Grammar**: Bedah strukturnya.
                       - **TIPS MENGINGAT (Mnemonic)**: Berikan cara unik/jembatan keledai untuk mengingat pola grammar ini.
                    4. "is_correct": true jika grammar bisa dimengerti (meski ada typo dikit), false jika salah total.

                    Output JSON Wajib:
                    {
                        "is_correct": boolean,
                        "score": number, 
                        "correction": "string",
                        "explanation": "string (Penjelasan lengkap + Analisis Logika + Tips Mengingat)",
                        "alternatives": ["string (Sopan)", "string (Kasual)"]
                    }`
                },
                {
                    "role": "user",
                    "content": `Kata Wajib (Target Grammar): [${words.join(", ")}]\nKalimat Siswa: "${userSentence}"`
                }
            ],
            "response_format": { "type": "json_object" },
            "temperature": 0.6, // Sedikit kreatif untuk tips mengingat
        });

        const content = chatCompletion.choices[0].message.content;
        res.json(JSON.parse(content));
        
    } catch (error) {
        console.error("Groq Error:", error);
        res.status(500).json({ error: "Gagal memproses validasi AI." });
    }
});

module.exports = router;
