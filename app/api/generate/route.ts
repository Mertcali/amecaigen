import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

// Vercel: hobby 60s, pro 300s
export const maxDuration = 60;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// tencentarc/photomaker — yüz kimliğini koruyarak ortam+stil üretimi
// latest version: ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4
const PHOTOMAKER_VERSION = 'ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4';

// Ortam → prompt (trigger word "img" prompt içinde zorunlu)
const ENV_PROMPTS: Record<string, string> = {
  'icu':            'man img working in a modern intensive care unit, medical monitors and ventilators in background, professional medical attire, clinical hospital lighting',
  'operating-room': 'surgeon img in a state-of-the-art operating room, bright surgical lights overhead, medical team and equipment in background, sterile OR environment',
  'emergency':      'doctor img in a busy hospital emergency room, medical staff and equipment in background, urgent care ER setting',
  'laboratory':     'scientist img in a modern medical research laboratory, microscopes and test tubes in background, clean lab environment',
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

    const envPrompt = ENV_PROMPTS[environment] ?? environment;

    // ─── Dinamik stil parametreleri ──────────────────────────────────────────
    let styleName: string;
    let negativePrompt: string;

    if (style === 'Karikatür') {
      styleName      = 'Disney Charactor'; // Modelin kendi yazımı (typo intentional)
      negativePrompt = 'realistic, photo, ugly, deformed, noisy, blurry, low quality, nsfw';
    } else {
      // 'Gerçekçi' (varsayılan)
      styleName      = 'Photographic (Default)';
      negativePrompt = 'cartoon, anime, illustration, painting, drawing, ugly, deformed, nsfw, watermark';
    }

    const prompt = `${envPrompt}, high quality, detailed`;

    // ─── 1. Replicate prediction oluştur (version hash ile) ───────────────────
    const prediction = await replicate.predictions.create({
      version: PHOTOMAKER_VERSION,
      input: {
        input_image:         image,        // base64 data URI veya URL
        prompt:              prompt,       // "img" trigger word içeriyor
        style_name:          styleName,
        negative_prompt:     negativePrompt,
        num_outputs:         1,
        num_steps:           20,
        style_strength_ratio: style === 'Karikatür' ? 35 : 20,
        guidance_scale:      5,
      },
    });

    predictionId = prediction.id;
    console.log(`✅ Prediction oluşturuldu: ${predictionId} | stil: ${style}`);

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
