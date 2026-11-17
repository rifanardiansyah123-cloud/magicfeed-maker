const corsHeaders = {
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8"
};

function json(data, status=200, origin="*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Access-Control-Allow-Origin": origin }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "*";
    const allowed = (env.ALLOWED_ORIGIN || "*").split(",").map(s=>s.trim());
    const allowOrigin = allowed.includes("*") || allowed.includes(origin) ? origin : "null";
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...corsHeaders, "Access-Control-Allow-Origin": allowOrigin } });
    }
    if (request.method !== "POST") return json({error:"Gunakan metode POST."},405,allowOrigin);
    if (allowOrigin === "null") return json({error:"Origin tidak diizinkan."},403,"null");
    if (!env.GEMINI_API_KEY) return json({error:"Secret GEMINI_API_KEY belum dikonfigurasi di Cloudflare."},500,allowOrigin);

    try {
      const body = await request.json();
      const topic = String(body.topic || "").trim().slice(0,2000);
      const count = Math.max(3,Math.min(10,Number(body.slideCount)||5));
      const niche = String(body.niche || "Umum").slice(0,100);
      const visualStyle = String(body.style || "Modern").slice(0,100);
      if (!topic) return json({error:"Topik wajib diisi."},400,allowOrigin);

      const prompt = `Kamu adalah creative strategist dan copywriter carousel Instagram berbahasa Indonesia.
Buat carousel ${count} slide tentang: "${topic}".
Niche: ${niche}. Arah visual: ${visualStyle}.
Ketentuan:
- Slide pertama adalah hook yang kuat, spesifik, memicu rasa ingin tahu tanpa clickbait palsu.
- Slide tengah memberi informasi bernilai, runtut, konkret, mudah dipahami.
- Slide terakhir adalah CTA yang relevan.
- Headline singkat dan kuat, ideal 4-12 kata.
- Subtitle maksimal 22 kata.
- Tiap slide memiliki 0-4 bullet points, tiap poin ringkas.
- Hindari klaim angka/fakta yang tidak bisa dipastikan.
- Buat caption Instagram 1-3 paragraf plus 3-6 hashtag yang relevan.
Kembalikan HANYA JSON valid tanpa markdown dengan format:
{"slides":[{"tag":"HOOK","headline":"...","subtitle":"...","points":[],"ctaText":""}],"caption":"..."}
Jumlah slides harus tepat ${count}.`;

      const parts = [{text:prompt}];
      if (body.referenceImage?.data && body.referenceImage?.mimeType) {
        const data = String(body.referenceImage.data).replace(/^data:[^,]+,/,"");
        if (data.length > 7_000_000) return json({error:"Gambar referensi terlalu besar. Gunakan gambar di bawah 5 MB."},413,allowOrigin);
        parts.push({inline_data:{mime_type:String(body.referenceImage.mimeType),data}});
      }

      const model = env.GEMINI_MODEL || "gemini-2.5-flash-lite";
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
      const upstream = await fetch(endpoint,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          contents:[{role:"user",parts}],
          generationConfig:{temperature:0.8,responseMimeType:"application/json"}
        })
      });
      const result = await upstream.json();
      if (!upstream.ok) {
        const message = result?.error?.message || `Gemini API error ${upstream.status}`;
        return json({error:message},upstream.status,allowOrigin);
      }
      const raw = result?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("") || "";
      const parsed = JSON.parse(raw.replace(/^```(?:json)?/,"").replace(/```$/,"").trim());
      if (!Array.isArray(parsed.slides)) throw new Error("Format respons AI tidak sesuai.");
      return json({slides:parsed.slides.slice(0,count),caption:String(parsed.caption||"")},200,allowOrigin);
    } catch (error) {
      return json({error:error.message || "Terjadi kesalahan pada Worker."},500,allowOrigin);
    }
  }
};