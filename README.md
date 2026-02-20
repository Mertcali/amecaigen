# 🏥 AI Medical Photo Booth

Modern web uygulaması - AI destekli medikal fotoğraf deneyimi. Kullanıcılar QR kod taratarak mobil kameralarıyla fotoğraf çekip, AI ile farklı medikal ortamlarda kendilerini görebilirler.

## ✨ Özellikler

- 🎯 **QR Kod Entegrasyonu** - Desktop'ta QR kod, mobilde direkt kamera
- 📸 **Mobil Kamera** - Web Camera API ile sorunsuz fotoğraf çekimi
- 🏥 **Medikal Ortamlar** - Yoğun Bakım, Ameliyathane, Acil Servis, Laboratuvar
- 🤖 **AI Görsel Üretimi** - Replicate `fofr/face-to-many` ile kimlik korumalı görsel
- 🎨 **İki Stil** - Gerçekçi (fotoğraf kalitesi) veya Karikatür / 3D (Pixar tarzı)
- 🔒 **KVKK/GDPR** - Görsel üretimi sonrası Replicate'ten otomatik silme
- 💫 **Modern UI** - Tailwind CSS ile şık ve responsive tasarım
- 📱 **Mobil Uyumlu** - iOS ve Android tarayıcılarında çalışır

## 🚀 Hızlı Başlangıç

### Vercel ile Deploy (Önerilen)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Mertcali/amecaigen)

1. Bu repo'yu GitHub'a push edin
2. Vercel'a bağlayın
3. Environment Variables ekleyin:
   - `REPLICATE_API_TOKEN` - Replicate API token'ınız
   - `REMOVEBG_API_KEY` - remove.bg API key'iniz (eski flow)
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
- **remove.bg** - Arka plan kaldırma (ayda 50 ücretsiz)
- **sharp** - Görsel birleştirme (compositing)
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
REPLICATE_API_TOKEN=your-replicate-api-token-here
REMOVEBG_API_KEY=your-removebg-api-key-here
NEXT_PUBLIC_APP_URL=https://your-site-name.vercel.app
```

### 4. Redeploy

"Deployments" sekmesine gidin → En son deployment'ın yanındaki "..." → "Redeploy"

## 🔑 API Keys Nasıl Alınır?

### Replicate API Token (Yeni - Gerekli)
1. [replicate.com](https://replicate.com/signin) adresine gidip GitHub ile kayıt olun
2. [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens) sayfasından token alın
3. Token'ı kopyalayın ve Vercel'e ekleyin

**Not:** Kayıt bonusuyla ücretsiz başlayabilirsiniz (~$5), sonrası ~$0.05-0.10/görsel

### remove.bg API Key (Eski flow - Opsiyonel)
1. [remove.bg](https://www.remove.bg/tr/users/sign_up) adresine gidip kayıt olun
2. [API sayfasından](https://www.remove.bg/tr/api) API key alın

**Not:** Ücretsiz planda ayda 50 görsel üretebilirsiniz

## 📄 Lisans

MIT

---

**MediTech Systems** © 2026
