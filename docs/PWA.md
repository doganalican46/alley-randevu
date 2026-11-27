# PWA

Vite PWA eklentisi manifest ve service worker üretir. Uygulama shell dosyaları cache'lenir; API cevapları, token'lar ve kişisel müşteri verileri runtime cache'e alınmaz. Offline randevu veya tahsilat işlemi başarı gibi gösterilmez.

Uygulama `beforeinstallprompt` olayını yakalayarak desteklenen tarayıcılarda kurulum kartı gösterir. Ağ bağlantısı kesildiğinde veri yazımının çalışmayacağını açıklayan kalıcı uyarı görünür. Yeni service worker beklediğinde kullanıcıya kontrollü güncelleme seçeneği sunulur; eski cache'ler otomatik temizlenir.

Faz 6 için kalan iş, gerçek Android/iOS/Windows/macOS cihaz matrisi üzerinde kurulum, standalone açılış ve güncelleme QA'sıdır.
