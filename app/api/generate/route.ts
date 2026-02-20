import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

// Vercel: hobby 60s, pro 300s — polling'in sığması için gerekli
export const maxDuration = 60;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// fofr/face-to-many: yüzü koruyarak farklı stil/ortam üretir
const MODEL = 'fofr/face-to-many';

// Ortam → İngilizce prompt tanımları
const ENV_PROMPTS: Record<string, string> = {
  'icu': 'in a modern intensive care unit hospital room, medical monitors ventilators and equipment visible in background, professional medical setting, clinical lighting',
  'operating-room': 'in a state-of-the-art operating room surgical theater, bright overhead surgical lights, medical equipment and team in background, sterile environment',
  'emergency': 'in a busy hospital emergency room, medical staff and equipment in background, urgent care setting, ER environment',
  'laboratory': 'in a modern medical research laboratory, scientific microscopes test tubes and equipment in background, clean lab environment',
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

    // ─── Dinamik model parametreleri (Gerçekçi vs Karikatür) ─────────────────
    let replicateStyle: string;
    let prompt: string;
    let negativePrompt: string;

    if (style === 'Karikatür') {
      replicateStyle   = 'Disney Charactor'; // Replicate modelin kendi yazımı
      prompt           = `3D Pixar animated Disney character ${envPrompt}, vibrant colors, high quality, detailed cartoon animation style, expressive`;
      negativePrompt   = 'realistic, photo, ugly, deformed, noisy, blurry, low quality, sketch, 2D';
    } else {
      // 'Gerçekçi' (varsayılan)
      replicateStyle   = 'Photographic';
      prompt           = `RAW photo, highly detailed, photorealistic ${envPrompt}, professional medical attire, natural lighting, sharp focus, 4k resolution, cinematic`;
      negativePrompt   = 'cartoon, anime, illustration, painting, drawing, ugly, deformed, noisy, blurry, low quality, overexposed, watermark';
    }

    // ─── 1. Replicate prediction oluştur ─────────────────────────────────────
    const prediction = await replicate.predictions.create({
      model: MODEL,
      input: {
        image:            image, // data URI (base64) — Replicate destekler
        style:            replicateStyle,
        prompt:           prompt,
        negative_prompt:  negativePrompt,
        num_outputs:      1,
        guidance_scale:   7.5,
        num_inference_steps: 50,
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
