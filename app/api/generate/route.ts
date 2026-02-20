import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

// Bu endpoint SADECE prediction oluşturur ve ID'yi döner (<5s).
// Bekleme/polling tamamen client tarafında yapılır → Vercel 60s limiti sorun değil.
export const maxDuration = 30;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// ─── MODEL VERSİYONLARI ──────────────────────────────────────────────────────
// Gerçekçi: zsxkib/instant-id — kimlik koruma altın standardı (1M run, L40S)
// controlnet_conditioning_scale = IdentityNet kimlik sadakati (max 1.5)
const INSTANTID_VERSION = '2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789';

// Karikatür: fofr/face-to-many — 14.9M run, InstantID tabanlı stil dönüşümü
// instant_id_strength = kimlik kilidi (0–1), style = "3D"
const FACE_TO_MANY_VERSION = 'a07f252abbbd832009640b27f063ea52d87d7a23a185ca165bec23b5adc8deaf';

// ─── ORTAM EŞLEŞTİRMESİ (GÜVENLİ) ─────────────────────────────────────────────
// "surgery", "operating", "blood" gibi NSFW filtresini tetikleyen kelimeler YASAK.
// Steril, parlak, profesyonel ortam tanımları kullanılıyor.
const ENV_LABELS: Record<string, string> = {
  'icu':            'high-tech advanced clinical monitoring room, bright and sterile',
  'operating-room': 'modern clean bright healthcare facility, professional medical lighting',
  'emergency':      'professional hospital triage center, modern clinic',
  'laboratory':     'advanced scientific research laboratory, looking through a microscope, clean room',
};

// ─── PROMPT KURALI ───────────────────────────────────────────────────────────
// ASLA "adam/kadın/gözleri kahverengi" gibi kişiyi tarif eden ifade ekleme.
// Yüz bilgisi model tarafından input image'dan alınır; prompt SADECE ortam+kadraj+stil tarif eder.
// Cinematic wide/medium shot → selfie hissini kırar, profesyonel kadraj sağlar.

function buildRealisticPrompt(environment: string): string {
  const env = ENV_LABELS[environment] ?? environment;
  return `A natural candid photograph, standing pose, 3/4 portrait shot showing waist up, a professional doctor with a relaxed natural expression looking slightly away from camera, inside a ${env} with clear background details, volumetric lighting, cinematic, documentary style, 8k resolution`;
}

function buildCartoonPrompt(environment: string): string {
  const env = ENV_LABELS[environment] ?? environment;
  return `Full body character shot, standing pose, a 3D Pixar style animated character of a professional doctor with a relaxed friendly expression looking away from camera, inside a detailed ${env} with depth, vibrant colors, digital illustration, masterpiece`;
}

// ─── ORTAK NEGATIVE PROMPT ────────────────────────────────────────────────────
// Selfie hissini, NSFW/güvenlik filtresini ve düşük kaliteyi engeller.
const NEGATIVE_PROMPT =
  'nsfw, blood, gore, violence, surgery, injured, selfie, close-up, extreme close-up, face shot, head shot, holding phone, looking at camera, looking into lens, camera flash, phone camera, distorted face, strained expression, unnatural smile, wide angle lens distortion, fisheye lens, bad anatomy, deformed, distorted, worst quality, low quality, amateur, watermark, text, signature';

// ─── KVKK silme yardımcısı ───────────────────────────────────────────────────
async function deletePrediction(id: string): Promise<void> {
  try {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` },
    });
    if (res.ok) {
      console.log(`🗑️ KVKK: Prediction silindi — ${id}`);
    } else {
      console.warn(`⚠️ KVKK silme başarısız (${res.status}) — ${id}`);
    }
  } catch (err) {
    console.warn('KVKK silme uyarısı:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { image, environment, style } = await request.json();

    if (!image)       throw new Error('Fotoğraf zorunludur');
    if (!environment) throw new Error('Ortam seçimi zorunludur');
    if (!style)       throw new Error('Stil seçimi zorunludur');
    if (!process.env.REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN yapılandırılmamış');

    let prediction: Awaited<ReturnType<typeof replicate.predictions.create>>;

    // ─────────────────────────────────────────────────────────────────────────
    // GERÇEKÇİ → zsxkib/instant-id
    // ─────────────────────────────────────────────────────────────────────────
    if (style === 'Gerçekçi') {
      const prompt = buildRealisticPrompt(environment);
      console.log(`[instant-id] prompt: ${prompt}`);

      prediction = await replicate.predictions.create({
        version: INSTANTID_VERSION,
        input: {
          image,
          prompt,
          negative_prompt:               NEGATIVE_PROMPT + ', cartoon, anime, illustration, painting, drawing, noisy, blurry, extra limbs',
          sdxl_weights:                  'protovision-xl-high-fidel',
          num_outputs:                   1,
          num_inference_steps:           30,
          guidance_scale:                7,
          ip_adapter_scale:              0.8,
          controlnet_conditioning_scale: 0.65,
          output_format:                 'webp',
          output_quality:                90,
          enhance_nonface_region:        true,
          enable_pose_controlnet:        true,
        },
      });

    // ─────────────────────────────────────────────────────────────────────────
    // KARİKATÜR → fofr/face-to-many  (style: "3D")
    // ─────────────────────────────────────────────────────────────────────────
    } else {
      const prompt = buildCartoonPrompt(environment);
      console.log(`[face-to-many] prompt: ${prompt}`);

      prediction = await replicate.predictions.create({
        version: FACE_TO_MANY_VERSION,
        input: {
          image,
          style:                  '3D',
          prompt,
          negative_prompt:        NEGATIVE_PROMPT + ', realistic, photo, noisy, blurry, extra limbs',
          prompt_strength:        4.5,
          instant_id_strength:    0.70,
          denoising_strength:     0.65,
          control_depth_strength: 0.8,
        },
      });
    }

    console.log(`✅ Prediction oluşturuldu: ${prediction.id} | model: ${style === 'Gerçekçi' ? 'instant-id' : 'face-to-many'}`);

    // Sadece ID döner — client kendi polling loop'unu çalıştırır
    return NextResponse.json({ predictionId: prediction.id });

  } catch (error: any) {
    console.error('Create prediction error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Prediction oluşturulamadı' },
      { status: 500 }
    );
  }
}
