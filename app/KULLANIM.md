# GeoSpy AI - Kullanım Kılavuzu

## 🚀 Başlangıç

### 1. Uygulamayı Başlatın
```bash
docker-compose up geospy-dev
```

Uygulama http://localhost:5173 adresinde çalışacaktır.

### 2. İlk Kurulum

#### API Anahtarı Alma
1. https://aistudio.google.com/app/apikey adresine gidin
2. Google hesabınızla giriş yapın
3. "Create API Key" butonuna tıklayın
4. API anahtarınızı kopyalayın

#### API Anahtarını Yapılandırma
1. Uygulamaya giriş yapın (veya kayıt olun)
2. Sağ üst köşedeki profil menüsünden "Settings" seçin
3. API anahtarınızı yapıştırın
4. "API Anahtarını Test Et" butonuna tıklayın
5. "Ayarları Kaydet" butonuna tıklayın

## 📱 Özellikler

### 🔐 Kimlik Doğrulama
- **Login**: `/login` - Giriş yapma sayfası
- **Register**: `/register` - Kayıt olma sayfası
- Ayrı sayfalar olarak tasarlandı
- Modal olarak açılmaz, tam sayfa görünümü

### 🏠 Ana Sayfa
- **Fotoğraf Yükleme**: Sol üstteki "Upload Image" butonu
- **Harita Görünümü**: Analiz sonuçlarını haritada görüntüleme
- **AI Analiz**: Gemini AI ile otomatik konum tespiti
- **Karşılaştırma Modu**: Birden fazla analizi karşılaştırma

### ⚙️ Ayarlar Sayfası (`/settings`)
- **Sistem Dili**: Uygulama dilini değiştirme
  - Türkçe
  - English
  - Deutsch
  - Français
  - Español

- **API Anahtarı Yönetimi**:
  - API anahtarını güvenli şekilde saklama
  - API anahtarını test etme
  - Gerçek zamanlı doğrulama

- **API Testi**:
  - "API Anahtarını Test Et" butonu
  - Anlık geri bildirim
  - Hata mesajları

## 🔧 Sorun Giderme

### Analiz Çalışmıyor
1. Ayarlar sayfasından API anahtarınızı kontrol edin
2. "API Anahtarını Test Et" butonuna tıklayın
3. API anahtarı geçerliyse ✓ işareti göreceksiniz
4. Geçersizse yeni bir anahtar alın

### Login Modal Hemen Kapanıyor
✅ **Düzeltildi!** Artık login ve register ayrı sayfalardır:
- `/login` - Giriş sayfası
- `/register` - Kayıt sayfası

### API Anahtarı Nerede Saklanıyor?
- API anahtarınız tarayıcınızın localStorage'ında güvenli şekilde saklanır
- Sunucuya gönderilmez
- Sadece sizin tarayıcınızda kalır

## 📊 Kullanım Akışı

```
1. Kayıt Ol/Giriş Yap (/register veya /login)
   ↓
2. Ayarlar'a Git (/settings)
   ↓
3. API Anahtarını Gir ve Test Et
   ↓
4. Ayarları Kaydet
   ↓
5. Ana Sayfaya Dön (/)
   ↓
6. Fotoğraf Yükle
   ↓
7. AI Analizi Bekle
   ↓
8. Sonuçları Haritada Gör
```

## 🎯 Önemli Notlar

- ✅ API anahtarı localStorage'da saklanır
- ✅ Sayfa yenilense bile ayarlar kalır
- ✅ Login/Register ayrı sayfalardır
- ✅ Ayarlar sayfası tam özelliklidir
- ✅ API testi gerçek zamanlıdır

## 🔗 Sayfalar

- `/` - Ana sayfa (korumalı)
- `/login` - Giriş sayfası
- `/register` - Kayıt sayfası
- `/settings` - Ayarlar sayfası (korumalı)

## 💡 İpuçları

1. **İlk Kullanım**: Mutlaka önce Ayarlar'dan API anahtarınızı girin
2. **Test Edin**: API anahtarını girdikten sonra test edin
3. **Kaydedin**: Değişiklikleri kaydetmeyi unutmayın
4. **Yenileyin**: Gerekirse sayfayı yenileyin

## 🆘 Destek

Sorun yaşıyorsanız:
1. Tarayıcı konsolunu kontrol edin (F12)
2. API anahtarını test edin
3. Docker loglarını kontrol edin: `docker logs geospy-dev`
