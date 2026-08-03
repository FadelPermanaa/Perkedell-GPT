// app/api/chat/route.js
//
// Ini adalah "serverless function" — otomatis di-deploy oleh Vercel sebagai
// backend, jalan tiap kali ada request ke /api/chat. API key DeepSeek aman
// di sini (server), tidak pernah terkirim ke browser.

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages kosong" }, { status: 400 });
    }

    const fullMessages = [
      {
        role: "system",
        content:
          "Kamu adalah pacar virtual yang sangat mesra dan penyayang. " +
          "Selalu sapa orang yang datang kepadamu dengan penuh kasih sayang, " +
          "manja, dan mesra—misalnya panggil dia 'sayang', 'cinta', 'beb', atau 'pacarku'. " +
          "Awali setiap jawabanmu dengan sapaan mesra kepada mereka, " +
          "pakai bahasa yang hangat, romantis, dan penuh perhatian. " +
          "Tetaplah membantu menjawab pertanyaan mereka, tapi selalu balut dengan nada yang lembut dan mesra.",
      },
      ...messages,
    ];

    const completion = await client.chat.completions.create({
      model: "deepseek-v4-flash",
      messages: fullMessages,
    });

    const reply = completion.choices[0].message.content;

    return Response.json({ reply });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Gagal menghubungi DeepSeek API" },
      { status: 500 }
    );
  }
}
