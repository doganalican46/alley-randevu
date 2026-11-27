# Release checklist

- [ ] `npm ci` temiz kurulumla tamamlandı.
- [ ] `npm run check` başarılı.
- [ ] `npm run test:e2e` masaüstü, mobil ve offline senaryolarda başarılı.
- [ ] Yeni public tabloların RLS, GRANT ve allow/deny testleri var.
- [ ] Supabase Security ve Health Advisor temiz.
- [ ] Performance Advisor uyarıları değerlendirildi.
- [ ] Migration'lar production öncesi staging/local ortamda uygulandı.
- [ ] Netlify preview production Supabase projesine bağlı değil.
- [ ] Auth Site URL ve callback allowlist hedef ortamla uyumlu.
- [ ] Manifest, service worker ve SPA fallback HTTP 200 dönüyor.
- [ ] Veri yazan başarısız/eksik kontroller devre dışı ve gerekçeli.
- [ ] Backup/restore durumu ve geri dönüş planı kaydedildi.
- [ ] Şifreli backup workflow secret'ları tanımlı ve son çalışma artifact/checksum üretti.
- [ ] `main` branch protection; Quality/application ve Quality/database kontrollerini zorunlu tutuyor.
- [ ] Production deploy sonrası `npm run verify:production` başarılı.
