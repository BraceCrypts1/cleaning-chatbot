const MODEL = "gemini-3.5-flash-lite";   // the model id we locked in 0.4

export default async (req, context) => {
  const apiKey = (process.env.CLEANING_GEMINI_KEY ?? "").trim();
    if (!apiKey) {
    return new Response(JSON.stringify({ ok: false, error: "missing key" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Reply with exactly three words: key works fine" }] }],
    }),
  });

  const data = await upstream.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

  return new Response(JSON.stringify({ ok: upstream.ok, status: upstream.status, text, error: data?.error?.message ?? null }), {
        status: 200,
    headers: { "Content-Type": "application/json", 
      "Cache-Control": "no-store" },
  });
};

export const config = { path: "/api/ai-test" };