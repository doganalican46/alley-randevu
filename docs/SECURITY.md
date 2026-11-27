# Güvenlik

- Platform yetkisi `user_metadata` kullanmaz; `platform_admins` tablosu istemci
  yazımına kapalıdır ve ilk atama yalnızca veritabanı sahibi tarafından yapılır.
- Askıya alınmış veya arşivlenmiş tenant durumunu yalnızca platform yöneticisi
  değiştirebilir.
- CRM, abonelik, feature flag ve audit tabloları açık GRANT listesi ve RLS ile
  korunur; anonim role erişim verilmez.
- Bildirim outbox'ı istemciden yazılamaz; yalnızca güvenli randevu trigger'ı
  kayıt üretir ve sağlayıcı bulunmadığında sahte gönderim başarısı oluşmaz.
- Tahsilatlar `billing.manage`, finansal okumalar `reports.financial` yetkisiyle
  sınırlandırılır. Değerlendirme yalnızca tamamlanmış randevunun sahibi
  tarafından oluşturulabilir; işletme yalnızca yayın durumunu değiştirebilir.

- Public şemadaki tüm tablolar RLS kullanır; GRANT listeleri açıkça sınırlandırılır.
- Tenant erişimi `auth.uid()` ve `business_members` üzerinden doğrulanır.
- Yetki kararlarında kullanıcı tarafından düzenlenebilir `user_metadata` kullanılmaz.
- `service_role`/secret key tarayıcıya verilmez.
- İç yardımcı fonksiyonlar `private` şemasındadır; PUBLIC execute yetkisi kaldırılır ve `search_path` boş sabitlenir.
- İşletme onboarding RPC'si `SECURITY INVOKER` kullanır; yalnızca `authenticated` rolüne açıktır.
- Hizmet atama RPC'si `SECURITY INVOKER` kullanır ve `staff.manage` RLS kontrolünü aşmaz.
- Çalışma saatleri anonim rollere kapalıdır; tenant üyeleri okuyabilir, yalnız personel yöneticileri yazabilir.
- Public katalog anonim erişimde yalnız yayınlanmış işletme ile aktif şube/hizmet satırlarını açar; yazma GRANT'i vermez.
- Public müsaitlik RPC'si çalışma programını ve randevu çakışmalarını okur ancak müşteri verisi döndürmez.
- Rezervasyon yazma RPC'si yalnız doğrulanmış kullanıcıya açıktır; anonim rolün EXECUTE yetkisi açıkça kaldırılmıştır.
- Rezervasyon, hizmet fiyat/süre snapshot'ı ve ilk durum geçmişi tek transaction içinde oluşturulur.
- İptal ve yeniden planlama işlemleri müşteri sahipliği, tenant permission'ı ve işletmenin zaman penceresiyle doğrulanır.
- Ayrıcalıklı rezervasyon gövdeleri `private` şemasındadır; public API yalnız açık GRANT listeli `SECURITY INVOKER` sarmalayıcılar sunar.
- İstemci route guard'ları kullanıcı deneyimini korur; asıl tenant yetkilendirmesi RLS ile uygulanır.
- Oturum kapanışında kullanıcıya ait query cache temizlenir.
- Owner rolünün normal üyelik API'si üzerinden atanması veya silinmesi engellenir.
- Randevu durum geçişi trigger ile doğrulanır, geçmiş kaydı oluşturulur.
- Randevu çakışması exclusion constraint ile transaction seviyesinde engellenir.

Production Supabase Security ve Health Advisor kontrolleri temizdir. Boş production veritabanındaki kullanılmamış indeks bilgi notları trafik oluşana kadar beklenen durumdur. Misafir rezervasyonu açılmadan önce rate limiting/CAPTCHA/doğrulama eklenmeli; Storage RLS ve KVKK/hukuk incelemesi ayrıca tamamlanmalıdır.
