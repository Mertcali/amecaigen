import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

// Bu endpoint SADECE prediction olusturur ve ID'yi doner (<5s).
// Bekleme/polling tamamen client tarafinda yapilir - Vercel 60s limiti sorun degil.
export const maxDuration = 30;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// --- MODEL -------------------------------------------------------------------
// google/nano-banana = Gemini 2.5 Flash Image - resmi Google modeli (85M run)
// Deployment modeli: version hash yok, model adiyla cagirilir.
// image_input: file[] - dizi olarak alir; konusma dili prompt ile yuz kimligini korur.
const MODEL = 'google/nano-banana';

// --- ORTAM ESLESTIRMESI (GUVENLI) --------------------------------------------
// "surgery", "operating", "blood" gibi NSFW filtresini tetikleyen kelimeler YASAK.
const ENV_LABELS: Record<string, string> = {
  'icu':            'a high-tech advanced clinical monitoring room, bright and sterile',
  'operating-room': 'a modern clean bright healthcare facility with professional medical lighting',
  'emergency':      'a professional hospital triage center, modern clinic',
  'laboratory':     'an advanced scientific research laboratory with microscopes and equipment, clean room',
};

// --- PROMPT KURALI -----------------------------------------------------------
// nano-banana dogal dil promptlariyla en iyi sonucu verir.
// Yuzu tarif etme - "Take the person from the input image" ile modele ver.
// Poz ve kadraji prompt icinde acikca belirt.

function buildRealisticPrompt(environment: string): string {
  const env = ENV_LABELS[environment] ?? environment;
  return (
    'Take the person from the input image and render them as a professional doctor ' +
    'standing confidently in ' + env + '. ' +
    'Show a natural waist-up 3/4 shot with a relaxed expression looking slightly away from the camera. ' +
    'Preserve the exact face, identity, hair, and likeness from the input image. ' +
    'Style: photorealistic, cinematic lighting, documentary photography, 8k resolution. ' +
    'Do not show close-up face only - show body and environment background clearly. ' +
    'Do not depict blood, needles, or anything disturbing.'
  );
}

function buildCartoonPrompt(environment: string): string {
  const env = ENV_LABELS[environment] ?? environment;
  return (
    'Take the person from the input image and transform them into a 3D Pixar/Disney animated character ' +
    'while preserving their unique facial features, face shape, and identity. ' +
    'Show them as a cartoon doctor standing in ' + env + '. ' +
    'Full body standing pose, friendly relaxed expression looking slightly away from camera. ' +
    'Vibrant colors, smooth 3D render, animated movie quality, depth in the background. ' +
    'Do not show close-up face only - show full character and environment.'
  );
}

export async function POST(request: NextRequest) {
  try {
    const { image, environment, style } = await request.json();

    if (!image)       throw new Error('Fotograf zorunludur');
    if (!environment) throw new Error('Ortam secimi zorunludur');
    if (!style)       throw new Error('Stil secimi zorunludur');
    if (!process.env.REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN yapilandirilmamis');

    const isCartoon = (style === 'Karikatur' || style === 'Karikat\u00FCr');
    const prompt = isCartoon
      ? buildCartoonPrompt(environment)
      : buildRealisticPrompt(environment);

    console.log('[nano-banana] stil: ' + style + ' | prompt: ' + prompt.slice(0, 80) + '...');

    const prediction = await replicate.predictions.create({
      model: MODEL,
      input: {
        prompt,
        image_input:   [image],
        aspect_ratio:  '1:1',
        output_format: 'jpg',
      },
    });

    console.log('Prediction olusturuldu: ' + prediction.id);

    return NextResponse.json({ predictionId: prediction.id });

  } catch (error: any) {
    console.error('Create prediction error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Prediction olusturulamadi' },
      { status: 500 }
    );
  }
}