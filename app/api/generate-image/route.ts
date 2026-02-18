import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { image, prompt } = await request.json();

    if (!image || !prompt) {
      return NextResponse.json(
        { error: 'Image and prompt are required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Base64 image data'yı temizle
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    // OpenAI DALL-E 3 ile görsel oluştur
    // Not: DALL-E 3 şu an için image-to-image desteklemiyor
    // Bu yüzden sadece prompt ile görsel oluşturacağız
    // Gerçek üretim ortamında Stable Diffusion veya benzeri bir servis kullanılabilir
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a professional, realistic image: ${prompt}. High quality, photorealistic, professional photography, 4K resolution.`,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "natural",
    });

    const generatedImageUrl = response.data?.[0]?.url;

    if (!generatedImageUrl) {
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: generatedImageUrl,
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate image',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
