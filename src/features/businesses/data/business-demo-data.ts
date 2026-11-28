import type { BusinessCustomer } from '@/features/customers/data/customers.repository'
import type { GrowthData } from '@/features/growth/data/growth.repository'
import type { BusinessOperations } from '@/features/operations/data/operations.repository'

export const demoBusinessCustomers: BusinessCustomer[] = [
  {
    id: 'demo-customer-aylin',
    fullName: 'Aylin Demir',
    email: 'aylin@example.com',
    phone: '+90 555 010 20 30',
    tags: ['VIP', 'Düzenli'],
    appointmentCount: 12,
    lastAppointmentAt: '2026-11-26T10:30:00.000Z',
    marketingConsent: true,
    isActive: true
  },
  {
    id: 'demo-customer-mert',
    fullName: 'Mert Kaya',
    email: 'mert@example.com',
    phone: '+90 555 040 50 60',
    tags: ['Yeni'],
    appointmentCount: 3,
    lastAppointmentAt: '2026-11-24T14:00:00.000Z',
    marketingConsent: true,
    isActive: true
  },
  {
    id: 'demo-customer-selin',
    fullName: 'Selin Yılmaz',
    email: 'selin@example.com',
    phone: null,
    tags: ['Kurumsal'],
    appointmentCount: 7,
    lastAppointmentAt: '2026-11-18T09:00:00.000Z',
    marketingConsent: false,
    isActive: false
  }
]

export const demoBusinessOperations: BusinessOperations = {
  report: {
    appointmentCount: 48,
    completedCount: 41,
    appointmentRevenue: 42_750,
    collectedAmount: 39_600,
    averageRating: 4.8
  },
  outbox: [
    {
      id: 'demo-notification-1',
      eventKey: 'appointment_confirmed',
      channel: 'email',
      recipient: 'aylin@example.com',
      status: 'pending',
      createdAt: '2026-11-28T08:15:00.000Z'
    },
    {
      id: 'demo-notification-2',
      eventKey: 'appointment_created',
      channel: 'sms',
      recipient: '+90 555 040 50 60',
      status: 'pending',
      createdAt: '2026-11-28T07:40:00.000Z'
    }
  ],
  payments: [],
  reviews: [
    {
      id: 'demo-review-1',
      rating: 5,
      comment: 'Çok ilgili ve dakik bir ekip.',
      isPublished: true,
      createdAt: '2026-11-27T16:20:00.000Z'
    },
    {
      id: 'demo-review-2',
      rating: 4,
      comment: 'Randevu süreci çok kolaydı.',
      isPublished: false,
      createdAt: '2026-11-25T11:05:00.000Z'
    }
  ]
}

export const demoGrowthData: GrowthData = {
  customers: demoBusinessCustomers.map((customer, index) => ({
    id: customer.id,
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone,
    tags: customer.tags,
    marketingConsent: customer.marketingConsent,
    isActive: customer.isActive,
    pointsBalance: [820, 240, 0][index] ?? 0,
    lifetimeEarned: [1_650, 420, 300][index] ?? 0
  })),
  campaigns: [
    {
      id: 'demo-campaign-1',
      name: 'Kış bakımı',
      channel: 'email',
      audienceTag: 'VIP',
      status: 'queued',
      recipientCount: 18,
      createdAt: '2026-11-26T12:00:00.000Z'
    },
    {
      id: 'demo-campaign-2',
      name: 'Yeni müşteri karşılama',
      channel: 'sms',
      audienceTag: 'Yeni',
      status: 'draft',
      recipientCount: 0,
      createdAt: '2026-11-28T09:30:00.000Z'
    }
  ]
}
