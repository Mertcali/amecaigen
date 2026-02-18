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

### Vercel ile Deploy (Önerilen)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Mertcali/amecaigen)

1. Bu repo'yu GitHub'a push edin
2. Vercel'a bağlayın
3. Environment Variables ekleyin:
   - `GEMINI_API_KEY` - Google Gemini API key'iniz
   - `HUGGINGFACE_API_KEY` - Hugging Face token'ınız
   - `NEXT_PUBLIC_APP_URL` - Vercel URL'iniz (örn: `https://your-app.vercel.app`)
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

⚠️ **Not:** Kamera erişimi için **HTTPS** gereklidir. Lokal testlerde sadece `localhost` çalışır. Mobil test için Vercel deploy kullanın.

## 🎨 Kullanım Akışı

1. **Ana Sayfa (Desktop)** - QR kod gösterimi
2. **Kamera Sayfası (Mobil)** - Fotoğraf çekimi
3. **Background Seçimi** - Medikal ortam seçimi
4. **AI Oluşturma** - Görsel oluşturma ve indirme

## 🔧 Teknolojiler

- **Next.js 14** - React framework (App Router)
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Google Gemini AI** - Prompt enhancement
- **Hugging Face (Stable Diffusion XL)** - Image generation (ücretsiz tier)
- **QR Code React** - QR kod oluşturma

## 🌐 Vercel Deployment

### 1. GitHub'a Push

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Vercel'da Deploy

1. [Vercel](https://vercel.com) hesabınıza giriş yapın (GitHub ile)
2. "Add New Project" → "Import Git Repository"
3. GitHub repo'nuzu seçin
4. Framework Preset otomatik algılanacak (Next.js)
5. "Deploy" tıklayın

### 3. Environment Variables

Vercel dashboard → Settings → Environment Variables:

```
GEMINI_API_KEY=your-actual-gemini-api-key-here
HUGGINGFACE_API_KEY=your-hf-token-here
NEXT_PUBLIC_APP_URL=https://your-site-name.vercel.app
```

### 4. Redeploy

"Deployments" sekmesine gidin → En son deployment'ın yanındaki "..." → "Redeploy"

## 🔑 API Keys Nasıl Alınır?

### Google Gemini API Key (Gerekli)
1. [Google AI Studio](https://makersuite.google.com/app/apikey) sayfasına gidin
2. Google hesabınızla giriş yapın
3. "Get API Key" → "Create API key" tıklayın
4. Key'i kopyalayın ve Netlify'a ekleyin

**Not:** Gemini API ücretsiz tier'a sahiptir (günlük 60 istek limit)

### Hugging Face Token (Gerekli)
1. [Hugging Face](https://huggingface.co/join) hesabı oluşturun
2. [Settings → Access Tokens](https://huggingface.co/settings/tokens) sayfasına gidin
3. "New token" → "Read" yetkisi ile oluşturun
4. Token'ı kopyalayın ve Netlify'a ekleyin

**Not:** Hugging Face Inference API ücretsiz kullanılabilir (rate limiting var)

## 📄 Lisans

MIT

---

**MediTech Systems** © 2026
