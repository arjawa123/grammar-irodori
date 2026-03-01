import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

let groq;
try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch (e) {
    console.warn('Groq SDK could not initialize:', e.message);
}

export async function POST(request) {
    const { words, userSentence } = await request.json();

    if (!words || !userSentence) {
        return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    if (!groq) {
        return NextResponse.json({ error: 'AI service tidak tersedia.' }, { status: 503 });
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `Anda adalah Sensei (Guru) Bahasa Jepang veteran yang sangat teliti, cerdas, humoris, dan suportif.
          Tugas Anda adalah memvalidasi kalimat siswa berdasarkan "Kata Wajib" (pola grammar target).

          PEDOMAN PENILAIAN UTAMA:
          1. **Logika & Makna (CRITICAL)**: Cek apakah kalimat masuk akal secara logika dunia nyata?
          2. **Ketepatan Grammar**: Cek partikel, konjugasi verba/adjektiva, dan urutan kata.
          3. **Kewajaran (Naturalness)**: Apakah terdengar kaku atau alami?

          INSTRUKSI OUTPUT (JSON):
          1. "score": Berikan nilai spesifik format desimal (contoh: 6.8, 7.5, 8.9, 9.2).
          2. "correction": Berikan versi kalimat yang paling alami.
          3. "explanation": Gunakan Bahasa Indonesia. Struktur: Analisis Makna, Analisis Grammar, TIPS MENGINGAT.
          4. "is_correct": true jika grammar bisa dimengerti, false jika salah total.

          Output JSON Wajib:
          {
              "is_correct": boolean,
              "score": number,
              "correction": "string",
              "explanation": "string",
              "alternatives": ["string (Sopan)", "string (Kasual)"]
          }`
                },
                {
                    role: 'user',
                    content: `Kata Wajib (Target Grammar): [${words.join(', ')}]\nKalimat Siswa: "${userSentence}"`
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.6,
        });

        const content = chatCompletion.choices[0].message.content;
        return NextResponse.json(JSON.parse(content));
    } catch (error) {
        console.error('Groq Error:', error);
        return NextResponse.json({ error: 'Gagal memproses validasi AI.' }, { status: 500 });
    }
}
