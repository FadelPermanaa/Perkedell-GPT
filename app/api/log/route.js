// app/api/log/route.js
//
// Proxy untuk merekap percakapan ke Google Spreadsheet.
// URL Apps Script webhook disimpan di server (env), jadi aman —
// tidak pernah bocor ke browser.
//
// Cara pakai:
//   POST /api/log
//   body: { peer, messages }
//
// `peer` = identifier singkat chat (bisa dialihkan dari header/query), biar
// spreadsheet tahu chat dari sesi/anak mana. `messages` = array chat penuh.

export async function POST(request) {
  const webhookUrl = process.env.SPREADSHEET_WEBHOOK_URL;

  // Kalau webhook belum dikonfigurasi, jangan gagalkan chat utama — cukup skip.
  if (!webhookUrl) {
    return Response.json({ ok: true, skipped: true });
  }

  try {
    const body = await request.json();
    const peer = (body.peer || "anonymous").toString();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    // Kirim ke Apps Script Web App. Kita pakai list text/plain dengan
    // query param supaya bisa dipanggil pakai method GET kalau webhook
    // Apps Script configured sebagai "Anyone can access" + HTTP 302 bypass.
    const payload = {
      peer,
      messages,
      loggedAt: new Date().toISOString(),
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Apps Script doGet biasanya return 302 ke googleusercontent — follow redirect.
    const text = await res.text();
    return Response.json({ ok: true, res: text.slice(0, 200) });
  } catch (err) {
    console.error("log error:", err);
    // Jangan sampai chat utama terganggu — log gagal, tetap jawab ok.
    return Response.json({ ok: true, skipped: true, error: String(err) });
  }
}
