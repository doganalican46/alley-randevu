# Deployment

Netlify build komutu `npm run build`, publish dizini `dist` olarak ayarlıdır. SPA fallback ve temel güvenlik header'ları `netlify.toml` içindedir.

Production, staging ve deploy preview ortamlarında ayrı Supabase projeleri kullanılmalıdır. Preview ortamı production veritabanına bağlanmamalıdır. Auth Site URL ve redirect allowlist değerlerine gerçek Netlify URL'leri eklenmelidir.

Uzak Supabase projesine migration göndermeden önce local reset, DB testleri ve advisor çıktısı doğrulanmalıdır.

`.github/workflows/quality.yml` GitHub repository bağlantısı yapıldığında lint,
strict typecheck, unit test, production build, masaüstü/mobil/offline E2E ve local
Supabase pgTAP testlerini çalıştırır. Netlify deploy'u bu kalite kapısı geçmeden
production branch'ten tetiklenmemelidir.

Önerilen GitHub branch protection ayarı `main` için doğrudan push'u kapatır,
en az bir pull request onayı ister ve `Quality / application` ile
`Quality / database` kontrollerini zorunlu tutar. Şifreli haftalık production
backup workflow'u için [OPERATIONS.md](./OPERATIONS.md) içindeki secret ve restore
adımları uygulanır.

Release öncesi [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md), olay ve backup
işlemleri için [OPERATIONS.md](./OPERATIONS.md) izlenir.
