'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Background {
  id: string;
  name: string;
  description: string;
  prompt: string;
  backgroundImageUrl: string;
  icon: string;
  gradient: string;
}

export default function GeneratePage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(true);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [background, setBackground] = useState<Background | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  useEffect(() => {
    const capturedPhoto   = localStorage.getItem('capturedPhoto');
    const selectedBg      = localStorage.getItem('selectedBackground');
    const style           = localStorage.getItem('selectedStyle');

    if (!capturedPhoto || !selectedBg || !style) {
      router.push('/camera');
      return;
    }

    const bg = JSON.parse(selectedBg) as Background;
    setBackground(bg);
    setSelectedStyle(style);

    // Progress simulation — polling süresine göre yavaş artış
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 2;
      });
    }, 2500);

    // Generate image
    generateImage(capturedPhoto, bg.id, style);

    return () => clearInterval(progressInterval);
  }, [router]);

  const generateImage = async (photo: string, environment: string, style: string) => {
    try {
      // ── Adım 1: Prediction oluştur, ID al (<5s, Vercel timeout yok) ──────────
      const createRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: photo, environment, style }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createData.error || 'Prediction oluşturulamadı');
      }

      const { predictionId } = createData;
      console.log(`⏳ Polling başlıyor: ${predictionId}`);

      // ── Adım 2: Client-side polling — her 2.5s'de bir durum sor ─────────────
      // Maksimum 120s bekle (48 × 2.5s). Vercel fonksiyonu <1s sürer.
      const MAX_POLLS = 48;
      let polls = 0;

      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
          polls++;
          console.log(`📡 Poll ${polls}/${MAX_POLLS}`);

          if (polls > MAX_POLLS) {
            clearInterval(interval);
            reject(new Error('İşlem zaman aşımına uğradı (120s). Lütfen tekrar deneyin.'));
            return;
          }

          try {
            const pollRes  = await fetch(`/api/poll/${predictionId}`);
            const pollData = await pollRes.json();

            if (pollData.status === 'succeeded') {
              clearInterval(interval);
              setProgress(100);
              setTimeout(() => {
                setGeneratedImage(pollData.imageUrl);
                setIsGenerating(false);
              }, 400);
              resolve();

            } else if (pollData.status === 'failed') {
              clearInterval(interval);
              reject(new Error(pollData.error || 'Model görsel üretemedi'));
            }
            // 'starting' veya 'processing' → bekle, interval devam eder
          } catch (pollErr: any) {
            // Geçici ağ hatası — interval devam eder, job iptal olmaz
            console.warn('Poll ağ hatası (devam ediyor):', pollErr.message);
          }
        }, 2500);
      });

    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Görsel oluşturulurken bir hata oluştu');
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `meditech-ai-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const startOver = () => {
    localStorage.removeItem('capturedPhoto');
    localStorage.removeItem('selectedBackground');
    localStorage.removeItem('selectedStyle');
    router.push('/camera');
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">AI Görselinizi Oluşturuyor</h2>
            <p className="text-gray-600">Bu işlem 30-60 saniye sürebilir...</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>İlerleme</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-700 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Info */}
          {background && (
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4 space-y-1">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Ortam:</span> {background.name}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Stil:</span> {selectedStyle}
              </p>
            </div>
          )}

          {/* Loading Steps */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-600">Fotoğraf yüklendi</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${progress > 30 ? 'bg-green-500' : 'bg-gray-300 animate-pulse'}`}>
                {progress > 30 ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <span className="text-gray-600">Yüz kimliği analiz ediliyor...</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${progress > 60 ? 'bg-green-500' : 'bg-gray-300 animate-pulse'}`}>
                {progress > 60 ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <span className="text-gray-600">Replicate AI üretiyor...</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${progress >= 100 ? 'bg-green-500' : 'bg-gray-300'}`}>
                {progress >= 100 ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <span className="text-gray-600">Tamamlanıyor</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Bir Hata Oluştu</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700 font-semibold mb-2">Hata Detayı:</p>
              <p className="text-sm text-red-600 break-words">{error}</p>
              {(error?.includes('API key') || error?.includes('configured')) && (
                <p className="text-xs text-red-500 mt-3">
                  💡 Vercel Environment Variables'ı kontrol edin ve redeploy yapın
                </p>
              )}
              {(error?.includes('quota') || error?.includes('rate limit')) && (
                <p className="text-xs text-red-500 mt-3">
                  💡 API rate limit aşıldı, birkaç dakika bekleyip tekrar deneyin
                </p>
              )}
            </div>
          </div>
          <button
            onClick={startOver}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            Baştan Başla
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Görseliniz Hazır!</h1>
            <p className="text-xs text-gray-500">MediTech Systems</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Success Message */}
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-800">Başarıyla Oluşturuldu!</p>
                <p className="text-sm text-green-600">AI görseliniz hazır</p>
              </div>
            </div>
          </div>

          {/* Generated Image */}
          {generatedImage && (
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
              <div className="relative">
                <img
                  src={generatedImage}
                  alt="AI Generated"
                  className="w-full h-auto"
                />
                <div className="absolute top-4 right-4">
                  <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-medium">
                    AI Generated
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={downloadImage}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Görseli İndir
            </button>
            <button
              onClick={startOver}
              className="w-full bg-white text-gray-700 px-6 py-4 rounded-xl font-semibold border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Yeni Görsel Oluştur
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 text-center">
              💡 Görselinizi sosyal medyada paylaşabilir veya cihazınıza kaydedebilirsiniz
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
