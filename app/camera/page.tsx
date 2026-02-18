'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const handleVideoReady = useCallback(() => {
    console.log('Video hazır, kamera aktifleştiriliyor...');
    setDebugInfo(prev => [...prev, '✅ Video ready event']);
    setIsCameraActive(true);
  }, []);

  const startCamera = async () => {
    try {
      setDebugInfo(['🎥 Starting camera...']);
      console.log('Kamera başlatılıyor...');
      setError(null);
      setIsCameraActive(false);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });
      
      setDebugInfo(prev => [...prev, '✅ Stream acquired']);
      console.log('✅ Media stream alındı');
      
      // Stream'i state'e set et
      setStream(mediaStream);
      setDebugInfo(prev => [...prev, '💾 Stream saved to state']);
      
      // Video element'i bekle ve bağla
      let attempts = 0;
      const maxAttempts = 20;
      
      const connectStream = () => {
        attempts++;
        setDebugInfo(prev => [...prev, `🔍 Attempt ${attempts}: Looking for video element`]);
        
        if (videoRef.current) {
          setDebugInfo(prev => [...prev, '✅ Video element found']);
          const video = videoRef.current;
          video.srcObject = mediaStream;
          
          setDebugInfo(prev => [...prev, '📹 Stream assigned to video']);
          
          // Play'i zorla
          video.play()
            .then(() => {
              setDebugInfo(prev => [...prev, '▶️ Video playing']);
              setTimeout(() => {
                setDebugInfo(prev => [...prev, '✅ Camera activated!']);
                setIsCameraActive(true);
              }, 500);
            })
            .catch((err) => {
              setDebugInfo(prev => [...prev, `⚠️ Play error: ${err.message}, activating anyway`]);
              setTimeout(() => {
                setIsCameraActive(true);
              }, 1000);
            });
        } else if (attempts < maxAttempts) {
          setDebugInfo(prev => [...prev, '⏳ Video element not ready, retrying...']);
          setTimeout(connectStream, 200);
        } else {
          setDebugInfo(prev => [...prev, '❌ Video element not found after max attempts']);
          setError('Video element yüklenemedi');
        }
      };
      
      connectStream();
      
    } catch (err) {
      console.error('❌ Kamera erişim hatası:', err);
      if (err instanceof Error) {
        setDebugInfo(prev => [...prev, `❌ Error: ${err.message}`]);
        setError(`Kameraya erişilemedi: ${err.message}`);
      } else {
        setDebugInfo(prev => [...prev, '❌ Unknown error']);
        setError('Kameraya erişilemedi. Lütfen kamera izinlerini kontrol edin.');
      }
      setIsCameraActive(false);
    }
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Aynayı düzelt (ön kamera için)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        
        // Kamerayı kapat
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setIsCameraActive(false);
        }
      }
    }
  }, [stream]);

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const continueToBackgroundSelection = useCallback(() => {
    if (capturedImage) {
      // Resmi localStorage'a kaydet
      localStorage.setItem('capturedPhoto', capturedImage);
      router.push('/select-background');
    }
  }, [capturedImage, router]);

  // Sayfa yüklendiğinde kamerayı otomatik başlat
  useEffect(() => {
    startCamera();
    
    // Cleanup - component unmount olduğunda kamerayı kapat
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Boş array - sadece mount'ta çalış

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Fotoğraf Çekin</h1>
            <p className="text-xs text-gray-500">MediTech Systems</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {!isCameraActive && !capturedImage && !error && (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-primary-100 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Kamera Başlatılıyor...</h2>
              <p className="text-gray-600 mb-4">
                Lütfen kamera izni verin
              </p>
              {debugInfo.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
                  <p className="text-xs font-mono text-gray-600 mb-2">Debug Info:</p>
                  {debugInfo.map((info, idx) => (
                    <p key={idx} className="text-xs font-mono text-gray-500">{info}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isCameraActive && !capturedImage && error && (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Kamera Erişimi Gerekli</h2>
              <p className="text-gray-600 mb-8">
                Lütfen tarayıcınızda kamera iznini verin ve tekrar deneyin.
              </p>
              <button
                onClick={startCamera}
                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {isCameraActive && !capturedImage && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="relative bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto transform scale-x-[-1]"
                  onCanPlay={handleVideoReady}
                  onPlaying={handleVideoReady}
                  onLoadedMetadata={handleVideoReady}
                  style={{ minHeight: '300px' }}
                />
                <div className="absolute top-4 left-4 right-4">
                  <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm text-center">
                    📸 Kendinizi çerçeveye alın
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50">
                <button
                  onClick={capturePhoto}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  Fotoğraf Çek
                </button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="relative">
                <img src={capturedImage} alt="Çekilen Fotoğraf" className="w-full h-auto" />
                <div className="absolute top-4 left-4 right-4">
                  <div className="bg-green-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm text-center font-medium">
                    ✓ Fotoğraf başarıyla çekildi
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50 space-y-3">
                <button
                  onClick={continueToBackgroundSelection}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  Devam Et
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button
                  onClick={retakePhoto}
                  className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Tekrar Çek
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </main>

      {/* Footer Info */}
      <footer className="py-4 text-center text-gray-500 text-xs">
        <p>Güvenli ve özel • Verileriniz saklanmaz</p>
      </footer>
    </div>
  );
}
