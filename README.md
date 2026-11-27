# Alley Randevu

Alley Randevu, farklı sektörlere hizmet verebilen multi-tenant bir SaaS randevu yönetim uygulamasıdır. React/Vite uygulaması; Supabase Auth, tenant izoleli RLS/RBAC, katalog ve ekip yönetimi, transaction güvenli randevu akışı, CRM, operasyon raporları, sadakat ve kampanya araçları, PWA desteği ve production kalite kapılarını içerir.

## Hızlı başlangıç

Gereksinimler: Node.js 22+, npm ve yerel Supabase için Docker Desktop.

```bash
npm install
copy .env.example .env.local
npm run dev
```

`.env.local` dosyasına bağımsız Alley Randevu Supabase projesinin URL ve publishable key değerlerini girin. Secret/service role key kesinlikle frontend değişkeni değildir.

```env
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## Yerel veritabanı

```bash
npm run supabase:start
npx supabase db reset
npm run supabase:test
```

Supabase bağlantısı yokken ekranlar demo görünümü olarak açılır; veri yazan işlemler devre dışıdır ve başarı taklidi yapmaz.

## Kalite kontrolleri

```bash
npm run check
```

Detaylar için [mimari](docs/ARCHITECTURE.md), [veritabanı](docs/DATABASE.md), [güvenlik](docs/SECURITY.md) ve [yol haritası](docs/ROADMAP.md) belgelerine bakın.
