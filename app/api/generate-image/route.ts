import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HfInference } from '@huggingface/inference';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

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
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    // Gemini ile prompt iyileştirme
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
    const enhancedPrompt = response.text();

    console.log('Enhanced prompt:', enhancedPrompt);

    // Hugging Face ile görsel oluşturma (Stable Diffusion XL)
    const imageBlob = await hf.textToImage({
      model: 'stabilityai/stable-diffusion-xl-base-1.0',
      inputs: enhancedPrompt,
      parameters: {
        negative_prompt: 'cartoon, anime, drawing, illustration, low quality, blurry, distorted, unrealistic',
        num_inference_steps: 30,
        guidance_scale: 7.5,
      }
    });

    // Blob'u base64'e çevir
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
