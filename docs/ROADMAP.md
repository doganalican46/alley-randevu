# Yol haritası

## Faz durumu

| Faz                      | Durum                   | Tamamlanma özeti                                                                                                                                                                            |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Temel mimari          | Tamamlandı              | Uygulama kabuğu, auth, tenant/RLS, RBAC temeli ve genel ekran izin guard'ları hazır. Bağımsız Frankfurt production Supabase projesi kuruldu.                                              |
| 2. İşletme yönetimi      | Tamamlandı              | Onboarding, katalog, ekip, çalışma saatleri, işletme/rezervasyon ayarları, yayınlama ve PNG/SVG QR paylaşımı production şemasında doğrulandı.                                            |
| 3. Randevu sistemi       | Tamamlandı              | Canlı slot üretimi, müşteri rezervasyonu, transaction RPC, çakışma koruması, yaşam döngüsü, iptal/yeniden planlama ve müşteri paneli production işlem testiyle doğrulandı.               |
| 4. Super Admin           | Tamamlandı              | Veritabanı tabanlı platform admin yetkisi, güvenli bootstrap, işletme/plan/feature flag yönetimi, audit ekranı ve production RLS doğrulaması hazır.                                         |
| 5. İşletme operasyonları | Tamamlandı              | CRM, otomatik müşteri profili, bildirim outbox'ı, aylık raporlama, tahsilat kayıtları ve doğrulanmış randevu değerlendirmeleri production RLS ile hazır.                                    |
| 6. PWA                   | Tamamlandı              | Manifest, service worker, kurulum istemi, offline uyarısı, güvenli cache sınırı, güncelleme deneyimi ve masaüstü/mobil/offline Playwright doğrulaması hazır.                                |
| 7. Gelişmiş özellikler   | Tamamlandı              | Sadakat hesabı ve hareketleri, izinli hedef kitle kampanyaları, güvenli bildirim kuyruğu ve müşteri CSV dışa aktarımı production RLS ile hazır.                                             |
| 8. Production hazırlığı  | Büyük ölçüde tamamlandı | Netlify yayını, güvenlik/PWA başlıkları, GitHub Actions kalite kapısı, E2E, production health script, release checklist ve backup/restore runbook'u hazır; GitHub bağlantısı kaldı.         |

## Çalışan

- Temel React/Vite/Tailwind mimarisi
- Responsive public ve işletme arayüzleri
- Supabase Auth session provider ve repository katmanı
- Korumalı rotalar ve tenant üyelik guard'ı
- Transactional işletme onboarding akışı
- Şube ve hizmet kataloğu yönetimi
- Şube/hizmet işlemlerinde rol ve özel izin kontrolleri
- Personel, hizmet ataması ve çalışma saati yönetimi
- İşletme rezervasyon kuralları, yayınlama ve QR/paylaşım araçları
- Public işletme profili ve rezervasyon seçimlerinde gerçek tenant kataloğu
- Personel çalışma saatlerinden çakışmasız slot üreten müsaitlik RPC'si
- Doğrulanmış müşteri için transaction tabanlı rezervasyon, iptal ve yeniden planlama
- İşletme randevu yaşam döngüsü ve müşteri randevuları ekranları
- Super Admin işletme, abonelik, feature flag ve audit yönetimi
- Tenant izoleli müşteri CRM'i, otomatik randevu profili, etiket ve ekip notları
- Bildirim outbox'ı, aylık operasyon raporu, tahsilat ve müşteri değerlendirmeleri
- Sadakat puanı hareketleri, etiket hedefli kampanya taslakları ve izinli müşteri kuyruğu
- İşletme müşterileri için tarayıcıdan çalışan CSV dışa aktarımı
- PWA kurulum, çevrimdışı durum ve yeni sürüm güncelleme deneyimi
- Multi-tenant/RBAC veritabanı temeli
- PWA build ve Netlify yapılandırması
- Durum makinesi unit testleri

## Sıradaki

1. Harici e-posta/SMS ve ödeme sağlayıcısı entegrasyonları
2. GitHub repository bağlantısı ve branch protection aktivasyonu
3. Şifreli off-site backup hedefi ve ilk restore provası
4. Gerçek cihaz PWA QA'sı ve ihtiyaç halinde Capacitor native paketleri

## Henüz geliştirilmedi

Harici ödeme/bildirim sağlayıcıları, gerçek cihaz PWA QA'sı, Capacitor native projeleri ve gelişmiş entegrasyonlar.
