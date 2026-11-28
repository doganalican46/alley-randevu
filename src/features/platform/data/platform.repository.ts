import { AppError } from '@/core/errors/app-error'
import { getSupabaseClient } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/database.types'

type BusinessStatus = Database['public']['Enums']['business_status']
type SubscriptionStatus = Database['public']['Enums']['subscription_status']

export interface PlatformBusiness {
  id: string
  name: string
  slug: string
  status: BusinessStatus
  isPublished: boolean
  createdAt: string
  subscription: {
    planId: string
    status: SubscriptionStatus
  } | null
}

export interface SubscriptionPlan {
  id: string
  code: string
  name: string
  monthlyPrice: number
  currency: string
  isActive: boolean
}

export interface FeatureFlag {
  id: string
  key: string
  label: string
  description: string | null
  isActive: boolean
}

export interface AuditLog {
  id: number
  businessId: string
  action: string
  entityType: string
  createdAt: string
}

export interface PlatformSnapshot {
  businesses: PlatformBusiness[]
  plans: SubscriptionPlan[]
  featureFlags: FeatureFlag[]
  featureAssignments: Array<{
    businessId: string
    featureFlagId: string
    enabled: boolean
  }>
  auditLogs: AuditLog[]
}

function requireClient() {
  const client = getSupabaseClient()
  if (!client) throw new AppError('NETWORK_ERROR', 'Supabase bağlantısı bulunamadı.')
  return client
}

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const client = requireClient()
  const { data, error } = await client
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'Platform yetkisi doğrulanamadı.', error)
  return data?.user_id === userId
}

export async function getPlatformSnapshot(): Promise<PlatformSnapshot> {
  const client = requireClient()
  const [
    businessResult,
    planResult,
    subscriptionResult,
    featureResult,
    assignmentResult,
    auditResult
  ] = await Promise.all([
    client
      .from('businesses')
      .select('id,name,slug,status,is_published,created_at')
      .order('created_at', { ascending: false }),
    client
      .from('subscription_plans')
      .select('id,code,name,monthly_price,currency,is_active')
      .order('monthly_price'),
    client.from('business_subscriptions').select('business_id,plan_id,status'),
    client.from('feature_flags').select('id,key,label,description,is_active').order('label'),
    client.from('business_feature_flags').select('business_id,feature_flag_id,enabled'),
    client
      .from('audit_logs')
      .select('id,business_id,action,entity_type,created_at')
      .order('created_at', { ascending: false })
      .limit(12)
  ])

  const failure = [
    businessResult,
    planResult,
    subscriptionResult,
    featureResult,
    assignmentResult,
    auditResult
  ].find((result) => result.error)
  if (failure?.error) {
    throw new AppError('TENANT_ACCESS_DENIED', 'Platform verileri alınamadı.', failure.error)
  }

  const subscriptions = new Map(
    (subscriptionResult.data ?? []).map((subscription) => [
      subscription.business_id,
      { planId: subscription.plan_id, status: subscription.status }
    ])
  )

  return {
    businesses: (businessResult.data ?? []).map((business) => ({
      id: business.id,
      name: business.name,
      slug: business.slug,
      status: business.status,
      isPublished: business.is_published,
      createdAt: business.created_at,
      subscription: subscriptions.get(business.id) ?? null
    })),
    plans: (planResult.data ?? []).map((plan) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      monthlyPrice: plan.monthly_price,
      currency: plan.currency,
      isActive: plan.is_active
    })),
    featureFlags: (featureResult.data ?? []).map((flag) => ({
      id: flag.id,
      key: flag.key,
      label: flag.label,
      description: flag.description,
      isActive: flag.is_active
    })),
    featureAssignments: (assignmentResult.data ?? []).map((assignment) => ({
      businessId: assignment.business_id,
      featureFlagId: assignment.feature_flag_id,
      enabled: assignment.enabled
    })),
    auditLogs: (auditResult.data ?? []).map((entry) => ({
      id: entry.id,
      businessId: entry.business_id,
      action: entry.action,
      entityType: entry.entity_type,
      createdAt: entry.created_at
    }))
  }
}

export async function setBusinessFeatureFlag(
  businessId: string,
  featureFlagId: string,
  enabled: boolean,
  updatedBy: string
): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('business_feature_flags').upsert(
    {
      business_id: businessId,
      feature_flag_id: featureFlagId,
      enabled,
      updated_by: updatedBy
    },
    { onConflict: 'business_id,feature_flag_id' }
  )
  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'Özellik ataması güncellenemedi.', error)
}

export async function updatePlatformBusinessStatus(
  businessId: string,
  status: BusinessStatus
): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('businesses').update({ status }).eq('id', businessId)
  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'İşletme durumu güncellenemedi.', error)
}

export async function assignBusinessPlan(
  businessId: string,
  planId: string,
  updatedBy: string
): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('business_subscriptions').upsert(
    {
      business_id: businessId,
      plan_id: planId,
      status: 'active',
      updated_by: updatedBy
    },
    { onConflict: 'business_id' }
  )
  if (error) throw new AppError('TENANT_ACCESS_DENIED', 'Abonelik planı güncellenemedi.', error)
}
