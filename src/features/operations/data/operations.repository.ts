import { AppError } from '@/core/errors/app-error'
import { getSupabaseClient } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/database.types'

type PaymentMethod = Database['public']['Enums']['payment_method']

export interface BusinessReport {
  appointmentCount: number
  completedCount: number
  appointmentRevenue: number
  collectedAmount: number
  averageRating: number | null
}

export interface OutboxEntry {
  id: string
  eventKey: string
  channel: string
  recipient: string
  status: string
  createdAt: string
}

export interface PaymentRecord {
  id: string
  amount: number
  currency: string
  method: string
  status: string
  paidAt: string | null
}

export interface ReviewRecord {
  id: string
  rating: number
  comment: string | null
  isPublished: boolean
  createdAt: string
}

export interface BusinessOperations {
  report: BusinessReport
  outbox: OutboxEntry[]
  payments: PaymentRecord[]
  reviews: ReviewRecord[]
}

function requireClient() {
  const client = getSupabaseClient()
  if (!client) throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı bulunamadı.')
  return client
}

export async function getBusinessOperations(businessId: string): Promise<BusinessOperations> {
  const client = requireClient()
  const from = new Date()
  from.setDate(1)
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setMonth(to.getMonth() + 1)

  const [reportResult, outboxResult, paymentsResult, reviewsResult] = await Promise.all([
    client.rpc('get_business_report', {
      target_business_id: businessId,
      target_from: from.toISOString(),
      target_to: to.toISOString()
    }),
    client
      .from('notification_outbox')
      .select('id,event_key,channel,recipient,status,created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(20),
    client
      .from('payments')
      .select('id,amount,currency,method,status,paid_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(20),
    client
      .from('reviews')
      .select('id,rating,comment,is_published,created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(20)
  ])

  const failure = [reportResult, outboxResult, paymentsResult, reviewsResult].find(
    (result) => result.error
  )
  if (failure?.error) {
    throw new AppError('TENANT_ACCESS_DENIED', 'Operasyon verileri alınamadı.', failure.error)
  }

  const report = reportResult.data?.[0]
  return {
    report: {
      appointmentCount: Number(report?.appointment_count ?? 0),
      completedCount: Number(report?.completed_count ?? 0),
      appointmentRevenue: Number(report?.appointment_revenue ?? 0),
      collectedAmount: Number(report?.collected_amount ?? 0),
      averageRating: report?.average_rating === null || report?.average_rating === undefined
        ? null
        : Number(report.average_rating)
    },
    outbox: (outboxResult.data ?? []).map((entry) => ({
      id: entry.id,
      eventKey: entry.event_key,
      channel: entry.channel,
      recipient: entry.recipient,
      status: entry.status,
      createdAt: entry.created_at
    })),
    payments: (paymentsResult.data ?? []).map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      paidAt: payment.paid_at
    })),
    reviews: (reviewsResult.data ?? []).map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      isPublished: review.is_published,
      createdAt: review.created_at
    }))
  }
}

export async function createPayment(input: {
  businessId: string
  amount: number
  currency: string
  method: PaymentMethod
  createdBy: string
}): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('payments').insert({
    business_id: input.businessId,
    amount: input.amount,
    currency: input.currency,
    method: input.method,
    status: 'paid',
    paid_at: new Date().toISOString(),
    created_by: input.createdBy
  })
  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'Tahsilat kaydedilemedi.', error)
}

export async function setReviewPublished(reviewId: string, isPublished: boolean): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('reviews').update({ is_published: isPublished }).eq('id', reviewId)
  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'Değerlendirme durumu güncellenemedi.', error)
}

export async function submitAppointmentReview(input: {
  businessId: string
  appointmentId: string
  customerUserId: string
  rating: number
  comment?: string
}): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('reviews').insert({
    business_id: input.businessId,
    appointment_id: input.appointmentId,
    customer_user_id: input.customerUserId,
    rating: input.rating,
    ...(input.comment?.trim() ? { comment: input.comment.trim() } : {})
  })
  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'Değerlendirme kaydedilemedi.', error)
}
