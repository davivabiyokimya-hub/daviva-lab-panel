# DAVIVA LAB Desktop — Windows EXE hazırlığı

Bu klasör mevcut DAVIVA LAB web uygulamasını ayrı bir Electron masaüstü penceresinde açan **ilk paketleme taslağıdır**. Uygulama GitHub Pages adresinden yüklenir; **yerel sunucu gerektirmez**, ancak web uygulamasına ve Firebase/Google servislerine erişmek için **internet gerekir**. Veritabanı, personel yetkileri ve Firestore kuralları değiştirilmez.

## Windows 11 üzerinde hazırlama

1. [Node.js LTS](https://nodejs.org/) kurun.
2. GitHub deposunu indirin ve PowerShell ile `desktop` klasörüne girin.
3. `npm install` çalıştırın.
4. `npm start` ile masaüstü penceresini test edin.
5. `npm run dist:win` ile NSIS kurulum EXE'si ve portable EXE üretin. Çıktılar `desktop/dist` klasöründedir.

## Yayın öncesi zorunlu kontroller

- **Google Authentication:** Google, Electron gibi gömülü tarayıcılardaki OAuth oturum açma işlemlerini `disallowed_useragent` hatasıyla engelleyebilir. Bu taslak girişin sorunsuz çalışacağını **garanti etmez**. Üretim sürümünde sistem tarayıcısı üzerinden güvenli OAuth akışı / uygun Firebase oturum aktarımı ayrıca geliştirilip doğrulanmalıdır. Google girişini aşmak için web güvenliğini kapatmayın.
- **Yazıcı:** PALMX DXP-400 üzerinde 50×30 mm etiket, sürücü ve yazdırma kuyruğu ayrıca test edilmelidir.
- **Güncelleme:** Bu sürüm canlı GitHub Pages uygulamasını yükler; tamamen çevrimdışı değildir. Web sitesi değişince masaüstü içeriği de değişir.
- **Güvenlik:** Electron `nodeIntegration:false`, `contextIsolation:true`, `sandbox:true` ve `webSecurity:true` kullanır. Firebase güvenlik kuralları aynen geçerlidir.
- **Dağıtım:** EXE henüz derlenmedi veya Windows'ta test edilmedi. Kod imzalama sertifikası yoksa Windows SmartScreen uyarısı görülebilir.

Bu klasör ana web sitesinin giriş ekranını değiştirmez ve GitHub Pages dağıtımına yeni bir uygulama dosyası eklemez.
