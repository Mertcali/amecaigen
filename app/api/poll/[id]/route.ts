import { NextRequest, NextResponse } from 'next/server';

// Tek bir durum sorgusu — anında döner (<1s).
// Client 2.5s aralıklarla çağırır, Vercel timeout sorunu olmaz.
export const maxDuration = 10;

async function deletePrediction(id: string): Promise<void> {
  try {
    await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` },
    });
    console.log(`🗑️ KVKK: Prediction silindi — ${id}`);
  } catch (err) {
    console.warn('KVKK silme uyarısı:', err);
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Prediction ID gerekli' }, { status: 400 });
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'REPLICATE_API_TOKEN yapılandırılmamış' }, { status: 500 });
  }

  try {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Replicate API hatası: ${res.status}`);
    }

    const prediction = await res.json();
    const { status, output, error } = prediction;

    // ─── Tamamlandı ──────────────────────────────────────────────────────────
    if (status === 'succeeded') {
      const imageUrl = Array.isArray(output) ? output[0] : output;
      // KVKK: başarılı prediction'ı sil
      await deletePrediction(id);
      return NextResponse.json({ status: 'succeeded', imageUrl });
    }

    // ─── Başarısız ───────────────────────────────────────────────────────────
    if (status === 'failed' || status === 'canceled') {
      await deletePrediction(id);
      return NextResponse.json({
        status: 'failed',
        error: error ?? 'Model görsel üretemedi',
      });
    }

    // ─── Devam ediyor (starting / processing) ────────────────────────────────
    return NextResponse.json({ status });

  } catch (err: any) {
    console.error(`Poll error for ${id}:`, err);
    return NextResponse.json(
      { error: err.message ?? 'Durum sorgulanamadı' },
      { status: 500 }
    );
  }
}
