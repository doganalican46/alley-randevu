# Alley Randevu çalışma kuralları

- TypeScript strict mode açık kalmalıdır; `any` kullanmayın.
- UI bileşenlerinden doğrudan Supabase sorgusu çalıştırmayın. Erişim kodu `src/integrations` veya ilgili feature repository katmanında olmalıdır.
- Tenant tablolarında `business_id` zorunludur. Yeni public tablolar için RLS, açık GRANT listesi ve allow/deny testleri aynı değişiklikte eklenmelidir.
- Yetkilendirmede `user_metadata` kullanılmaz. `service_role` veya secret key frontend'e eklenmez.
- Migration dosyaları `supabase migration new <name>` ile oluşturulur.
- Kullanıcıya veri yazan bir kontrol çalışmıyorsa devre dışı bırakın ve nedenini açıkça gösterin; sahte başarı üretmeyin.
- UI metinleri yeni özelliklerde i18n kaynaklarına taşınmalıdır.
- Değişiklik tesliminden önce en az `npm run check` çalıştırılmalıdır.
