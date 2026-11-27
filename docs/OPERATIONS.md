# Production operasyon runbook'u

## Günlük kontroller

- Netlify production deploy durumunu ve son build loglarını kontrol edin.
- Supabase Security, Performance ve Health Advisor sonuçlarını inceleyin.
- Auth, Data API ve Edge/Function hata oranlarında yeni artış olmadığını doğrulayın.
- Bildirim outbox'ında uzun süre `pending` veya `failed` kalan kayıtları inceleyin.

Uygulama uç noktaları aşağıdaki komutla salt okunur biçimde doğrulanabilir:

```bash
npm run verify:production
```

## Backup politikası

Production projesi ücretsiz planda kaldığı sürece düzenli mantıksal export ayrıca
alınmalıdır. Backup dosyaları repository'ye veya herkese açık CI artifact'ına
yüklenmez; şifreli, erişimi sınırlı ve farklı bir sağlayıcıdaki depoya taşınır.

Önerilen minimum plan:

- Haftalık tam logical database dump.
- Her dump sonrası dosya boyutu ve checksum doğrulaması.
- Aylık olarak yeni/geçici bir Supabase projesine restore provası.
- Storage kullanılmaya başlandığında veritabanı dump'ından ayrı object backup'ı.
- En az üç başarılı haftalık kopya ve bir aylık restore noktası saklama.

`.github/workflows/backup.yml` her pazar 05:30 Türkiye saatinde veya manuel
tetiklemeyle şema ve data dump'ı üretir. Açık SQL dosyaları artifact'a yüklenmez;
önce AES-256-CBC/PBKDF2 ile şifrelenir, SHA-256 checksum doğrulanır ve yalnızca
`.enc` ile `.sha256` dosyaları 30 gün saklanır. Workflow eksik secret olduğunda
açık hata vererek durur; sahte başarılı yedek üretmez.

GitHub repository ayarlarına aşağıdaki Actions secret'ları eklenmelidir:

- `SUPABASE_DB_URL`: Production database bağlantı URL'si. Frontend environment'ına eklenmez.
- `BACKUP_ENCRYPTION_PASSPHRASE`: Uzun ve benzersiz yedek şifreleme parolası. Database parolasından farklı olmalıdır.

İndirilen artifact doğrulaması:

```bash
npm run verify:backup -- alley-randevu-YYYYMMDDTHHMMSSZ.tar.gz.enc alley-randevu-YYYYMMDDTHHMMSSZ.tar.gz.enc.sha256
```

Restore provasında checksum doğrulandıktan sonra dosya güvenli geçici dizinde
çözülür. Şifre parolası komut satırına yazılmaz; `BACKUP_ENCRYPTION_PASSPHRASE`
environment değişkeninden okunur:

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in backup.tar.gz.enc -out backup.tar.gz -pass env:BACKUP_ENCRYPTION_PASSPHRASE
```

CLI yapısı sürüme göre değişebildiği için export öncesi komut doğrulanır:

```bash
npx supabase db dump --help
```

Bağlantı parolası komut geçmişine, repository dosyasına veya frontend environment
değişkenine yazılmaz. Restore işlemi mevcut production projesinin üzerine doğrudan
uygulanmaz; önce yeni bir projede doğrulanır.

## Restore doğrulaması

1. Yeni ve boş bir Supabase proje/ref'i hazırlayın.
2. Şema ve data dump'larını bu geçici projeye geri yükleyin.
3. Migration geçmişini, tablo sayılarını ve kritik tenant foreign key'lerini kontrol edin.
4. Security/Performance/Health Advisor çalıştırın.
5. RLS allow/deny ve rezervasyon transaction testlerini çalıştırın.
6. Sonuç başarılıysa restore zamanını, checksum'ı ve doğrulayan kişiyi kaydedin.

## Olay müdahalesi

1. Veri bütünlüğü riski varsa yazma etkisi bulunan UI kontrollerini kapatın.
2. İlgili Netlify deploy ve Supabase log zaman aralığını kaydedin.
3. Etkilenen tenant ve tablo kapsamını RLS'i devre dışı bırakmadan belirleyin.
4. Düzeltmeyi migration ve testlerle hazırlayın; production'a doğrudan geçici SQL bırakmayın.
5. Gerekirse yeni projeye restore edin ve doğrulama tamamlanmadan DNS/yönlendirme değiştirmeyin.

## Secret rotasyonu

- Publishable key public istemci içindir; secret/service role key frontend'e eklenmez.
- Database parolası veya server secret sızarsa hemen rotate edilir.
- Rotasyon sonrası Netlify environment, CI secret ve server tarafı entegrasyonları güncellenir.
- Eski değerle erişimin başarısız olduğu doğrulanır.
