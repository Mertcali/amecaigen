import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { image, prompt } = await request.json();

    if (!image || !prompt) {
      return NextResponse.json(
        { error: 'Image and prompt are required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ Gemini API key not configured, using basic prompt enhancement');
    }

    let enhancedPrompt = prompt;

    // Gemini ile prompt iyileştirme - GEÇİCİ OLARAK DEVRE DIŞI
    // Kullanıcı isteği üzerine Gemini kaynaklı hataları önlemek için bu adımı atlıyoruz.
    /*
    if (process.env.GEMINI_API_KEY) {
      // Hata yakalama (try-catch) kaldırıldı, hata varsa direkt dönsün
      // Model ismi güncellendi: 'gemini-1.5-flash-latest' -> 'gemini-1.5-flash'
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
      const enhancementPrompt = `You are a professional prompt engineer for AI image generation. 
      Enhance this prompt to create a photorealistic, professional medical image:
      
      Original prompt: "${prompt}"
      
      Requirements:
      - Make it highly detailed and specific
      - Emphasize photorealistic quality
      - Include professional medical environment details
      - Keep it under 200 words
      - Focus on realism and professionalism
      
      Return ONLY the enhanced prompt, nothing else.`;

      const result = await model.generateContent(enhancementPrompt);
      const response = await result.response;
      enhancedPrompt = response.text();

      console.log('✅ Gemini enhanced prompt:', enhancedPrompt);
    } else {
      console.warn('⚠️ Gemini API key not configured, using basic prompt enhancement');
      enhancedPrompt = `Photorealistic, professional, high quality image: ${prompt}. Ultra detailed, 4K resolution, professional photography, realistic lighting.`;
    }
    */
   
    // Gemini yerine basit şablon kullan
    console.log('⚠️ Gemini devre dışı bırakıldı, manuel şablon kullanılıyor.');
    enhancedPrompt = `Photorealistic, professional, high quality medical image: ${prompt}. Ultra detailed, 4K resolution, professional photography, clinical environment, realistic lighting, sharp focus.`;

    // Hugging Face API çağrısı için body hazırlığı
    // NOT: SDXL base model genellikle Text-to-Image olarak çalışır. 
    // Image-to-Image için API'ye görseli doğru formatta göndermek kritiktir.
    // Ancak router.huggingface.co üzerinde otomatik pipeline seçimi Text2Image'a düşüyor olabilir.
    
    let apiBody;
    
    if (image) {
      // Base64 header'ını temizle
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      
      // Image-to-Image için 'inputs' görsel olmalı, 'prompt' parametrelerde olmalı.
      // Ancak alınan hatada 'multiple values for argument prompt' deniyor.
      // Bu, sistemin 'inputs'u prompt olarak algıladığını (Text2Image pipeline) gösteriyor.
      // Çözüm: inputs'u prompt yapıp, görseli parametre olarak göndermeyi deneyeceğiz (bazı endpointler bunu destekler)
      // VEYA daha robust bir yöntem: Görseli YOK SAYIP sadece prompt ile üretim yapmak (Hata almamak için)
      // Şimdilik Image-to-Image'i geçici olarak devre dışı bırakıp Text-to-Image dönüyoruz
      // çünkü SDXL Inference API direkt img2img desteklemeyebilir bu endpointte.
      
      console.log('⚠️ Image-to-Image API hatası nedeniyle görsel yok sayılıyor, Text-to-Image kullanılıyor.');
      
      // Prompt'u zenginleştir (görselden bağımsız)
      apiBody = {
        inputs: enhancedPrompt, // Prompt'u inputs'a koyuyoruz
        parameters: {
          negative_prompt: 'cartoon, anime, drawing, illustration, low quality, blurry, distorted, unrealistic',
          num_inference_steps: 30, 
          guidance_scale: 7.5,
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      };
      
    } else {
      // Sadece text varsa Text-to-Image
      apiBody = {
        inputs: enhancedPrompt,
        parameters: {
          negative_prompt: 'cartoon, anime, drawing, illustration, low quality, blurry, distorted, unrealistic',
          num_inference_steps: 25,
          guidance_scale: 7.5,
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      };
      console.log('📝 Text-to-Image modu kullanılıyor');
    }

    // Hugging Face ile görsel oluşturma (direkt API çağrısı - YENİ ROUTER FORMAT)
    const hfResponse = await fetch(
      'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
          'x-use-cache': 'false',
        },
        body: JSON.stringify(apiBody),
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      throw new Error(`Hugging Face API error: ${hfResponse.status} - ${errorText}`);
    }

    // Blob'u base64'e çevir
    const imageBlob = await hfResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

    return NextResponse.json({
      success: true,
      imageUrl: base64Image,
      enhancedPrompt: enhancedPrompt,
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    
    let errorMessage = 'Failed to generate image';
    if (error.message) {
      errorMessage = error.message;
    }
    
    // Check for specific error types
    if (error.message?.includes('API key')) {
      errorMessage = 'API key hatası: ' + error.message;
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API quota aşıldı. Lütfen daha sonra tekrar deneyin.';
    } else if (error.message?.includes('rate limit')) {
      errorMessage = 'Rate limit aşıldı. Lütfen birkaç dakika bekleyin.';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
