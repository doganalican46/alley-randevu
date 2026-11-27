export const demoBusiness = {
  name: 'Alley Barber',
  slug: 'alley-barber',
  initials: 'AB',
  rating: 4.9,
  reviewCount: 128,
  address: 'Moda Caddesi No: 42, Kadıköy',
  phone: '+90 212 555 01 01',
  description:
    'Modern kesimler, klasik ustalık. Kendinize ayırdığınız zamanı iyi hissettiren bir deneyime dönüştürüyoruz.',
  services: [
    { id: 'hair', name: 'Saç kesimi', duration: 30, price: 550 },
    { id: 'beard', name: 'Sakal tıraşı', duration: 20, price: 350 },
    { id: 'combo', name: 'Saç & sakal', duration: 50, price: 800 }
  ],
  staff: [
    { id: 'any', name: 'Fark etmez', role: 'İlk müsait uzman' },
    { id: 'emre', name: 'Emre', role: 'Kıdemli berber' },
    { id: 'kaan', name: 'Kaan', role: 'Stil danışmanı' }
  ]
} as const
