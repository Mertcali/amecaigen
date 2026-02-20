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

// ─── PROMPT STRATEJİSİ ────────────────────────────────────────────────────────
// flux-pulid "portrait, [transformation]" formatında kısa promptlarla en iyi sonucu verir.
// "a person / a character" gibi ifadeler kimliği sıfırlar — KESİNLİKLE kullanma.
// Yüz main_face_image'dan gelir; prompt sadece stil+ortamı tarif eder.

// Ortam → Gerçekçi prompt (kısa + portrait odaklı)
const ENV_PROMPTS_REALISTIC: Record<string, string> = {
  'icu':            'portrait, medical professional in hospital intensive care unit, ICU monitors and equipment in background, wearing scrubs, cinematic lighting, sharp focus, photorealistic',
  'operating-room': 'portrait, surgeon in operating room, bright surgical overhead lights, sterile OR setting, scrub cap and mask, cinematic, photorealistic',
  'emergency':      'portrait, doctor in busy hospital emergency room, ER equipment in background, medical uniform, cinematic lighting, photorealistic',
  'laboratory':     'portrait, scientist in medical research laboratory, lab bench with equipment in background, white lab coat, cinematic lighting, photorealistic',
};

// Ortam → Karikatür prompt (stil dönüşümü — "character" yok, kişiyi dönüştür)
const ENV_PROMPTS_CARTOON: Record<string, string> = {
  'icu':            'portrait, Disney Pixar 3D animation style, medical professional in colorful ICU ward, cartoon hospital monitors, warm friendly lighting, vibrant colors, animated movie render',
  'operating-room': 'portrait, Disney Pixar 3D animation style, surgeon in cartoon operating room, bright stylized surgical lights, vibrant colors, animated movie render',
  'emergency':      'portrait, Disney Pixar 3D animation style, doctor in colorful cartoon ER hospital, animated medical equipment, vibrant colors, animated movie render',
  'laboratory':     'portrait, Disney Pixar 3D animation style, scientist in cartoon laboratory, colorful lab equipment in background, white coat, vibrant colors, animated movie render',
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
    // id_weight : yüz kimlik ağırlığı (0–3). 2.0+ = yüz çok güçlü kilitlenir.
    // start_step: 0 = en yüksek yüz sadakati, 4 = daha fazla stil dönüşümü
    // true_cfg  : 1 = standart CFG. >1 = prompt bağlılığı (karikatür stilini zorlamak için)
    let idWeight: number;
    let startStep: number;
    let trueCfg: number;
    let guidanceScale: number;

    if (style === 'Karikatür') {
      prompt        = ENV_PROMPTS_CARTOON[environment] ?? environment;
      negativePrompt = 'realistic photo, ugly, deformed, noisy, blurry, low quality, nsfw, watermark, extra limbs, text, signature, bad anatomy';
      idWeight      = 1.3;  // Yüzü korur ama karikatür stiline dönüşmeye izin verir
      startStep     = 4;    // Stil dönüşümü için daha fazla özgürlük
      trueCfg       = 3;    // Prompt stilini güçlü zorla (Disney Pixar)
      guidanceScale = 5;
    } else {
      // 'Gerçekçi' (varsayılan)
      prompt        = ENV_PROMPTS_REALISTIC[environment] ?? environment;
      negativePrompt = 'cartoon, anime, illustration, painting, drawing, ugly, deformed, noisy, blurry, low quality, nsfw, watermark, extra limbs, text, signature, bad anatomy';
      idWeight      = 2.0;  // Maksimuma yakın kimlik kilidi — yüz en çok korunur
      startStep     = 0;    // En yüksek yüz sadakati (model dokümantasyonu)
      trueCfg       = 1;    // Standart CFG yeterli
      guidanceScale = 4;
    }

    // ─── 1. Replicate prediction oluştur (version hash ile) ───────────────────
    const prediction = await replicate.predictions.create({
      version: FLUXPULID_VERSION,
      input: {
        main_face_image:  image,
        prompt:           prompt,
        negative_prompt:  negativePrompt,
        num_outputs:      1,
        num_steps:        20,           // flux-pulid max 20
        guidance_scale:   guidanceScale,
        true_cfg:         trueCfg,      // >1 = prompt stilini daha güçlü zorla
        id_weight:        idWeight,     // yüz kimlik ağırlığı (0–3)
        start_step:       startStep,    // kimlik enjeksiyonu başlangıç adımı
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
