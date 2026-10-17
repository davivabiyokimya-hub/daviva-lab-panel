# DAVIVA AI — güvenli ilk sürüm

Bu modül **henüz dağıtılmış değildir**. GitHub Pages sadece istemciyi barındırır. Sunucu işlevi Firebase Cloud Functions üzerinde ayrıca dağıtılmalıdır.

## Kurulum

1. Firebase projesi `daviva-lab` için gerekli faturalandırma/Blaze koşullarını ve Cloud Functions izinlerini kontrol edin.
2. Yerel bilgisayarda Node.js 22, Firebase CLI kurun; yetkili hesapla `firebase login` ve `firebase use daviva-lab` çalıştırın. Projeyi doğru seçtiğinizi doğrulayın.
3. `firebase functions:secrets:set OPENAI_API_KEY` ile API anahtarını gizli olarak girin. **Anahtarı GitHub'a, web koduna veya Firestore'a yazmayın.**
4. Proje kökünde `npm --prefix functions install` çalıştırın.
5. Önce Firebase Emulator ile yönetici / personel / anonim kullanıcı erişimini ve istek sınırlarını test edin.
6. Hazır olduğunuzda `firebase deploy --only functions:davivaAiChat --project daviva-lab` çalıştırın.
7. Web sitesi dağıtımının Firebase Hosting / GitHub Pages akışınıza uygun olduğunu doğrulayın.

## Kısıtlar

- İlk sürüm yalnızca `kadro` kaydında aktif `admin` rolü olan kullanıcılara açıktır.
- İstek başına en fazla 1500 karakter; kullanıcı başına saatte 20 istek.
- Firestore verileri API'ye aktarılmaz; sadece yöneticinin yazdığı soru gönderilir.
- Hasta veya hassas kişisel bilgi **yazılmamalıdır**. Prompt talimatı tek başına hassas veri tespitini/engellemeyi garanti etmez.
- Model çıktısı öneridir, SAS uyum kararı veya tıbbi değerlendirme değildir.
- `aiUsage` dokümanları sadece sunucu SDK tarafından kullanılır; Firestore istemci kuralları erişimi reddetmelidir.
- Gizli anahtarlar, üretim erişim kontrolleri, bütçe uyarıları, App Check ve kapsamlı testler dağıtım öncesinde değerlendirilmelidir.
