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

    // Gemini ile prompt iyileştirme (optional - hata alırsa skip)
    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
      
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
      } catch (geminiError: any) {
        console.warn('⚠️ Gemini enhancement failed, using original prompt:', geminiError.message);
        // Gemini başarısız olursa orijinal prompt'u kullan
        enhancedPrompt = `Photorealistic, professional, high quality image: ${prompt}. Ultra detailed, 4K resolution, professional photography, realistic lighting.`;
      }
    } else {
      // Gemini yoksa basit enhancement
      enhancedPrompt = `Photorealistic, professional, high quality image: ${prompt}. Ultra detailed, 4K resolution, professional photography, realistic lighting.`;
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
        body: JSON.stringify({
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
        }),
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
