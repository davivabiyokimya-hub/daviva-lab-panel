# DAVIVA LAB — Çoklu giriş güvenlik testleri

Bu kontrol listesi yalnızca `feature/multi-login-tests` dalı içindir. Canlı Firebase verilerinde test hesabı açmadan veya Authentication sağlayıcılarını değiştirmeden önce ayrı Firebase test projesi kullanılmalıdır.

## Mevcut koddan doğrulananlar
- `app.js`: GoogleAuthProvider + signInWithPopup.
- `app.js`: onAuthStateChanged sonrasında `kadro/{uid}` kontrolü; aktif, doğrulanmış e-posta, kayıtlı e-posta eşleşmesi, admin/stok rolü.
- `firestore.rules`: activeStaff, request.auth.uid ile `kadro` belgesini ve request.auth.token.email ile e-posta eşleşmesini denetliyor.

## Test matrisi (henüz çalıştırılmadı)
| Kimlik yöntemi | Senaryo | Beklenen sonuç |
| --- | --- | --- |
| Google | Kayıtlı, aktif, doğrulanmış hesap | Yetkili erişim |
| Google | Pasif veya kadro kaydı olmayan hesap | Erişim reddi |
| E-posta/şifre | Yeni doğrulanmış test hesabı + kadro kaydı | Yetkili erişim |
| E-posta/şifre | Doğrulanmamış e-posta | Erişim reddi |
| Kullanıcı adı | Sunucu tarafında benzersiz kullanıcı adı çözümleme | Doğru Firebase UID'ye bağlanma |
| Kullanıcı adı | Yanlış parola veya bulunamayan ad | Hesap bilgisi sızdırmadan hata |
| Microsoft 365 | Entra ID test hesabı | Doğru UID ve personel yetkisi |
| Microsoft 365 | Yetkisiz tenant/hesap | Erişim reddi |
| Tüm yöntemler | Aynı personelin hesap bağlama işlemi | Mevcut UID ve kayıtlar korunur |
| Tüm yöntemler | Yetkisiz kullanıcı doğrudan Firestore sorgusu | Kurallar erişimi engeller |

## Yayın öncesi zorunlu adımlar
1. Ayrı Firebase test projesi ve sentetik kadro kayıtları.
2. Kimlik sağlayıcılarını yalnızca test ortamında açma.
3. Emülatörle Firestore kurallarının olumlu/olumsuz senaryolarını çalıştırma.
4. Microsoft Entra ID uygulama kaydı ve geri dönüş URI doğrulaması.
5. Oturum açma/çıkış, parola sıfırlama, hesap bağlama, hata mesajları ve rol testleri.
6. Test kanıtları ve geri dönüş planı tamamlanmadan main dalına birleştirmeme.

**Not:** Bu belge test planıdır; başarılı otomatik veya uçtan uca test sonucu iddia etmez.
