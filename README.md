# 🏥 AI Medical Photo Booth

Modern web uygulaması - AI destekli medikal fotoğraf deneyimi. Kullanıcılar QR kod taratarak mobil kameralarıyla fotoğraf çekip, AI ile farklı medikal ortamlarda kendilerini görebilirler.

## ✨ Özellikler

- 🎯 **QR Kod Entegrasyonu** - Desktop'ta QR kod, mobilde direkt kamera
- 📸 **Mobil Kamera** - Web Camera API ile sorunsuz fotoğraf çekimi
- 🏥 **Medikal Ortamlar** - Yoğun Bakım ve Ameliyathane seçenekleri
- 🤖 **AI Görsel Oluşturma** - OpenAI DALL-E 3 entegrasyonu
- 💫 **Modern UI** - Tailwind CSS ile şık ve responsive tasarım
- 📱 **Mobil Uyumlu** - iOS ve Android tarayıcılarında çalışır

## 🚀 Hızlı Başlangıç

### Netlify ile Deploy (Önerilen)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. Bu repo'yu GitHub'a push edin
2. Netlify'a bağlayın
3. Environment Variables ekleyin:
   - `OPENAI_API_KEY` - OpenAI API key'iniz
   - `NEXT_PUBLIC_APP_URL` - Netlify URL'iniz (örn: `https://your-app.netlify.app`)
4. Deploy edin!

### Lokal Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# .env.example'ı kopyala
cp .env.example .env.local

# .env.local dosyasını düzenle ve API key ekle

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda açın: [http://localhost:3000](http://localhost:3000)

⚠️ **Not:** Kamera erişimi için **HTTPS** gereklidir. Lokal testlerde sadece `localhost` çalışır. Mobil test için Netlify deploy kullanın.

## 🎨 Kullanım Akışı

1. **Ana Sayfa (Desktop)** - QR kod gösterimi
2. **Kamera Sayfası (Mobil)** - Fotoğraf çekimi
3. **Background Seçimi** - Medikal ortam seçimi
4. **AI Oluşturma** - Görsel oluşturma ve indirme

## 🔧 Teknolojiler

- **Next.js 14** - React framework (App Router)
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **OpenAI API** - DALL-E 3 image generation
- **QR Code React** - QR kod oluşturma

## 🌐 Netlify Deployment

### 1. GitHub'a Push

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Netlify'da Deploy

1. [Netlify](https://app.netlify.com) hesabınıza giriş yapın
2. "Add new site" → "Import an existing project"
3. GitHub repo'nuzu seçin
4. Build settings otomatik algılanacak
5. "Deploy site" tıklayın

### 3. Environment Variables

Netlify dashboard → Site settings → Environment variables:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
NEXT_PUBLIC_APP_URL=https://your-site-name.netlify.app
```

### 4. Redeploy

"Trigger deploy" → "Deploy site"

## 🔑 OpenAI API Key

1. [OpenAI Platform](https://platform.openai.com/) hesabı oluşturun
2. [API Keys](https://platform.openai.com/api-keys) sayfasına gidin
3. "Create new secret key" tıklayın
4. Key'i Netlify'a ekleyin

## 📄 Lisans

MIT

---

**MediTech Systems** © 2026
