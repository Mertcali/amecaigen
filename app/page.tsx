'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    // QR kodunu mobil sayfaya yönlendirecek URL oluştur
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    setQrUrl(`${appUrl}/camera`);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-lightblue via-white to-primary-100 flex flex-col">
      {/* Header with Logo */}
      <header className="w-full py-8 px-12">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-700 to-primary-900 bg-clip-text text-transparent">
              MediTech Systems
            </h1>
            <p className="text-gray-600 text-sm mt-1">Professional Healthcare Solutions</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-7xl w-full">
          {/* Left Side - Information */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                AI Destekli
                <span className="block bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Görsel Deneyim
                </span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Gelişmiş yapay zeka teknolojimiz ile kendinizi profesyonel tıbbi ortamlarda görselleştirin.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-primary-100">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                Nasıl Çalışır?
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">QR Kodu Taratın</p>
                    <p className="text-gray-500 text-sm">Telefonunuzla sağdaki QR kodu okutun</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Fotoğraf Çekin</p>
                    <p className="text-gray-500 text-sm">Ön kamera ile fotoğrafınızı çekin</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Ortam Seçin</p>
                    <p className="text-gray-500 text-sm">İstediğiniz medikal ortamı seçin</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Sonucu Görün</p>
                    <p className="text-gray-500 text-sm">AI ile oluşturulan görselinizi inceleyin</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-center text-gray-600">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm">Verileriniz güvenli ve gizlidir</p>
            </div>
          </div>

          {/* Right Side - QR Code */}
          <div className="flex items-center justify-center">
            <div className="bg-white rounded-3xl p-12 shadow-2xl border-4 border-primary-200 relative">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              
              <div className="mb-6 text-center">
                <p className="text-2xl font-bold text-gray-800 mb-2">Deneyimi Başlatın</p>
                <p className="text-gray-500">Telefonunuzla QR kodu taratın</p>
              </div>
              
              {qrUrl && (
                <div className="bg-white p-6 rounded-2xl">
                  <QRCodeSVG 
                    value={qrUrl} 
                    size={280}
                    level="H"
                    includeMargin={false}
                    fgColor="#005580"
                  />
                </div>
              )}
              
              <div className="mt-6 flex items-center justify-center gap-2 text-primary-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">Mobil Cihaz Gerekli</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-12 text-center text-gray-500 text-sm">
        <p>&copy; 2026 MediTech Systems. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
