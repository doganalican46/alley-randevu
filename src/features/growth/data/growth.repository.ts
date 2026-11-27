import { AppError } from '@/core/errors/app-error'
import { getSupabaseClient } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/database.types'

type CampaignChannel = Extract<Database['public']['Enums']['notification_channel'], 'email' | 'sms'>

export interface GrowthCustomer {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  tags: string[]
  marketingConsent: boolean
  isActive: boolean
  pointsBalance: number
  lifetimeEarned: number
}

export interface GrowthCampaign {
  id: string
  name: string
  channel: CampaignChannel
  audienceTag: string | null
  status: string
  recipientCount: number
  createdAt: string
}

export interface GrowthData {
  customers: GrowthCustomer[]
  campaigns: GrowthCampaign[]
}

export interface CreateCampaignInput {
  businessId: string
  createdBy: string
  name: string
  channel: CampaignChannel
  subject?: string
  body: string
  audienceTag?: string
}

function requireClient() {
  const client = getSupabaseClient()
  if (!client) throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı bulunamadı.')
  return client
}

export async function getGrowthData(businessId: string): Promise<GrowthData> {
  const client = requireClient()
  const [customersResult, accountsResult, campaignsResult] = await Promise.all([
    client
      .from('business_customers')
      .select('id,full_name,email,phone,tags,marketing_consent,is_active')
      .eq('business_id', businessId)
      .order('full_name'),
    client
      .from('customer_loyalty_accounts')
      .select('customer_id,points_balance,lifetime_earned')
      .eq('business_id', businessId),
    client
      .from('campaigns')
      .select('id,name,channel,audience_tag,status,recipient_count,created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(30)
  ])

  const failure = [customersResult, accountsResult, campaignsResult].find((result) => result.error)
  if (failure?.error) {
    throw new AppError('TENANT_ACCESS_DENIED', 'Büyüme verileri alınamadı.', failure.error)
  }

  const accountByCustomer = new Map(
    (accountsResult.data ?? []).map((account) => [account.customer_id, account])
  )

  return {
    customers: (customersResult.data ?? []).map((customer) => {
      const account = accountByCustomer.get(customer.id)
      return {
        id: customer.id,
        fullName: customer.full_name,
        email: customer.email,
        phone: customer.phone,
        tags: customer.tags,
        marketingConsent: customer.marketing_consent,
        isActive: customer.is_active,
        pointsBalance: account?.points_balance ?? 0,
        lifetimeEarned: account?.lifetime_earned ?? 0
      }
    }),
    campaigns: (campaignsResult.data ?? []).map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      channel: campaign.channel as CampaignChannel,
      audienceTag: campaign.audience_tag,
      status: campaign.status,
      recipientCount: campaign.recipient_count,
      createdAt: campaign.created_at
    }))
  }
}

export async function adjustCustomerLoyalty(input: {
  businessId: string
  customerId: string
  pointsDelta: number
  reason: string
}): Promise<number> {
  const client = requireClient()
  const { data, error } = await client.rpc('adjust_customer_loyalty', {
    target_business_id: input.businessId,
    target_customer_id: input.customerId,
    target_points_delta: input.pointsDelta,
    target_reason: input.reason.trim()
  })
  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'Sadakat puanı güncellenemedi.', error)
  return data
}

export async function createCampaign(input: CreateCampaignInput): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('campaigns').insert({
    business_id: input.businessId,
    created_by: input.createdBy,
    name: input.name.trim(),
    channel: input.channel,
    body: input.body.trim(),
    ...(input.subject?.trim() ? { subject: input.subject.trim() } : {}),
    ...(input.audienceTag?.trim() ? { audience_tag: input.audienceTag.trim() } : {})
  })
  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'Kampanya oluşturulamadı.', error)
}

export async function queueCampaign(campaignId: string): Promise<number> {
  const client = requireClient()
  const { data, error } = await client.rpc('queue_campaign', { target_campaign_id: campaignId })
  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'Kampanya kuyruğa alınamadı.', error)
  return data
}
