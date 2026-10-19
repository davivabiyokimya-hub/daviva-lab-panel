# DAVIVALAB — Kişisel Gmail merkezi Drive kurulumu

## Mimari
GitHub Pages istemcisi → Firebase Auth ID token → güvenli HTTPS API (Firebase Cloud Functions/Cloud Run) → Firebase Admin token doğrulama + Firestore kadro/izin kontrolü → Google Drive API (OAuth 2.0 ile merkezi Gmail) → özel DAVIVALAB klasörü.

## Yönetici kurulumu
1. Merkezi Gmail hesabıyla Google Drive'da özel DAVIVALAB klasörü oluştur; herkese açık paylaşımı kapalı tut.
2. Firebase projesine bağlı Google Cloud Console'da Google Drive API'yi etkinleştir.
3. OAuth consent screen yapılandır; uygun audience ve production/publishing durumunu değerlendir. Testing modundaki harici OAuth uygulamalarında refresh token ömrü kısıtlanabilir.
4. Uygun OAuth istemci türünü seç; redirect URI'leri tam eşleştir. Drive erişimi için minimum gerekli scope'u seç; drive.file kapsamının uygulamanın oluşturduğu/açtığı dosyalarla sınırlı olduğunu göz önüne al.
5. Merkezi Gmail hesabıyla bir defalık onay ver. Refresh token, OAuth client secret ve diğer sırları Google Secret Manager gibi sunucu tarafı gizli depoda tut; hiçbirini GitHub Pages veya Firestore istemci kayıtlarına koyma.
6. API tarafında Firebase Admin ile ID token doğrula; aktif kadro kaydını, rolü, modül iznini ve dosya-kayıt ilişkisini kontrol et. Token doğrulaması tek başına yeterli değildir.
7. Dosya türü, gerçek MIME, boyut, içerik, hız sınırı, kötü amaçlı dosya taraması ve işlem kayıtları uygula. Hasta verisi için kurumsal/KVKK onayı olmadan yüklemeyi açma.
8. Drive dosyasını özel olarak oluştur, dosya ID'sini Firestore metadata kaydına yaz. Hata durumunda uzlaştırma/temizlik mekanizması kullan. İndirme ve listeleme yalnız API üzerinden yetki kontrollü olsun.
9. app.js içindeki irsaliye akışını ve device-inserts.js içindeki cihaz belge akışını kademeli taşı; eski Firebase Storage storagePath bağlantılarını koru.
10. Önce test kullanıcılarıyla uçtan uca dene, sonra üretime al. Firebase/Cloud Run ücretsiz kotaları ve olası faturalandırma koşullarını önceden doğrula.

## Kurulumda gerekli bilgiler (sohbete gizli değer gönderilmez)
- Merkezi Gmail hesabının sahibi OAuth onayını kendi tarayıcısında verir.
- Firebase projesinde yönetici yetkisi ve Cloud Functions/Cloud Run dağıtım yetkisi.
- Kurumsal veri saklama ve KVKK politikası.

## Durum
Yalnız kurulum yönergesi. OAuth onayı, Drive klasörü, API dağıtımı ve canlı yükleme henüz yapılmadı.
