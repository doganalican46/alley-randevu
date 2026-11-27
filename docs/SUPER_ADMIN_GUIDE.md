# Super Admin kılavuzu

Platform yöneticiliği `user_metadata` veya frontend sabitleriyle değil, yalnızca
`public.platform_admins` tablosuyla belirlenir. İstemci rolüne bu tabloya yazma
izni verilmemiştir; ilk yönetici yalnızca Supabase SQL Editor gibi veritabanı
sahibi yetkisine sahip bir kanal üzerinden atanır.

## İlk yöneticiyi atama

1. Yönetici olacak kişi normal kayıt ekranından hesabını oluşturur ve e-posta
   doğrulamasını tamamlar.
2. Supabase SQL Editor'da aşağıdaki komut, gerçek e-posta adresiyle bir kez
   çalıştırılır:

```sql
insert into public.platform_admins (user_id)
select id
from auth.users
where lower(email) = lower('admin@example.com')
on conflict (user_id) do nothing;
```

3. Kullanıcı tekrar giriş yapar ve `/platform` adresini açar.

Bu işlem için public RPC veya açık kayıt endpoint'i bulunmaz. Platform paneli
işletme durumunu, abonelik planını ve işletmeye özel feature flag atamalarını
yönetir; değişiklikler `audit_logs` tablosuna kaydedilir. Askıya alınmış veya
arşivlenmiş bir işletme tenant sahibi tarafından yeniden etkinleştirilemez.

## Yetki kaldırma

Veritabanı sahibi aşağıdaki komutu çalıştırır:

```sql
delete from public.platform_admins
where user_id = '00000000-0000-0000-0000-000000000000';
```

Kullanıcının açık oturumunda cache bulunabileceği için işlemden sonra çıkış
yapıp yeniden giriş yapması önerilir.
