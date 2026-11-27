# Mimari

Uygulama feature-based modüler monolit olarak tasarlanır. `src/app` composition/routing, `src/core` sağlayıcıdan bağımsız domain kuralları, `src/features` kullanıcı akışları, `src/integrations` harici sistem adaptörleri ve `src/shared` ortak UI bileşenlerini içerir.

UI → feature service/hook → repository → Supabase client yönü korunur. Güvenlik kritik kurallar RLS, constraint, trigger veya kontrollü RPC ile veritabanında tekrar uygulanır.

İlk ADR: path tabanlı tenant routing (`/b/:slug`, `/business/:businessId`) kullanılır. Domain resolver ileride subdomain/custom domain desteğini UI'dan bağımsız ekleyebilmelidir.
