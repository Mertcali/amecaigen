import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

// Vercel: hobby 60s, pro 300s
export const maxDuration = 60;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// bytedance/flux-pulid — FLUX tabanlı, yüz kimliğini %90+ koruma
// latest version: 8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b
const FLUXPULID_VERSION = '8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b';

// Ortam → Gerçekçi prompt
const ENV_PROMPTS_REALISTIC: Record<string, string> = {
  'icu':            'professional photograph of a person working in a modern intensive care unit, medical monitors and ventilators in background, wearing medical scrubs, clinical hospital lighting, sharp focus, 8k',
  'operating-room': 'professional photograph of a surgeon in a state-of-the-art operating room, bright surgical lights overhead, sterile OR environment, medical team in background, sharp focus, 8k',
  'emergency':      'professional photograph of a doctor in a busy hospital emergency room, medical staff and equipment in background, urgent care ER setting, sharp focus, 8k',
  'laboratory':     'professional photograph of a scientist in a modern medical research laboratory, microscopes and test tubes in background, white lab coat, clean lab environment, sharp focus, 8k',
};

// Ortam → Karikatür prompt
const ENV_PROMPTS_CARTOON: Record<string, string> = {
  'icu':            '3D Disney Pixar style animated character in a modern intensive care unit, colorful cartoon medical monitors, friendly hospital setting, vibrant colors, animated movie style',
  'operating-room': '3D Disney Pixar style animated character as a surgeon in an operating room, bright cartoon surgical lights, animated medical team, vibrant colors, animated movie style',
  'emergency':      '3D Disney Pixar style animated character as an ER doctor, colorful cartoon hospital emergency room, animated medical staff, vibrant colors, animated movie style',
  'laboratory':     '3D Disney Pixar style animated character as a scientist in a colorful laboratory, cartoon microscopes and test tubes, white lab coat, vibrant colors, animated movie style',
};

export async function POST(request: NextRequest) {
  let predictionId: string | null = null;

  try {
    const { image, environment, style } = await request.json();

    // ─── Girdi doğrulama ─────────────────────────────────────────────────────
    if (!image)       throw new Error('Fotoğraf zorunludur');
    if (!environment) throw new Error('Ortam seçimi zorunludur');
    if (!style)       throw new Error('Stil seçimi zorunludur');
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN yapılandırılmamış');
    }

    // ─── Dinamik stil parametreleri ──────────────────────────────────────────
    let prompt: string;
    let negativePrompt: string;
    // id_weight: yüz kimlik ağırlığı (0-3). Yüksek = daha çok yüz benzerliği.
    // start_step: 0 = en yüksek yüz sadakati, 4 = daha fazla stil esnekliği
    let idWeight: number;
    let startStep: number;

    if (style === 'Karikatür') {
      prompt         = ENV_PROMPTS_CARTOON[environment] ?? environment;
      negativePrompt = 'realistic, photo, ugly, deformed, noisy, blurry, low quality, nsfw, watermark, extra limbs';
      idWeight       = 1.0;  // Karikatür: kimlik biraz esner, stil ön plana çıkar
      startStep      = 4;    // Daha fazla stil dönüşümü
    } else {
      // 'Gerçekçi' (varsayılan)
      prompt         = ENV_PROMPTS_REALISTIC[environment] ?? environment;
      negativePrompt = 'cartoon, anime, illustration, painting, drawing, ugly, deformed, noisy, blurry, low quality, nsfw, watermark, extra limbs, text, signature';
      idWeight       = 1.8;  // Gerçekçi: yüz kimliği güçlü kilitlenir
      startStep      = 1;    // Neredeyse en yüksek yüz sadakati
    }

    // ─── 1. Replicate prediction oluştur (version hash ile) ───────────────────
    const prediction = await replicate.predictions.create({
      version: FLUXPULID_VERSION,
      input: {
        main_face_image:  image,
        prompt:           prompt,
        negative_prompt:  negativePrompt,
        num_outputs:      1,
        num_steps:        20,          // flux-pulid max 20
        guidance_scale:   5,           // prompt bağlılığı
        id_weight:        idWeight,    // yüz kimlik ağırlığı
        start_step:       startStep,   // kimlik enjeksiyonu başlangıç adımı
        output_format:    'webp',
        output_quality:   90,
      },
    });

    predictionId = prediction.id;
    console.log(`✅ flux-pulid Prediction oluşturuldu: ${predictionId} | stil: ${style} | id_weight: ${idWeight}`);

    // ─── 2. Polling: succeeded ya da failed olana dek bekle ──────────────────
    // maxAttempts × 2s bekleme = ~56s (Vercel 60s limiti içinde)
    const maxAttempts = 28;
    let attempts      = 0;
    let result        = await replicate.predictions.get(predictionId);

    while (
      result.status !== 'succeeded' &&
      result.status !== 'failed'    &&
      result.status !== 'canceled'
    ) {
      if (attempts >= maxAttempts) {
        throw new Error('İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.');
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      result = await replicate.predictions.get(predictionId);
      attempts++;
      console.log(`⏳ Polling ${attempts}/${maxAttempts} — ${result.status}`);
    }

    if (result.status !== 'succeeded' || !result.output) {
      throw new Error(`Görsel oluşturulamadı: ${result.error ?? 'Model çıktı üretemedi'}`);
    }

    const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;

    // ─── 3. KVKK/GDPR — Prediction'ı Replicate'ten sil ──────────────────────
    // Bu çağrı, kullanıcının kaynak görselini ve prediction verisini sunucudan kaldırır.
    try {
      const deleteRes = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          method:  'DELETE',
          headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` },
        }
      );
      if (deleteRes.ok) {
        console.log(`🗑️ KVKK: Prediction silindi — ${predictionId}`);
      } else {
        console.warn(`⚠️ KVKK silme başarısız (${deleteRes.status}) — ${predictionId}`);
      }
    } catch (deleteErr) {
      // Silme hatası üretimi engellemesin
      console.warn('KVKK silme uyarısı:', deleteErr);
    }

    return NextResponse.json({ success: true, imageUrl: outputUrl });

  } catch (error: any) {
    console.error('Replicate generation error:', error);

    // Hata durumunda da KVKK silme dene
    if (predictionId) {
      try {
        await fetch(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            method:  'DELETE',
            headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` },
          }
        );
        console.log(`🗑️ KVKK (hata): Prediction silindi — ${predictionId}`);
      } catch {}
    }

    return NextResponse.json(
      {
        error:   error.message ?? 'Görsel oluşturulurken bir hata oluştu',
        details: error.message ?? 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}
