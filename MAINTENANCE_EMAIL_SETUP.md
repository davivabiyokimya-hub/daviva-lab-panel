# DAVIVA LAB – Otomatik cihaz bakım e-postaları

Bu özellik GitHub'a eklenmiştir ancak **Firebase'e dağıtılmadan e-posta göndermez**.

## Gereksinimler
- Firebase projesinde Cloud Functions v2, Cloud Scheduler ve gerekli faturalandırma etkin olmalı (Blaze planı gerekebilir).
- Resend hesabı, doğrulanmış gönderici alan adı ve etkin API anahtarı.
- Firebase CLI ile projeye yetkili dağıtım erişimi.

## Kurulum
1. Firebase CLI ile doğru projeyi seçin; projeyi ve faturalandırmayı doğrulayın.
2. `firebase functions:secrets:set RESEND_API_KEY` komutuyla Resend API anahtarını tanımlayın.
3. `firebase functions:secrets:set MAINTENANCE_MAIL_FROM` komutuyla doğrulanmış gönderici adresini (ör. `DAVIVA LAB <bildirim@kurumunuz.com>`) tanımlayın.
4. `firebase deploy --only functions:sendMaintenanceReminders` komutuyla fonksiyonu yayımlayın.
5. Cloud Scheduler, Functions günlükleri ve Resend teslimat kayıtları üzerinden ilk çalışmayı doğrulayın.

## Davranış
- Türkiye saatiyle her gün 09.00'da çalışır.
- 7, 3, 1 ve 0 gün kala ve geciken her gün uyarı gönderir.
- Alıcılar aktif `kadro` yöneticileri ile bakım kaydının `assignedUid` alanındaki aktif personeldir.
- Aynı plan/gün için `maintenanceMailLog` kaydıyla tekrar gönderim azaltılır.
- Hasta bilgileri veya hasta test sonuçları e-postaya eklenmez.
- Bakım kaydının `next` alanı sonraki plan tarihidir. Eski kayıtlar korunur.

## Sınırlamalar
- E-posta gönderimi için bir servis hesabı ve doğru gönderen adresi gereklidir.
- `pending` veya `failed` günlük kayıtları için otomatik yeniden deneme henüz yoktur; hataları Cloud Functions ve Resend panelinden inceleyin.
- Bakım sorumlusu yalnızca yeni bakım kaydı oluşturulurken seçilir. Eski kayıtlar otomatik olarak bir personele atanmaz.
- Tarayıcıdaki bakım hatırlatmaları, sunucu e-posta sisteminden bağımsızdır.
