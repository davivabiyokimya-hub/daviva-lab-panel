# DAVIVALAB — Merkezi Drive belge entegrasyonu

Durum: Tasarım / uygulama öncesi güvenlik kontrolü. Bu dal mevcut yüklemeleri değiştirmez.

## Mevcut durum (kod incelemesi)
- app.js: stok girişinde irsaliye dosyası için Firebase Storage yerine kullanıcı onayıyla dosyasız kayıt akışı var. dispatchPath Firestore'da kullanılıyor.
- device-inserts.js: cihaz dokümanları Firebase Storage'a uploadBytesResumable ile yükleniyor, labModules içinde storagePath tutuluyor.
- firestore.rules: kadro, accessPermissions ve admin/stok rolleri mevcut.

## Hedef
- Merkezi kurumsal Google hesabının özel DAVIVALAB klasörüne irsaliye ve cihaz belgelerini yükle.
- Firestore'da dosya içeriği değil driveFileId, category, entityId, originalName, mimeType, size, uploadedBy, uploadedAt, status sakla.
- Geçişte eski storagePath kayıtlarını okumaya devam et; eski Firebase Storage dosyalarını silme.

## Güvenlik ve uygulama
1. Kurum onaylı Drive hesabında DAVIVALAB kök klasörü ve irsaliye/cihaz alt klasörleri aç. Klasör ID'lerini yalnız sunucu yapılandırmasına koy.
2. GitHub Pages üzerinde Drive API anahtarı, OAuth client secret, servis hesabı anahtarı veya Apps Script yetki token'ı yayımlama.
3. Firebase ID token'ını HTTPS üzerinden güvenilir sunucuya gönder. Sunucu Firebase Admin SDK ile imzayı, issuer, audience, expiry ve uid'yi doğrulasın; Firestore kadro.aktif, e-posta ve rol/izinlerini ayrıca kontrol etsin.
4. Merkezi Drive'a yalnız sunucu kimliğiyle yaz. Önerilen sunucu: Firebase Cloud Functions/Cloud Run + Google Drive API. Servis hesabına hedef klasörde asgari izin ver; kişisel My Drive erişimi için desteklenen yetkilendirme modelini ayrıca doğrula. Alternatif Apps Script ancak Firebase ID token'ının güvenli sunucu tarafı doğrulaması ve web-app CORS/oturum modeli test edildikten sonra kullanılabilir.
5. Yükleme öncesi kategori, bağlı kayıt, dosya boyutu, uzantı ve gerçek MIME türünü doğrula; zararlı dosya kontrolü, hız sınırı ve denetim kaydı uygula. Hasta verisi içeren belgeler için KVKK/kurum politikası onayı zorunlu.
6. Dosyaları private tut. Listeleme/indirme istekleri de aynı sunucu yetki kontrolünden geçsin; herkese açık Drive linki verme.
7. Başarılı Drive yüklemesinden sonra metadata'yı Firestore'a yaz. Firestore kaydı başarısız olursa yetim dosyayı temizle veya uzlaştırma kuyruğuna al. Stok hareketiyle ilişkilendirme hatalarında çift kayıt oluşmasını engelle.
8. Admin için arşivleme, yetkili personel için görüntüleme/yükleme; dosya işlemlerini ayrı audit log'a yaz.
9. Test ortamında: yetkisiz kullanıcı, iptal edilen kullanıcı, yanlış cihaz ID'si, büyük dosya, bozuk MIME, ağ kesintisi, eşzamanlı işlem, eski Storage dosyası, silme/geri yükleme senaryolarını doğrula.

## Değişiklik sırası
- A: Drive hesabı ve güvenli sunucu kimliği/izinleri hazırlanır.
- B: upload/list/download/archive API'leri ve testleri geliştirilir.
- C: app.js irsaliye yüklemesi yeni API'ye bağlanır; dosyasız kayıt onayı kaldırılmadan önce iş kuralı kararlaştırılır.
- D: device-inserts.js yeni API'ye bağlanır; eski storagePath için fallback korunur.
- E: firestore.rules içinde yeni metadata koleksiyonu ve izinler yalnız test sonrası eklenir.
- F: kontrollü pilot, ardından üretim geçişi.

## Gerekli kurulum kararları
- Merkezi Drive hesabının tipi (Google Workspace / kişisel Gmail)
- Firebase proje yöneticisinin sunucu dağıtım yetkisi
- Hasta/kişisel veri içeren dosyalara izin verilip verilmeyeceği

Not: Bu doküman bir entegrasyon planıdır; canlı Drive bağlantısı kurulmuş değildir.
