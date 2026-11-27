# Test stratejisi

`npm run test` domain unit testlerini; `npm run supabase:test` pgTAP veritabanı testlerini; `npm run test:e2e` Playwright senaryolarını çalıştırır.

Unit testler randevu state machine'i, onboarding/katalog/ekip doğrulamasını, public işletme modelini, rol izinlerini ve sistem tema senkronizasyonunu doğrular. pgTAP testleri şema/RLS/çakışma constraint'lerine ek olarak iki tenant arasında işletme, public katalog, çalışma saati, platform admin, CRM, operasyon, sadakat ve kampanya allow/deny senaryolarını kapsar.

Faz 7 production transaction kontrolü; puan kazanma/kullanma bakiyesini, hareket sayısını, pazarlama izni filtresini ve kampanya kayıtlarının `sent` yerine `pending` outbox durumunda kalmasını doğrular.

Playwright testleri Chromium üzerinde masaüstü ve Pixel 7 görünümünü, SPA route fallback'ini, Auth yönlendirmesini, PWA manifest/service worker dosyalarını ve service worker cache'iyle gerçek offline yeniden yüklemeyi doğrular. Testlerden önce production build alınmalıdır.

Veritabanı testleri yerel Supabase servislerinin çalışmasını gerektirir; bunun için Docker Desktop açık olmalıdır.

Uygulama doğrulaması `npm run check`, tarayıcı doğrulaması `npm run test:e2e` komutuyla çalıştırılır. GitHub Actions workflow'u her ikisini ve yerel Supabase pgTAP takımını ayrı kalite kapıları olarak çalıştırır.
