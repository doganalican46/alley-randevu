# Veritabanı

Faz 4 ve 5 ile `platform_admins`, `subscription_plans`,
`business_subscriptions`, `feature_flags`, `business_feature_flags`,
`audit_logs`, `business_customers` ve `customer_notes` tabloları eklendi.
Tenant verisi taşıyan her tabloda zorunlu `business_id`, açık GRANT listesi ve
işlem bazlı RLS politikaları bulunur. Randevulu müşteriler trigger ile CRM'e
eklenir; platform yetkisi yalnızca veritabanı tablosundan okunur.

İşletme operasyonları `notification_templates`, `notification_outbox`,
`payments` ve `reviews` tablolarında tutulur. Randevu oluşturma ve durum
değişiklikleri outbox kaydını otomatik üretir; harici sağlayıcı sonucu olmadan
kayıt `sent` durumuna geçirilmez. `get_business_report` SECURITY INVOKER
fonksiyonu alttaki tenant RLS politikalarını koruyarak aylık özet döndürür.

İlk migration şu çekirdek tabloları oluşturur: `profiles`, `businesses`, `business_members`, `branches`, `services`, `staff_profiles`, `staff_services`, `appointments`, `appointment_services`, `appointment_status_history`. Takip eden migration, personelin şube bazlı haftalık programını tutan `staff_working_hours` tablosunu ekler.

Tenant tablolarında `business_id` bulunur. İlişkili kayıtların başka tenant'a bağlanmasını önlemek için branch, service ve staff ilişkileri composite foreign key ile doğrulanır. Aktif personel randevularında saat çakışması PostgreSQL exclusion constraint ile eşzamanlı isteklerde dahi engellenir.

`create_business` RPC'si işletme ile ilk şubeyi tek transaction içinde oluşturur. Fonksiyon `SECURITY INVOKER` olarak çalışır; mevcut RLS politikalarını aşmaz ve ilk işletme sahibi üyeliği veritabanı trigger'ı tarafından oluşturulur.

pgTAP testleri anonim kullanıcı reddini, owner erişimini, tenant'lar arası okuma/güncelleme reddini, işletme silme reddini ve şube/hizmet katalog izolasyonunu doğrular.

Public katalog sorguları yalnız `active` ve `is_published` işletmeleri; bu işletmelerin yalnız aktif şube ve hizmetlerini döndürür. Anon rolü bu üç tablo için yalnız `SELECT` yetkisine sahiptir.

Çalışma saati kayıtları branch ve staff ilişkilerini `business_id` içeren composite foreign key'lerle doğrular. Aynı personel, şube ve hafta günü için tek program satırı bulunur. Hizmet atamaları `replace_staff_services` SECURITY INVOKER RPC'si ile atomik güncellenir ve mevcut RLS politikalarını aşmaz.

İşletme tablosundaki rezervasyon ayarları slot aralığını, minimum bildirim süresini, ileri rezervasyon sınırını, iptal penceresini ve otomatik onayı belirler. `get_public_availability` yalnız yayınlanmış işletmeler için müşteri verisi açmadan güvenli slotlar döndürür; çalışma saati, personel-hizmet ataması, buffer süreleri ve aktif randevu çakışmalarını birlikte değerlendirir.

`create_customer_appointment` yalnız doğrulanmış `authenticated` kullanıcıya açıktır. İşletme, şube, hizmet, personel ve slot uygunluğu fonksiyon içinde yeniden doğrulanır; randevu ile hizmet snapshot'ı tek transaction içinde yazılır. PostgreSQL exclusion constraint eşzamanlı son-koltuk yarışını engeller. `change_appointment_status` ve `reschedule_appointment` müşteri sahipliğini veya tenant permission'ını açıkça doğrular.

Production güvenlik sertleştirmesinde ayrıcalıklı fonksiyon gövdeleri `private` şemasına taşınmış; Data API'de aynı isimlerle yalnız `SECURITY INVOKER` sarmalayıcılar bırakılmıştır. Tenant composite foreign key'leri ve sık kullanılan yetkilendirme join'leri için kapsayıcı indeksler eklenmiştir. Production Security ve Health Advisor sonuçları temizdir.

Migration'lar yalnızca Supabase CLI ile üretilir. Generated TypeScript tipleri uzak proje bağlandıktan sonra `supabase gen types` ile yenilenmelidir.
