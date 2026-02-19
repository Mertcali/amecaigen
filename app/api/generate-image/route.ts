import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1080;

export async function POST(request: NextRequest) {
  try {
    const { image, backgroundImageUrl } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Fotoğraf zorunludur' }, { status: 400 });
    }

    if (!backgroundImageUrl) {
      return NextResponse.json({ error: 'Arka plan görseli zorunludur' }, { status: 400 });
    }

    if (!process.env.REMOVEBG_API_KEY) {
      return NextResponse.json(
        { error: 'remove.bg API anahtarı yapılandırılmamış. Lütfen REMOVEBG_API_KEY ortam değişkenini ayarlayın.' },
        { status: 500 }
      );
    }

    // ─── 1. ARKA PLANI KALDIR (remove.bg) ────────────────────────────────────
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const formData = new FormData();
    formData.append(
      'image_file',
      new Blob([imageBuffer], { type: 'image/jpeg' }),
      'photo.jpg'
    );
    formData.append('size', 'auto');

    console.log('🔄 remove.bg API çağrısı yapılıyor...');

    const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.REMOVEBG_API_KEY,
      },
      body: formData,
    });

    if (!removeBgResponse.ok) {
      const errorText = await removeBgResponse.text();
      console.error('remove.bg hatası:', removeBgResponse.status, errorText);

      if (removeBgResponse.status === 402) {
        throw new Error('remove.bg API krediniz tükendi. https://www.remove.bg/tr/dashboard adresinden kontrol edin.');
      }
      if (removeBgResponse.status === 403) {
        throw new Error('remove.bg API anahtarı geçersiz. Lütfen REMOVEBG_API_KEY değerini kontrol edin.');
      }
      throw new Error(`remove.bg API hatası: ${removeBgResponse.status} - ${errorText}`);
    }

    const transparentBuffer = Buffer.from(await removeBgResponse.arrayBuffer());
    console.log('✅ Arka plan başarıyla kaldırıldı');

    // ─── 2. ARKA PLAN GÖRSELİNİ İNDİR ───────────────────────────────────────
    console.log('🔄 Arka plan görseli indiriliyor:', backgroundImageUrl);

    const bgResponse = await fetch(backgroundImageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!bgResponse.ok) {
      throw new Error(`Arka plan görseli indirilemedi: ${bgResponse.status}`);
    }

    const backgroundBuffer = Buffer.from(await bgResponse.arrayBuffer());
    console.log('✅ Arka plan görseli indirildi');

    // ─── 3. GÖRSELLERİ BİRLEŞTİR (sharp) ────────────────────────────────────
    // Arka planı kare forma getir (1080x1080)
    const resizedBg = await sharp(backgroundBuffer)
      .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, { fit: 'cover', position: 'centre' })
      .toBuffer();

    // Kullanıcı görselini ölçeklendir:
    // maks yükseklik %90, maks genişlik %75 (kişi ortada)
    const userMaxHeight = Math.round(OUTPUT_HEIGHT * 0.90);
    const userMaxWidth = Math.round(OUTPUT_WIDTH * 0.75);

    const resizedUser = await sharp(transparentBuffer)
      .resize(userMaxWidth, userMaxHeight, {
        fit: 'inside',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    const userMeta = await sharp(resizedUser).metadata();
    const userW = userMeta.width ?? userMaxWidth;
    const userH = userMeta.height ?? userMaxHeight;

    // Alt-orta hizalama
    const left = Math.round((OUTPUT_WIDTH - userW) / 2);
    const top = OUTPUT_HEIGHT - userH;

    const finalBuffer = await sharp(resizedBg)
      .composite([{ input: resizedUser, left, top }])
      .jpeg({ quality: 92 })
      .toBuffer();

    const base64Image = `data:image/jpeg;base64,${finalBuffer.toString('base64')}`;

    console.log('✅ Görsel birleştirme tamamlandı');

    return NextResponse.json({
      success: true,
      imageUrl: base64Image,
    });

  } catch (error: any) {
    console.error('Görsel oluşturma hatası:', error);

    return NextResponse.json(
      {
        error: error.message || 'Görsel oluşturulurken bir hata oluştu',
        details: error.message ?? 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}
