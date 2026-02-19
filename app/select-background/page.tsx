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

const backgrounds: Background[] = [
  {
    id: 'icu',
    name: 'Yoğun Bakım Ünitesi',
    description: 'Modern yoğun bakım ünitesinde profesyonel sağlık çalışanı',
    prompt: 'professional healthcare worker in a modern intensive care unit',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&q=90',
    icon: '🏥',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    id: 'operating-room',
    name: 'Ameliyathane',
    description: 'Son teknoloji ameliyathanede cerrahi ekip üyesi',
    prompt: 'surgeon in a state-of-the-art operating room',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1920&q=90',
    icon: '⚕️',
    gradient: 'from-teal-500 to-emerald-600',
  },
  {
    id: 'emergency',
    name: 'Acil Servis',
    description: 'Hızlı tempolu acil servis ortamında sağlık profesyoneli',
    prompt: 'healthcare professional in a busy emergency room',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1920&q=90',
    icon: '🚑',
    gradient: 'from-red-500 to-orange-600',
  },
  {
    id: 'laboratory',
    name: 'Laboratuvar',
    description: 'Modern tıbbi laboratuvarda araştırmacı',
    prompt: 'scientist in a modern medical laboratory',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1920&q=90',
    icon: '🔬',
    gradient: 'from-purple-500 to-violet-600',
  },
];

export default function SelectBackgroundPage() {
  const router = useRouter();
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const photo = localStorage.getItem('capturedPhoto');
    if (!photo) {
      router.push('/camera');
    } else {
      setCapturedPhoto(photo);
    }
  }, [router]);

  const handleGenerate = () => {
    if (selectedBackground) {
      const background = backgrounds.find(bg => bg.id === selectedBackground);
      if (background) {
        localStorage.setItem('selectedBackground', JSON.stringify(background));
        router.push('/generate');
      }
    }
  };

  if (!capturedPhoto) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md py-4 px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Ortam Seçin</h1>
            <p className="text-xs text-gray-500">MediTech Systems</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Preview Photo */}
          <div className="mb-6 bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <p className="text-sm font-medium">Fotoğrafınız</p>
            </div>
            <div className="p-4">
              <img
                src={capturedPhoto}
                alt="Çekilen Fotoğraf"
                className="w-full h-48 object-cover rounded-xl"
              />
            </div>
          </div>

          {/* Background Selection */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Bir Ortam Seçin</h2>
            <p className="text-gray-600 mb-6">Kendinizi hangi medikal ortamda görmek istersiniz?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {backgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBackground(bg.id)}
                  className={`relative overflow-hidden rounded-2xl p-6 text-left transition-all transform hover:scale-105 ${
                    selectedBackground === bg.id
                      ? 'ring-4 ring-primary-500 shadow-2xl'
                      : 'shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${bg.gradient} opacity-90`}></div>
                  <div className="relative z-10 text-white">
                    <div className="text-4xl mb-3">{bg.icon}</div>
                    <h3 className="text-xl font-bold mb-2">{bg.name}</h3>
                    <p className="text-sm text-white/90">{bg.description}</p>
                    {selectedBackground === bg.id && (
                      <div className="mt-4 flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Seçildi</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          {selectedBackground && (
            <div className="sticky bottom-0 bg-white rounded-2xl shadow-xl p-6 border-4 border-primary-200">
              <button
                onClick={handleGenerate}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI ile Görsel Oluştur
              </button>
              <p className="text-center text-gray-500 text-xs mt-3">
                Bu işlem 10-20 saniye sürebilir
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
