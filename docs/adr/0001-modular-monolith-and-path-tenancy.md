# ADR 0001: Modüler monolit ve path tabanlı tenant

Durum: Kabul edildi — 2026-11-26

Tek React kod tabanı ve tek Supabase projesi içinde feature-based modüler monolit kullanılacaktır. Tenant public sayfaları başlangıçta `/b/:slug` ile çözümlenir. Bu yaklaşım düşük operasyon maliyeti, kolay deployment ve kontrollü domain ayrımı sağlar. Subdomain/custom domain resolver daha sonra aynı tenant kimliğini üretecek ayrı bir adaptör olarak eklenebilir.
